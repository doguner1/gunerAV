// Güner AV - Tedarikçi Sayfası Gelişmiş İçerik Yakalayıcı (Content Script)
// AvAlemi / IdeaSoft, Ticimax, T-Soft, Shopify ve standart e-ticaret siteleri ile %100 uyumlu.

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXTRACT_PRODUCT") {
      try {
        const data = extractProductData();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    }
    return true;
  });
}

function extractProductData() {
  const result = {
    title: "",
    brand: "",
    model: "",
    category: "",
    price: null,
    images: [],
    specs: {},
    description: "",
  };

  const html = document.documentElement.innerHTML;

  // =========================================================================
  // 1. Script & Meta Veri Taraması (IdeaSoft pageParams, dataLayer vb.)
  // =========================================================================
  try {
    // Brand from scripts
    const brandScriptMatch = html.match(/brandName\s*:\s*["']([^"']+)["']/i);
    if (brandScriptMatch && brandScriptMatch[1].trim()) {
      result.brand = brandScriptMatch[1].trim();
    }

    // SKU from scripts
    const skuScriptMatch = html.match(/sku\s*:\s*["']([^"']+)["']/i);
    if (skuScriptMatch && skuScriptMatch[1].trim()) {
      result.model = skuScriptMatch[1].trim();
      result.specs["Stok Kodu"] = skuScriptMatch[1].trim();
    }

    // Category from scripts
    const catScriptMatch = html.match(/categoryName\s*:\s*["']([^"']+)["']/i);
    if (catScriptMatch && catScriptMatch[1].trim()) {
      result.category = catScriptMatch[1].trim();
      result.specs["Kategori"] = catScriptMatch[1].trim();
    }

    // Price from scripts
    const priceScriptMatch = html.match(/salePrice\s*:\s*([\d\.]+)/i);
    if (priceScriptMatch && !isNaN(parseFloat(priceScriptMatch[1]))) {
      result.price = Math.round(parseFloat(priceScriptMatch[1]));
    }

    // Full Name from scripts
    const nameScriptMatch = html.match(/fullName\s*:\s*["']([^"']+)["']/i);
    if (nameScriptMatch && nameScriptMatch[1].trim()) {
      result.title = nameScriptMatch[1].trim();
    }
  } catch (e) {
    console.warn("Script parsing fallback:", e);
  }

  // =========================================================================
  // 2. Ürün Başlığı (Title)
  // =========================================================================
  if (!result.title) {
    const h1 = document.querySelector("h1");
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (h1 && h1.textContent.trim()) {
      result.title = h1.textContent.trim();
    } else if (ogTitle && ogTitle.content) {
      result.title = ogTitle.content.trim();
    } else {
      result.title = document.title.split(/[-|]/)[0].trim();
    }
  }

  // =========================================================================
  // 3. Marka Tespiti (Brand)
  // =========================================================================
  if (!result.brand) {
    const brandSelectors = [
      '[itemprop="brand"] [itemprop="name"]',
      '[itemprop="brand"]',
      '.product-brands .product-list-content a',
      '.product-brands .product-list-content',
      'a[href*="/marka/"]',
      '.brand-name',
      '.brand a',
      '.product-brand',
    ];

    for (const sel of brandSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute("content") || el.textContent;
        if (val && val.trim() && val.trim().length < 40) {
          result.brand = val.trim();
          break;
        }
      }
    }
  }

  if (result.brand) {
    result.specs["Marka"] = result.brand;
  }

  // =========================================================================
  // 4. Kategori Tespiti (Category)
  // =========================================================================
  if (!result.category) {
    const catSelectors = [
      '.product-categories .product-list-content a',
      '.product-categories .product-list-content',
      'a[href*="/kategori/"]',
      '.breadcrumb li:nth-last-child(2) a',
      '.breadcrumbs li:nth-last-child(2) a',
    ];

    for (const sel of catSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        result.category = el.textContent.trim();
        result.specs["Kategori"] = result.category;
        break;
      }
    }
  }

  // =========================================================================
  // 5. Model Tespiti (Model / SKU)
  // =========================================================================
  if (!result.model) {
    // Check title for common model patterns (e.g. MOD-505, Ranger 8, 300 Cm, CFX Pro)
    const titleModelMatch = result.title.match(/(MOD[-\s]?\d+|Ranger\s*\d+|Neo\s*\d+|Renova|\b\d{3,4}\s*cm\b|[A-Z]{2,}-\d+)/i);
    if (titleModelMatch) {
      result.model = titleModelMatch[1].trim();
    }
  }

  // =========================================================================
  // 6. Fiyat Tespiti (Price)
  // =========================================================================
  if (!result.price) {
    const priceSelectors = [
      ".price",
      ".product-price",
      "[itemprop='price']",
      ".current-price",
      ".sale-price",
      ".product-price-current",
    ];

    let foundPriceEl = null;
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) {
        foundPriceEl = el;
        break;
      }
    }

    if (!foundPriceEl) {
      foundPriceEl = Array.from(document.querySelectorAll("span, div")).find((el) =>
        /(\d+[\.,]\d{2}|\d+)\s*(TL|₺)/i.test(el.textContent) &&
        el.children.length === 0 &&
        !el.textContent.toLowerCase().includes("havale") &&
        !el.textContent.toLowerCase().includes("taksit")
      );
    }

    if (foundPriceEl) {
      const rawPrice = foundPriceEl.textContent.replace(/[^\d,\.]/g, "").replace(",", ".");
      const num = parseFloat(rawPrice);
      if (!isNaN(num)) result.price = Math.round(num);
    }
  }

  // =========================================================================
  // 7. Görsel URL'leri (Image Gallery)
  // =========================================================================
  const imageSet = new Set();

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content && !ogImage.content.includes("logo")) {
    imageSet.add(cleanImageUrl(ogImage.content));
  }

  const galleryImgs = document.querySelectorAll(
    ".product-image img, .gallery img, .product-gallery img, .swiper-slide img, .carousel-item img, [data-zoom-image], a[data-standard], #product-thumb-image a, #product-thumb-image img, .thumb-item a"
  );

  galleryImgs.forEach((el) => {
    let src =
      el.getAttribute("data-zoom-image") ||
      el.parentElement?.getAttribute("data-zoom-image") ||
      el.parentElement?.getAttribute("data-image") ||
      el.getAttribute("data-image") ||
      el.getAttribute("data-large") ||
      el.parentElement?.getAttribute("data-large") ||
      el.getAttribute("data-original") ||
      el.getAttribute("data-highres") ||
      el.getAttribute("data-standard") ||
      el.getAttribute("data-src") ||
      (el.tagName === "A" && el.href && !el.href.endsWith("#") ? el.href : "") ||
      el.src;

    if (src) {
      const cleaned = cleanImageUrl(src);
      if (cleaned && !cleaned.includes("logo") && !cleaned.includes("icon") && !cleaned.includes("banner")) {
        imageSet.add(cleaned);
      }
    }
  });

  // Fallback images
  if (imageSet.size === 0) {
    document.querySelectorAll("img").forEach((img) => {
      let s = img.src;
      if (s && (img.naturalWidth > 250 || img.width > 250)) {
        const cleaned = cleanImageUrl(s);
        if (cleaned && !cleaned.includes("logo") && !cleaned.includes("icon")) {
          imageSet.add(cleaned);
        }
      }
    });
  }

  result.images = Array.from(imageSet).slice(0, 8);

  // =========================================================================
  // 8. Teknik Özellikler Tablosu ve Liste Satırları (Specs)
  // =========================================================================
  const specs = { ...result.specs };

  // A. IdeaSoft / AvAlemi .product-list-row satırları
  const listRows = document.querySelectorAll(".product-list-row, .product-feature-row, .feature-row, .spec-row");
  listRows.forEach((row) => {
    const titleEl = row.querySelector(".product-list-title, .title, .feature-title, dt");
    const contentEl = row.querySelector(".product-list-content, .content, .value, .feature-desc, dd");
    if (titleEl && contentEl) {
      const key = titleEl.textContent.replace(/[:]/g, "").trim();
      const val = contentEl.textContent.replace(/\s+/g, " ").trim();
      if (
        key &&
        val &&
        key.length < 40 &&
        val.length < 150 &&
        !key.toLowerCase().includes("havale") &&
        !key.toLowerCase().includes("taksit")
      ) {
        specs[key] = val;
      }
    }
  });

  // B. HTML Tabloları (table tr th/td)
  const tables = document.querySelectorAll("table, .tech-specs, .specifications, dl");
  tables.forEach((table) => {
    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("th, td");
      if (cells.length >= 2) {
        const key = cells[0].textContent.replace(/[:]/g, "").trim();
        const value = cells[1].textContent.replace(/\s+/g, " ").trim();
        if (key && value && key.length < 50 && value.length < 200) {
          specs[key] = value;
        }
      }
    });

    // dl / dt / dd
    const dts = table.querySelectorAll("dt");
    dts.forEach((dt) => {
      const dd = dt.nextElementSibling;
      if (dd && dd.tagName.toLowerCase() === "dd") {
        const key = dt.textContent.replace(/[:]/g, "").trim();
        const value = dd.textContent.replace(/\s+/g, " ").trim();
        if (key && value) specs[key] = value;
      }
    });
  });

  // C. Ürün Bilgisi / Detay Metninden Özellik Çıkarımı (.product-detail)
  const detailEl = document.querySelector(".product-detail, .product-description, #tab-description, [itemprop='description']");
  if (detailEl) {
    const rawText = detailEl.textContent.replace(/&nbsp;/g, " ");
    const lines = rawText
      .split(/\n|\r|\./)
      .map((l) => l.replace(/\s+/g, " ").trim())
      .filter((l) => l.length > 5 && l.length < 150);

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (line.includes(":")) {
        const parts = line.split(":");
        const k = parts[0].trim();
        const v = parts.slice(1).join(":").trim();
        if (k.length > 2 && k.length < 35 && v.length > 1 && v.length < 100) {
          specs[k] = v;
        }
      } else if (lower.includes("misina") && !specs["Misina"]) {
        specs["Misina"] = line;
      } else if ((lower.includes("kamış") || lower.includes("karbon") || lower.includes("fiberglas")) && !specs["Kamış Yapısı"]) {
        specs["Kamış Yapısı"] = line;
      } else if (lower.includes("kurulu") && !specs["Kurulum"]) {
        specs["Kurulum"] = line;
      } else if ((lower.includes("kaldır") || lower.includes("kiloluk") || lower.includes("kapasite")) && !specs["Taşıma Kapasitesi"]) {
        specs["Taşıma Kapasitesi"] = line.replace(/[\(\)]/g, "").trim();
      }
    });

    result.description = lines.slice(0, 5).join(". ") + ".";
  }

  // D. Başlıktan ekstra özellikler
  const lengthMatch = result.title.match(/(\d{2,4}\s*cm)/i);
  if (lengthMatch && !specs["Kamış Boyu"] && !specs["Uzunluk"]) {
    specs["Uzunluk"] = lengthMatch[1];
  }

  result.specs = specs;

  // Marka / Model tekrar kontrolü
  if (!result.brand && (specs["Marka"] || specs["Brand"])) {
    result.brand = specs["Marka"] || specs["Brand"];
  }
  if (!result.model && specs["Model"]) {
    result.model = specs["Model"];
  }

  return result;
}

function cleanImageUrl(url) {
  let u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("//")) u = "https:" + u;

  // IdeaSoft: _min.jpeg / _thumb.jpeg -> .jpeg (veya varsa _max.jpeg)
  u = u.replace(/_min\.(jpe?g|png|webp)/i, ".$1");
  u = u.replace(/_thumb\.(jpe?g|png|webp)/i, ".$1");

  // Ticimax: /kucuk/ veya /orta/ -> /buyuk/
  u = u.replace(/\/Uploads\/UrunResimleri\/(kucuk|orta)\//gi, "/Uploads/UrunResimleri/buyuk/");

  // T-Soft: /images/urunler/k_ -> /images/urunler/b_
  u = u.replace(/\/images\/urunler\/k_/gi, "/images/urunler/b_");

  // Shopify: _small. / _medium. / _compact. / _large. / _400x400. -> .
  u = u.replace(/_(small|medium|compact|large|100x100|200x200|400x400|600x600)\.(jpe?g|png|webp)/i, ".$2");

  // WooCommerce: -150x150. / -300x300. / -600x600. -> .
  u = u.replace(/-\d{3,4}x\d{3,4}\.(jpe?g|png|webp)/i, ".$1");

  // Boyut küçülten query parametrelerini temizle (?w=300, ?width=400 vb.)
  u = u.replace(/([?&])(w|width|h|height|size|resize)=\d+(&|$)/gi, "$1");
  u = u.replace(/[?&]$/, "");

  return u;
}
