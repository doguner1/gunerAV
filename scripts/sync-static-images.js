const fs = require("fs");
const path = require("path");

const SITE_BASE_URL = "https://www.gunerav.site";
const PUBLIC_DIR = path.join(process.cwd(), "public", "products");
const MAP_FILE = path.join(process.cwd(), "src", "lib", "static-images-map.json");
const PRODUCTS_JSON_FILE = path.join(process.cwd(), "data", "products.json");

// Helper: Sanitize string for filesystem paths
function sanitizeName(str) {
  return String(str || "item")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Helper: Parallel pool limit
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);
    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

// Fetch all live products from https://www.gunerav.site/tr/products SSR payload
async function fetchLiveProducts() {
  console.log(`[Sync] Canlı siteden ürün kataloğu çekiliyor (${SITE_BASE_URL}/tr/products)...`);
  const res = await fetch(`${SITE_BASE_URL}/tr/products`);
  if (!res.ok) {
    throw new Error(`Canlı siteye bağlanılamadı: HTTP ${res.status}`);
  }
  const html = await res.text();
  const idx = html.indexOf("initialProducts");
  if (idx === -1) {
    throw new Error("Canlı sitede initialProducts JSON verisi bulunamadı.");
  }
  const start = html.indexOf("[", idx);

  let depth = 0;
  let inString = false;
  let end = -1;

  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (c === '\"' && html[i - 1] !== '\\\\') {
      inString = !inString;
    } else if (!inString) {
      if (c === '[') depth++;
      else if (c === ']') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
  }

  const slice = html.substring(start, end);
  const jsonStr = JSON.parse('\"' + slice + '\"');
  const products = JSON.parse(jsonStr);
  console.log(`[Sync] Toplam ${products.length} adet ürün başarıyla okundu.\n`);
  return products;
}

// Download a single image if not already cached on disk
async function downloadImageIfNeeded(imgUrl, targetDiskPath) {
  if (fs.existsSync(targetDiskPath)) {
    const stat = fs.statSync(targetDiskPath);
    if (stat.size > 1000) {
      return { skipped: true, size: stat.size };
    }
  }

  // Ensure parent directory exists
  fs.mkdirSync(path.dirname(targetDiskPath), { recursive: true });

  const absoluteUrl = imgUrl.startsWith("http")
    ? imgUrl
    : `${SITE_BASE_URL}${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;

  const res = await fetch(absoluteUrl);
  if (!res.ok) {
    throw new Error(`Resim indirilemedi: ${absoluteUrl} (HTTP ${res.status})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) {
    throw new Error(`İndirilen resim boş: ${absoluteUrl}`);
  }

  fs.writeFileSync(targetDiskPath, buf);
  return { skipped: false, size: buf.length };
}

async function run() {
  console.log("==================================================");
  console.log("🚀 GÜNER AV - STATİK GÖRSEL SENKRONİZASYON MOTORU");
  console.log("==================================================");

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const products = await fetchLiveProducts();
  const staticMap = {};

  // Build download queue
  const downloadTasks = [];

  for (const p of products) {
    const slug = sanitizeName(p.slug_tr || p.id);
    const productDir = path.join(PUBLIC_DIR, slug);

    const mappedBaseImages = [];
    const baseImages = Array.isArray(p.images) ? p.images : [];

    baseImages.forEach((imgUrl, idx) => {
      const fileName = `base-${idx}.webp`;
      const diskPath = path.join(productDir, fileName);
      const webPath = `/products/${slug}/${fileName}`;
      mappedBaseImages.push(webPath);

      downloadTasks.push({
        url: imgUrl,
        diskPath,
        webPath,
        label: `${slug} (Ana Resim #${idx + 1})`,
      });
    });

    const mappedVariants = [];
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      p.variants.forEach((v, vIdx) => {
        const colorName = sanitizeName(v.color_code || v.name || `renk-${vIdx + 1}`);
        const vImages = Array.isArray(v.images) ? v.images : [];
        const mappedVImages = [];

        vImages.forEach((imgUrl, imgIdx) => {
          const fileName = `variant-${colorName}-${imgIdx}.webp`;
          const diskPath = path.join(productDir, fileName);
          const webPath = `/products/${slug}/${fileName}`;
          mappedVImages.push(webPath);

          downloadTasks.push({
            url: imgUrl,
            diskPath,
            webPath,
            label: `${slug} (Varyant: ${colorName} #${imgIdx + 1})`,
          });
        });

        mappedVariants.push({
          ...v,
          images: mappedVImages,
        });
      });
    }

    staticMap[p.slug_tr || p.id] = {
      images: mappedBaseImages,
      variants: mappedVariants.length > 0 ? mappedVariants : undefined,
    };
    if (p.slug_en && p.slug_en !== p.slug_tr) {
      staticMap[p.slug_en] = staticMap[p.slug_tr || p.id];
    }
  }

  console.log(`[Sync] Toplam ${downloadTasks.length} adet görsel taranacak...`);

  let downloadedCount = 0;
  let skippedCount = 0;
  let totalBytes = 0;

  await asyncPool(6, downloadTasks, async (task) => {
    try {
      const result = await downloadImageIfNeeded(task.url, task.diskPath);
      totalBytes += result.size;
      if (result.skipped) {
        skippedCount++;
      } else {
        downloadedCount++;
        console.log(`✅ [İNDİRİLDİ] ${task.label} (${Math.round(result.size / 1024)} KB) -> ${task.webPath}`);
      }
    } catch (err) {
      console.error(`❌ [HATA] ${task.label}:`, err.message);
    }
  });

  // Save static-images-map.json
  fs.writeFileSync(MAP_FILE, JSON.stringify(staticMap, null, 2), "utf8");
  console.log(`\n📄 [Kayıt] static-images-map.json başarıyla güncellendi.`);

  // Update local data/products.json with these full products
  const updatedLocalProducts = products.map((p) => {
    const slugKey = p.slug_tr || p.id;
    const mapping = staticMap[slugKey];
    if (mapping) {
      return {
        ...p,
        images: mapping.images && mapping.images.length > 0 ? mapping.images : p.images,
        variants: mapping.variants || p.variants,
      };
    }
    return p;
  });

  fs.writeFileSync(PRODUCTS_JSON_FILE, JSON.stringify(updatedLocalProducts, null, 2), "utf8");
  console.log(`📄 [Kayıt] data/products.json yerel yedeği güncellendi.`);

  console.log("\n==================================================");
  console.log("🎉 SENKRONİZASYON TAMAMLANDI!");
  console.log(`- Yeni İndirilen Resim: ${downloadedCount}`);
  console.log(`- Zaten Var Olan (Atlanan): ${skippedCount}`);
  console.log(`- Toplam Boyut: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Fatal sync error:", err);
  process.exit(1);
});
