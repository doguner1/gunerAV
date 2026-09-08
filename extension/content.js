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

  // Bilinen Av & Silah Markaları Listesi ve Başlıktan Marka Çıkarımı
  const KNOWN_BRANDS = [
    "Castello", "Arslan", "Husan", "Derya", "Armsan", "Ata Arms", "Ata",
    "Stoeger", "Beretta", "Benelli", "Browning", "Winchester", "Hatsan",
    "Kral Arms", "Kral", "Retay", "Huğlu", "Huglu", "Akdaş", "Akdas",
    "Yıldız", "Yildiz", "Sarsılmaz", "Sarsilmaz", "Canik", "Girsan",
    "Tisaş", "Tisas", "Steiner", "Zeiss", "Swarovski", "Optisan", "Hawke", "Vortex"
  ];

  if (!result.brand && result.title) {
    for (const b of KNOWN_BRANDS) {
      const regex = new RegExp(`\\b${b}\\b`, "i");
      if (regex.test(result.title)) {
        result.brand = b;
        break;
      }
    }
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
    // Check title for common model patterns (e.g. MOD-505, Ranger 8, CSR-12, BLP, CFX Pro)
    const titleModelMatch = result.title.match(/(MOD[-\s]?\d+|Ranger\s*\d+|Neo\s*\d+|Renova|\b\d{3,4}\s*cm\b|[A-Z]{2,}-\d+|\bBLP\b|\bCSR-\d+\b)/i);
    if (titleModelMatch) {
      result.model = titleModelMatch[1].trim();
    }
  }

  // Eğer marka hala boşsa ve model biliniyorsa, başlıktaki modelden önceki kelime markadır
  if (!result.brand && result.title && result.model) {
    const idx = result.title.indexOf(result.model);
    if (idx > 0) {
      const prefix = result.title.substring(0, idx).trim();
      if (prefix.length > 1 && prefix.length < 30) {
        result.brand = prefix;
      }
    }
  }

  // Hala boşsa başlıktaki ilk kelimeyi dene
  if (!result.brand && result.title) {
    const words = result.title.split(/\s+/);
    if (words.length > 1 && words[0].length >= 3 && /^[A-ZÇĞİÖŞÜa-zçğıöşü]+$/.test(words[0])) {
      result.brand = words[0];
    }
  }

  if (result.brand) {
    result.specs["Marka"] = result.brand;
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
  // Renk varyantları sekmesini / alanını bulup ana galeriden ayırıyoruz
  const colorTab =
    document.getElementById("tab_renkler-seçenekleri") ||
    document.querySelector("[id*='renkler'], .color-variants, .variants");

  const rawMainImgs = [];

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content && !ogImage.content.includes("logo") && !ogImage.content.includes("Favicon")) {
    rawMainImgs.push(cleanImageUrl(ogImage.content));
  }

  const galleryImgs = document.querySelectorAll(
    ".product-image img, .gallery img, .product-gallery img, .swiper-slide img, .carousel-item img, [data-zoom-image], a[data-standard], #product-thumb-image a, #product-thumb-image img, .thumb-item a, .slider-wrapper a, .slider a, a.image-lightbox, a.lightbox-gallery, .slider img, .flickity-slider a, .flickity-slider img"
  );

  galleryImgs.forEach((el) => {
    // Eğer görsel renk varyantları sekmesindeyse ana görsellere dahil etme!
    if (colorTab && colorTab.contains(el)) return;
    if (el.closest && el.closest("[id*='renkler'], .color-variants, .variants")) return;

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
      if (
        cleaned &&
        !cleaned.includes("logo") &&
        !cleaned.includes("icon") &&
        !cleaned.includes("banner") &&
        !cleaned.includes("Favicon") &&
        !cleaned.includes("Silah-Ureticisi") &&
        (cleaned.includes(".webp") || cleaned.includes(".png") || cleaned.includes(".jpg") || cleaned.includes(".jpeg"))
      ) {
        rawMainImgs.push(cleaned);
      }
    }
  });

  // Fallback images
  if (rawMainImgs.length === 0) {
    document.querySelectorAll("img").forEach((img) => {
      if (colorTab && colorTab.contains(img)) return;
      let s = img.src;
      if (s && (img.naturalWidth > 250 || img.width > 250)) {
        const cleaned = cleanImageUrl(s);
        if (cleaned && !cleaned.includes("logo") && !cleaned.includes("icon") && !cleaned.includes("Favicon")) {
          rawMainImgs.push(cleaned);
        }
      }
    });
  }

  result.images = dedupeImages(rawMainImgs).slice(0, 10);

  // =========================================================================
  // 7b. Renk & Model Varyantları Tespiti (Color Variants)
  // =========================================================================
  const variants = [];

  if (colorTab) {
    // Sadece renk sekmesindeki alt sütunları tara (tüm sayfadaki .col'ları değil!)
    const colorCols = colorTab.querySelectorAll(".col, .col-inner, [class*='column']");
    const processedCodes = new Set();

    colorCols.forEach((col) => {
      const text = col.textContent || "";
      const colorMatch = text.match(/Renk\s*Kodu\s*:?\s*([A-Za-z0-9-]+)/i);
      if (colorMatch) {
        const code = colorMatch[1].trim();
        if (processedCodes.has(code)) return;

        const colImgs = [];
        const imgElements = col.querySelectorAll("a.image-lightbox, a.lightbox-gallery, .slider img, img");
        imgElements.forEach((el) => {
          let u =
            el.getAttribute("href") ||
            el.getAttribute("data-zoom-image") ||
            el.getAttribute("data-large") ||
            el.getAttribute("data-original") ||
            el.src;
          if (u && !u.endsWith("#")) {
            const cleaned = cleanImageUrl(u);
            if (
              cleaned &&
              !cleaned.includes("logo") &&
              !cleaned.includes("icon") &&
              !cleaned.includes("banner") &&
              !cleaned.includes("Favicon") &&
              !cleaned.includes("Silah-Ureticisi") &&
              (cleaned.includes(".webp") || cleaned.includes(".png") || cleaned.includes(".jpg") || cleaned.includes(".jpeg"))
            ) {
              colImgs.push(cleaned);
            }
          }
        });

        const dedupedColImgs = dedupeImages(colImgs);
        if (dedupedColImgs.length > 0) {
          processedCodes.add(code);
          variants.push({
            name: `Renk Kodu: ${code}`,
            color_code: code,
            images: dedupedColImgs,
          });
        }
      }
    });

    // Eğer varyantlar bulunduysa, ana görseli de 1. varyant (Standart / Siyah CR01) olarak başa ekle:
    if (variants.length > 0 && result.images.length > 0) {
      variants.unshift({
        name: "Standart / Siyah (CR01)",
        color_code: "CR01",
        images: [...result.images],
      });
    }
  }

  result.variants = variants;

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
  const detailEl = document.querySelector(
    ".product-detail, .product-description, #tab-description, [itemprop='description'], #tab_Ürün-açıklaması, #tab-Ürün-açıklaması, [id*='Ürün-açıklaması'], [id*='urun-aciklamasi']"
  );
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

    if (lines.length > 0) {
      result.description = lines.slice(0, 5).join(". ") + ".";
    }
  }

  // Fallback description from description tab paragraphs
  if (!result.description || result.description.length < 20) {
    const descTab = document.querySelector("#tab_Ürün-açıklaması, #tab-Ürün-açıklaması, .entry-content");
    if (descTab) {
      const ps = Array.from(descTab.querySelectorAll("p"))
        .map((p) => p.textContent.trim())
        .filter((t) => t.length > 25);
      if (ps.length > 0) {
        result.description = ps.slice(0, 3).join(" ");
      }
    }
  }

  // D. Başlıktan ekstra özellikler
  const lengthMatch = result.title.match(/(\d{2,4}\s*cm)/i);
  if (lengthMatch && !specs["Kamış Boyu"] && !specs["Uzunluk"]) {
    specs["Uzunluk"] = lengthMatch[1];
  }

  if (window.location.href.includes("/bullpup/") || result.title.toLowerCase().includes("bullpup")) {
    if (!result.category) result.category = "Tüfek - Bullpup";
    specs["Tipi"] = "Bullpup";
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

function dedupeImages(urls) {
  if (!Array.isArray(urls)) return [];
  const seen = new Set();
  const res = [];
  for (const raw of urls) {
    if (!raw) continue;
    // -scaled olan veya olmayan aynı görseli tekilleştir
    const norm = raw.replace(/-scaled\.(jpe?g|png|webp)/i, ".$1");
    if (!seen.has(norm)) {
      seen.add(norm);
      res.push(raw);
    }
  }
  return res;
}

