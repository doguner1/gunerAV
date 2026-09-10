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
      return true;
    }

    if (request.action === "EXTRACT_LISTING_LINKS") {
      try {
        const links = extractListingLinks();
        const paginationPages = extractPaginationPages();
        sendResponse({ success: true, count: links.length, links, paginationPages });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    if (request.action === "FETCH_PAGE_LINKS") {
      (async () => {
        try {
          const res = await fetch(request.url, { credentials: "include" });
          if (!res.ok) {
            sendResponse({ success: false, error: `HTTP ${res.status}: Sayfa okunamadı` });
            return;
          }
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const links = extractListingLinks(doc);
          const paginationPages = extractPaginationPages(doc);
          sendResponse({ success: true, count: links.length, links, paginationPages });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }

    if (request.action === "FETCH_AND_EXTRACT_PRODUCT") {
      (async () => {
        try {
          const res = await fetch(request.url, { credentials: "include" });
          if (!res.ok) {
            sendResponse({ success: false, error: `HTTP ${res.status}: Sayfa yüklenemedi` });
            return;
          }
          const html = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, "text/html");
          const data = extractProductData(doc, request.url);
          sendResponse({ success: true, data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }

    return true;
  });
}

function extractListingLinks(doc = (typeof document !== "undefined" ? document : null)) {
  if (!doc) return [];
  const foundUrls = new Set();
  const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";

  // Özler Av (.uruncard, .kobi-urunlist, .urun-grid) ve genel e-ticaret seçicileri
  const candidateAnchors = doc.querySelectorAll(
    ".urun-grid a, .kobi-urunlist a, .uruncard a, .product-item a, .product-card a, .product-box a, a[href*='-p-']"
  );

  candidateAnchors.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    const trimmed = href.trim();
    if (trimmed.startsWith("#") || trimmed.startsWith("javascript:")) return;

    // Filtrele: Kategori, sayfalama, sepet, marka linklerini ele
    if (
      trimmed.includes("PageNumber=") ||
      trimmed.includes("sayfa=") ||
      trimmed.includes("/k-") ||
      trimmed.includes("-k-") ||
      trimmed.includes("/kategori") ||
      trimmed.includes("/marka") ||
      trimmed.includes("/sepet") ||
      trimmed.includes("/hesabim") ||
      trimmed.includes("/login") ||
      trimmed.includes("/uye")
    ) {
      return;
    }

    // Ürün sayfaları genellikle -p- (Kobimaster/Özler Av) veya /urun/ içerir
    const isLikelyProduct =
      /-p-\d+/i.test(trimmed) ||
      /\/urun\/|\/product\//i.test(trimmed) ||
      (a.closest && a.closest(".uruncard, .kobi-urunlist, .product-item, .product-card") && !trimmed.includes("?"));

    if (isLikelyProduct) {
      try {
        const fullUrl = new URL(trimmed, origin || "https://www.ozlerav.com.tr").href;
        foundUrls.add(fullUrl);
      } catch (e) {}
    }
  });

  return Array.from(foundUrls);
}

function extractPaginationPages(doc = (typeof document !== "undefined" ? document : null)) {
  if (!doc) return [];
  const foundPages = new Set();
  const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";
  const anchors = doc.querySelectorAll("a[href*='PageNumber='], a[href*='sayfa='], .pagination a, .sayfalama a");
  anchors.forEach((a) => {
    const href = a.getAttribute("href");
    if (href && (href.includes("PageNumber=") || href.includes("sayfa="))) {
      try {
        const full = new URL(href, origin || "https://www.ozlerav.com.tr").href;
        foundPages.add(full);
      } catch (e) {}
    }
  });
  return Array.from(foundPages);
}

function parseTurkishPrice(rawStr) {
  if (!rawStr) return null;
  let s = String(rawStr).replace(/[^\d,\.]/g, "").trim();
  if (!s) return null;
  if (s.includes(".") && s.includes(",")) {
    if (s.indexOf(".") < s.indexOf(",")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  } else if (s.includes(".")) {
    const parts = s.split(".");
    if (parts.length === 2 && parts[1].length === 3) {
      s = parts[0] + parts[1];
    } else if (parts.length > 2) {
      s = parts.join("");
    }
  }
  const num = parseFloat(s);
  return isNaN(num) ? null : Math.round(num);
}

function extractProductData(doc = (typeof document !== "undefined" ? document : null), pageUrl = "") {
  if (!doc) return {};
  const currentUrl = pageUrl || (typeof window !== "undefined" && window.location ? window.location.href : "");
  const result = {
    title: "",
    brand: "",
    model: "",
    category: "",
    price: null,
    in_stock: true,
    images: [],
    specs: {},
    description: "",
  };

  const html = (doc.documentElement && doc.documentElement.innerHTML) || "";

  // =========================================================================
  // 1. Script & Meta Veri Taraması (IdeaSoft pageParams, dataLayer vb.)
  // =========================================================================
  try {
    // Brand from scripts
    const brandScriptMatch = html.match(/brandName\s*:\s*["']([^"']+)["']/i);
    if (brandScriptMatch && brandScriptMatch[1].trim()) {
      result.brand = brandScriptMatch[1].trim();
    }

    // Category from scripts
    const catScriptMatch = html.match(/categoryName\s*:\s*["']([^"']+)["']/i);
    if (catScriptMatch && catScriptMatch[1].trim()) {
      result.category = catScriptMatch[1].trim();
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

    // Primary Image from scripts
    const imgScriptMatch = html.match(/primaryImageUrl\s*:\s*["']([^"']+)["']/i);
    if (imgScriptMatch && imgScriptMatch[1].trim()) {
      const cleanImg = cleanImageUrl(imgScriptMatch[1]);
      if (cleanImg) result.images.push(cleanImg);
    }
  } catch (e) {
    console.warn("Script parsing fallback:", e);
  }

  // =========================================================================
  // 2. Ürün Başlığı (Title)
  // =========================================================================
  if (!result.title) {
    const titleEl = doc.querySelector("h1, h5.font-weight-bold, .col-12 h5.font-weight-bold, h5, .urunadi");
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (titleEl && titleEl.textContent.trim()) {
      result.title = titleEl.textContent.trim();
    } else if (ogTitle && ogTitle.content) {
      result.title = ogTitle.content.trim();
    } else {
      result.title = (doc.title || "").split(/[-|]/)[0].trim();
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
      const el = doc.querySelector(sel);
      if (el) {
        const val = el.getAttribute("content") || el.textContent;
        if (val && val.trim() && val.trim().length < 40) {
          result.brand = val.trim();
          break;
        }
      }
    }
  }

  // Bilinen Av, Silah ve Taktik Aksesuar Markaları Listesi ve Başlıktan Marka Çıkarımı
  const KNOWN_BRANDS = [
    "Hunthink", "Dağlıoğlu", "Daglioglu", "Hunt Group", "Serengeti", "Retay Arms", "Retay",
    "Castello", "Arslan", "Husan", "Derya", "Armsan", "Ata Arms", "Ata", "Mavoric",
    "Stoeger", "Beretta", "Benelli", "Browning", "Winchester", "Hatsan",
    "Kral Arms", "Kral", "Huğlu", "Huglu", "Akdaş", "Akdas",
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
      const el = doc.querySelector(sel);
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
    // Check title for common model patterns (e.g. H421, MOD-505, Ranger 8, CSR-12, BLP, CFX Pro)
    const titleModelMatch = result.title.match(/\b([A-Z]{1,4}[-\s]?\d{2,4}[A-Z]?|MOD[-\s]?\d+|Ranger\s*\d+|Neo\s*\d+|Renova|[A-Z]{2,}-\d+|\bBLP\b|\bCSR-\d+\b)\b/i);
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
      "#kdvdahilnetfiyat",
      ".kdvdahilnetfiyat",
      "[id*='kdvdahilnetfiyat' i]",
      ".price",
      ".product-price",
      "[itemprop='price']",
      ".current-price",
      ".sale-price",
      ".product-price-current",
      ".spanFiyat",
      ".satisFiyati",
      ".fiyat",
      ".kobi-price",
      "[id*='fiyat' i]",
      "[class*='fiyat' i]",
    ];

    for (const sel of priceSelectors) {
      const el = doc.querySelector(sel);
      if (el && el.textContent.trim()) {
        const parsed = parseTurkishPrice(el.textContent);
        if (parsed !== null && parsed > 0) {
          result.price = parsed;
          break;
        }
      }
    }

    if (!result.price) {
      const candEls = Array.from(doc.querySelectorAll("span, div, td")).filter((el) =>
        /(\d+[\.,]\d{2}|\d+)\s*(TL|₺)/i.test(el.textContent) &&
        el.children.length === 0 &&
        !el.textContent.toLowerCase().includes("havale") &&
        !el.textContent.toLowerCase().includes("taksit")
      );
      for (const cand of candEls) {
        const parsed = parseTurkishPrice(cand.textContent);
        if (parsed !== null && parsed > 0) {
          result.price = parsed;
          break;
        }
      }
    }
  }

  // =========================================================================
  // 6b. Stok Durumu (in_stock)
  // =========================================================================
  result.in_stock = true;
  const stockEl = doc.querySelector(".stokdurumu, [class*='stokdurumu'], [id*='stok' i], .stock-status, .availability");
  if (stockEl) {
    const sText = stockEl.textContent.toLowerCase();
    if (sText.includes("tükendi") || sText.includes("tukendi") || sText.includes("stokta yok") || sText.includes("kalmadı")) {
      result.in_stock = false;
    } else if (sText.includes("stokta var")) {
      result.in_stock = true;
    }
  } else {
    const allTds = Array.from(doc.querySelectorAll("td, th, span, div.pt-1"));
    const tukendiEl = allTds.find((el) => {
      const t = el.textContent.trim().toLowerCase();
      return t === "tükendi" || t === "tukendi" || t === "stokta yok" || t === "tükendi.";
    });
    if (tukendiEl) {
      result.in_stock = false;
    }
  }

  // =========================================================================
  // 7. Görsel URL'leri (Image Gallery)
  // =========================================================================
  // Renk varyantları sekmesini / alanını dinamik ve esnek bulucu fonksiyon
  // (Hem 'tab_renkler-seçenekleri' hem de 'tab_renk-seçenekleri' / tekil-çoğul varyasyonlarını destekler)
  function findColorTab() {
    const directIds = [
      "tab_renk-seçenekleri",
      "tab_renkler-seçenekleri",
      "tab_renk-secenekleri",
      "tab_renkler-secenekleri",
      "tab_renkler",
      "tab_renk",
      "tab-renk-seçenekleri",
      "tab-renkler-seçenekleri",
    ];
    for (const id of directIds) {
      const el = doc.getElementById(id);
      if (el && (el.classList.contains("panel") || el.tagName === "DIV")) return el;
    }

    const panel = doc.querySelector(
      ".panel[id*='renk'], [role='tabpanel'][id*='renk'], div[id*='tab_renk'], div[id*='tab-renk'], .color-variants, .variants"
    );
    if (panel) return panel;

    const tabLink = Array.from(doc.querySelectorAll("li.tab a, .tab a, .tabs a")).find((a) =>
      /renk|color|variant/i.test(a.textContent || "")
    );
    if (tabLink) {
      const href = tabLink.getAttribute("href");
      if (href && href.startsWith("#")) {
        const target = doc.getElementById(href.slice(1));
        if (target) return target;
      }
    }

    return null;
  }

  const colorTab = findColorTab();

  const rawMainImgs = [];

  // 0. Primary Image element (#primary-image, Yaban Av / IdeaSoft zoom image)
  const primaryImgEl = doc.querySelector("#primary-image");
  if (primaryImgEl) {
    const pSrc = primaryImgEl.getAttribute("data-zoom-image") || primaryImgEl.getAttribute("src");
    if (pSrc) {
      const cleaned = cleanImageUrl(pSrc);
      if (cleaned) rawMainImgs.push(cleaned);
    }
  }

  const ogImage = doc.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content && !ogImage.content.includes("logo") && !ogImage.content.includes("Favicon")) {
    rawMainImgs.push(cleanImageUrl(ogImage.content));
  }

  const galleryImgs = doc.querySelectorAll(
    ".product-image img, .gallery img, .product-gallery img, .swiper-slide img, .carousel-item img, [data-zoom-image], a[data-standard], #product-thumb-image a, #product-thumb-image img, .thumb-item a, .slider-wrapper a, .slider a, a.image-lightbox, a.lightbox-gallery, .slider img, .flickity-slider a, .flickity-slider img"
  );

  galleryImgs.forEach((el) => {
    // Eğer görsel renk varyantları sekmesindeyse ana görsellere dahil etme!
    if (colorTab && colorTab.contains(el)) return;
    if (el.closest && el.closest("[id*='renk'], .color-variants, .variants")) return;

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
  if (rawMainImgs.length === 0 && result.images.length === 0) {
    doc.querySelectorAll("img").forEach((img) => {
      if (colorTab && colorTab.contains(img)) return;
      if (img.closest && img.closest("[id*='renk'], .color-variants, .variants")) return;
      let s = img.src;
      if (s && (img.naturalWidth > 250 || img.width > 250)) {
        const cleaned = cleanImageUrl(s);
        if (cleaned && !cleaned.includes("logo") && !cleaned.includes("icon") && !cleaned.includes("Favicon")) {
          rawMainImgs.push(cleaned);
        }
      }
    });
  }

  result.images = dedupeImages([...result.images, ...rawMainImgs]).slice(0, 10);

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
  const listRows = doc.querySelectorAll(".product-list-row, .product-feature-row, .feature-row, .spec-row");
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
        !key.toLowerCase().includes("taksit") &&
        !key.toLowerCase().includes("kdv") &&
        !key.toLowerCase().includes("fiyat") &&
        !key.toLowerCase().includes("net fiyat") &&
        !key.toLowerCase().includes("adet")
      ) {
        specs[key] = val;
      }
    }
  });

  // B. HTML Tabloları (table tr th/td) ve Kobimaster / Özler Av Açıklama Tablosu (.divAciklamaIcerik)
  const tables = doc.querySelectorAll(
    ".divAciklamaIcerik table, [class*='divAciklama'] table, #divAciklama table, table, .tech-specs, .specifications, dl"
  );
  tables.forEach((table) => {
    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("th, td");
      if (cells.length >= 2) {
        const key = cells[0].textContent.replace(/[:]/g, "").trim();
        const value = cells[1].textContent.replace(/\s+/g, " ").trim();
        const keyLower = key.toLowerCase();
        if (
          key &&
          value &&
          key.length < 60 &&
          value.length < 300 &&
          !keyLower.includes("havale") &&
          !keyLower.includes("taksit") &&
          !keyLower.includes("banka") &&
          !keyLower.includes("vade") &&
          !keyLower.includes("tek çekim") &&
          !keyLower.includes("finans") &&
          !keyLower.includes("kdv") &&
          !keyLower.includes("net fiyat") &&
          !keyLower.includes("adet") &&
          !keyLower.includes("fiyat")
        ) {
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

  // C. Ürün Bilgisi / Detay Metninden Özellik Çıkarımı (.product-detail, .divAciklamaIcerik)
  const detailEl = doc.querySelector(
    ".divAciklamaIcerik, [class*='divAciklama'], #divAciklama, #tabGenelBakis, [id*='genel-bakis'], .product-detail, .product-description, #tab-description, [itemprop='description'], #tab_Ürün-açıklaması, #tab-Ürün-açıklaması, [id*='Ürün-açıklaması'], [id*='urun-aciklamasi']"
  );
  if (detailEl) {
    let rawLines = [];
    try {
      const cloned = detailEl.cloneNode(true);
      // Tablo satırlarını "Özellik: Değer" formatında metne dönüştür
      cloned.querySelectorAll("tr").forEach((tr) => {
        const cells = tr.querySelectorAll("th, td");
        if (cells.length >= 2) {
          const k = cells[0].textContent.replace(/[:]/g, "").trim();
          const v = cells[1].textContent.replace(/\s+/g, " ").trim();
          if (k && v) {
            tr.textContent = `\n${k}: ${v}\n`;
          }
        }
      });
      cloned.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
      cloned.querySelectorAll("div, p, li").forEach((el) => {
        el.prepend("\n");
        el.append("\n");
      });
      rawLines = cloned.textContent
        .split(/\n+/)
        .map((l) => l.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim())
        .filter((l) => l.length > 0 && l.length < 150);
    } catch {
      rawLines = detailEl.textContent
        .replace(/&nbsp;/g, " ")
        .split(/\n|\r/)
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter((l) => l.length > 0 && l.length < 150);
    }

    const descList = [];
    rawLines.forEach((rawLine) => {
      // Baştaki madde işaretlerini temizle ama negatif sayıları (örn. -15/-20 derece) koru:
      const line = rawLine.replace(/^([•*—]\s*|-\s+)/, "").trim();
      const lower = line.toLowerCase();
      if (lower === "özellikler" || lower === "özellikleri" || lower === "ozellikler" || lower === "genel bakış") {
        descList.push("Özellikler:");
        return;
      }
      if (lower.includes("taksit") || lower.includes("havale") || lower.includes("kargo") || lower.includes("kdv dahil") || lower.includes("net fiyat")) return;

      descList.push(line);

      // 1. İki nokta (colon) içeren format: "Özellik: Değer"
      if (line.includes(":")) {
        const parts = line.split(":");
        const k = parts[0].trim();
        const v = parts.slice(1).join(":").trim();
        if (k.length > 1 && k.length < 50 && v.length > 0 && v.length < 200) {
          const kl = k.toLowerCase();
          if (
            !kl.includes("stok") &&
            !kl.includes("sku") &&
            !kl.includes("ürün kodu") &&
            !kl.includes("ürün no") &&
            !kl.includes("barkod") &&
            !kl.includes("kdv") &&
            !kl.includes("fiyat") &&
            !kl.includes("adet")
          ) {
            specs[k] = v;
            return;
          }
        }
      }

      // 2. Tire (dash) içeren format: "Özellik - Değer" (örn: Kumaş - 190T Polyester)
      if (line.includes(" - ") && !line.startsWith("-")) {
        const parts = line.split(" - ");
        const k = parts[0].trim();
        const v = parts.slice(1).join(" - ").trim();
        if (k.length > 2 && k.length < 35 && v.length > 1 && v.length < 120) {
          const kl = k.toLowerCase();
          if (!kl.includes("taksit") && !kl.includes("havale") && !kl.includes("fiyat") && !kl.includes("stok")) {
            specs[k] = v;
            return;
          }
        }
      }

      // 3. Kamp, Outdoor, Av ve Doğa Akıllı Semantik Çıkarıcılar (Colon içermeyen liste maddeleri)

      // A. Sıcaklık / Derece (Uyku Tulumu vb.) - Yıkama hariç!
      if (/derece/i.test(line) && !lower.includes("yıka") && !lower.includes("suda") && !specs["Sıcaklık Derecesi"]) {
        const m = line.match(/(-?\d+(?:\s*[\/\-]\s*-?\d+)?)\s*(?:°|derece)/i);
        if (m) {
          specs["Sıcaklık Derecesi"] = m[1].replace(/\s+/g, "") + " °C";
        } else {
          specs["Sıcaklık Derecesi"] = line;
        }
      }

      // B. Su Geçirmezlik & Su Sütunu
      if (/su\s*geçirmez|waterproof/i.test(line) && !specs["Su Geçirmezlik"]) {
        const mm = line.match(/(\d{3,5}\s*mm)/i);
        specs["Su Geçirmezlik"] = mm ? `${mm[1]} Su Sütunu` : "Su Geçirmez";
      }

      // C. İç Malzeme / Astar / Polar
      if (/polar|polarlı/i.test(line) && !specs["İç Malzeme / Astar"]) {
        specs["İç Malzeme / Astar"] = "Polar Astar";
      }

      // D. Dolgu Malzemesi (Elyaf, Kaz Tüyü vb.)
      if ((/elyaf/i.test(line) || /dolgu/i.test(line) || /kaz\s*tüy/i.test(line)) && !specs["Dolgu Malzemesi"]) {
        const gr = line.match(/(\d+)\s*gr/i);
        const isM2 = /m2|m²/i.test(line);
        if (gr) {
          specs["Dolgu Malzemesi"] = `${gr[1]} gr${isM2 ? "/m²" : ""} Elyaf`;
        } else {
          specs["Dolgu Malzemesi"] = line.replace(/kullan[ıi]lm[ıi][şs]t[ıi]r\.?/i, "").trim();
        }
      }

      // E. Kapalı Ölçüler (Uyku tulumu, çadır, kamp sandalyesi)
      if (/kapal[ıi]\s*ölçü|kapal[ıi]\s*ebat/i.test(line) && !specs["Kapalı Ölçüler"]) {
        let clean = line
          .replace(/^kapal[ıi]\s*ölçü(?:ler)?[iı]?\s*[:\s]*/i, "")
          .replace(/civar[ıi]nda\s*gelmektedir\.?/i, "")
          .replace(/gelmektedir\.?/i, "")
          .trim();
        clean = clean.replace(/\ben\b/gi, "En").replace(/\bboy\b/gi, "Boy").replace(/\bkapüşonlu\b/gi, "Kapüşonlu");
        specs["Kapalı Ölçüler"] = clean;
      }

      // F. Açık Ölçüler
      if (/aç[ıi]k\s*ölçü|aç[ıi]k\s*ebat/i.test(line) && !specs["Açık Ölçüler"]) {
        let clean = line
          .replace(/^aç[ıi]k\s*ölçü(?:ler)?[iı]?\s*[:\s]*/i, "")
          .replace(/civar[ıi]nda\s*gelmektedir\.?/i, "")
          .replace(/gelmektedir\.?/i, "")
          .trim();
        clean = clean.replace(/\ben\b/gi, "En").replace(/\bboy\b/gi, "Boy");
        specs["Açık Ölçüler"] = clean;
      }

      // G. Genel Ebatlar / Boyut
      if (!specs["Ebatlar"] && !specs["Kapalı Ölçüler"] && /(\d{2,4}\s*(?:x|×|\*)\s*\d{2,4}(?:\s*(?:x|×|\*)\s*\d{2,4})?\s*(?:cm|mm|m)\b)/i.test(line)) {
        const em = line.match(/(\d{2,4}\s*(?:x|×|\*)\s*\d{2,4}(?:\s*(?:x|×|\*)\s*\d{2,4})?\s*(?:cm|mm|m)\b)/i);
        if (em) specs["Ebatlar"] = em[1];
      }

      // H. Battaniye / Çok Amaçlı Kullanım
      if (/battaniye/i.test(line) && !specs["Kullanım Şekli"]) {
        specs["Kullanım Şekli"] = "Tamamen açılarak battaniye olabilir";
      }

      // I. Taşıma Kolaylığı / Tutma Sapı / Taşıma Çantası
      if ((/tutma\s*sap/i.test(line) || /taşıma\s*çanta/i.test(line)) && !specs["Taşıma"]) {
        specs["Taşıma"] = /tutma\s*sap/i.test(line) ? "Tutma Saplı Kolay Taşıma" : "Taşıma Çantalı";
      }

      // J. Yıkama & Bakım
      if (/y[ıi]kan/i.test(line) || /y[ıi]kama/i.test(line)) {
        const deg = line.match(/(\d+\s*(?:°|derece))/i);
        specs["Yıkama & Bakım"] = deg ? `${deg[1]} Ilık Suda Yıkanabilir` : "30°C Yıkanabilir";
      }
      if (/ütü/i.test(line)) {
        if (specs["Yıkama & Bakım"]) {
          if (!specs["Yıkama & Bakım"].includes("Ütü")) specs["Yıkama & Bakım"] += " (Ütülenmez)";
        } else {
          specs["Yıkama & Bakım"] = "Ütü Yapılmaz";
        }
      }

      // K. Menşei / Üretim Yeri
      if (/made\s*in|men[şs]e[iı]|üretim\s*yeri|türk\s*malı/i.test(line) && !specs["Menşei"]) {
        const origin = line.replace(/made\s*in\s*[:\s]*/i, "").replace(/men[şs]e[iı]\s*[:\s]*/i, "").trim();
        specs["Menşei"] = origin || "Türkiye";
      }

      // L. Kişi Kapasitesi (Çadır)
      if (/(\d+(?:\s*-\s*\d+)?)\s*ki[şs]ilik/i.test(line) && !specs["Kişi Kapasitesi"]) {
        const km = line.match(/(\d+(?:\s*-\s*\d+)?)\s*ki[şs]ilik/i);
        if (km) specs["Kişi Kapasitesi"] = `${km[1]} Kişilik`;
      }

      // M. Taşıma Kapasitesi (Sandalye, Masa)
      if (/(\d{2,3})\s*(?:kg|kilo)(?:luk)?\s*(?:taşıma|kapasite|kaldır)/i.test(line) && !specs["Taşıma Kapasitesi"]) {
        const capm = line.match(/(\d{2,3})\s*(?:kg|kilo)/i);
        if (capm) specs["Taşıma Kapasitesi"] = `${capm[1]} kg`;
      }

      // N. Termos Hacim / Sıcak / Soğuk Tutma
      if (/(\d+(?:[\.,]\d+)?)\s*(?:lt|litre|l|ml)\b/i.test(line) && !specs["Hacim / Kapasite"]) {
        const hm = line.match(/(\d+(?:[\.,]\d+)?\s*(?:lt|litre|l|ml))\b/i);
        if (hm) specs["Hacim / Kapasite"] = hm[1];
      }
      if (/(\d+)\s*saat(?:\s*boyunca)?\s*s[ıi]cak/i.test(line) && !specs["Sıcak Tutma Süresi"]) {
        const sm = line.match(/(\d+)\s*saat/i);
        if (sm) specs["Sıcak Tutma Süresi"] = `${sm[1]} Saat`;
      }
      if (/(\d+)\s*saat(?:\s*boyunca)?\s*so[ğg]uk/i.test(line) && !specs["Soğuk Tutma Süresi"]) {
        const sm = line.match(/(\d+)\s*saat/i);
        if (sm) specs["Soğuk Tutma Süresi"] = `${sm[1]} Saat`;
      }

      // O. Kumaş / İskelet Malzemesi
      if (/600d|oxford|polyester|ripstop/i.test(line) && !specs["Kumaş Tipi"]) {
        const km = line.match(/(600d\s*(?:oxford)?|oxford|ripstop|\d{3}t\s*polyester|polyester)/i);
        if (km) specs["Kumaş Tipi"] = km[1].toUpperCase();
      }
      if (/(fiberglas|alüminyum|çelik\s*profil|çelik\s*boru)\s*(?:pol|iskelet|boru|profil)?/i.test(line) && !specs["İskelet Malzemesi"]) {
        const im = line.match(/(fiberglas|alüminyum|çelik\s*profil|çelik\s*boru)/i);
        if (im) specs["İskelet Malzemesi"] = im[1];
      }

      // P. Işık Gücü / Lümen / Güç
      if (/(\d+)\s*(?:lümen|lumen|lm)\b/i.test(line) && !specs["Işık Gücü"]) {
        const lm = line.match(/(\d+)\s*(?:lümen|lumen|lm)/i);
        if (lm) specs["Işık Gücü"] = `${lm[1]} Lümen`;
      }
      if (/(\d+(?:[\.,]\d+)?)\s*(?:watt|w|kw)\b/i.test(line) && !specs["Güç"]) {
        const wm = line.match(/(\d+(?:[\.,]\d+)?\s*(?:watt|w|kw))\b/i);
        if (wm) specs["Güç"] = wm[1];
      }

      // Q. Çelik Cinsi & Bıçak Özellikleri
      if (/(440[a-c]?|d2|n690|vg-?10|12c27|aus-?8|1095|karbon\s*çelik|paslanmaz\s*çelik|damascus)/i.test(line) && !specs["Çelik Cinsi"]) {
        const cm = line.match(/(440[a-c]?|d2|n690|vg-?10|12c27|aus-?8|1095|karbon\s*çelik|paslanmaz\s*çelik|damascus)/i);
        if (cm) specs["Çelik Cinsi"] = cm[1].toUpperCase();
      }
      if (/namlu\s*(?:boyu|uzunluğu)?\s*[:\s]*(\d+(?:[\.,]\d+)?\s*cm)/i.test(line) && !specs["Namlu Boyu"]) {
        const nbm = line.match(/namlu\s*(?:boyu|uzunluğu)?\s*[:\s]*(\d+(?:[\.,]\d+)?\s*cm)/i);
        if (nbm) specs["Namlu Boyu"] = nbm[1];
      }
      if (/toplam\s*(?:boy|uzunluk)\s*[:\s]*(\d+(?:[\.,]\d+)?\s*cm)/i.test(line) && !specs["Toplam Boy"]) {
        const tbm = line.match(/toplam\s*(?:boy|uzunluk)\s*[:\s]*(\d+(?:[\.,]\d+)?\s*cm)/i);
        if (tbm) specs["Toplam Boy"] = tbm[1];
      }

      // R. Av Fişeği & Mühimmat Özellikleri
      if (/^(\d+)\s*(gram|gr)$/i.test(line) && !specs["Gramaj"]) {
        specs["Gramaj"] = line;
      } else if (/^(\d+)\s*(kalibre|cal)$/i.test(line) && !specs["Kalibre"]) {
        specs["Kalibre"] = line;
      } else if (/tapa/i.test(line) && line.length < 35 && !specs["Tapa Tipi"]) {
        specs["Tapa Tipi"] = line;
      } else if (/kovan\s*uzunlu[ğg]u/i.test(line) && !specs["Kovan Uzunluğu"]) {
        specs["Kovan Uzunluğu"] = line.replace(/kovan\s*uzunlu[ğg]u\s*[:\s]*/i, "");
      } else if (/paket(?:te)?/i.test(line) || (/^\d+\s*adet$/i.test(line) && !specs["Paket İçeriği"])) {
        specs["Paket İçeriği"] = line.replace(/paket(?:te)?\s*[:\s]*/i, "");
      } else if (/saçma\s*(?:no|numaras[ıi])/i.test(line) && !specs["Saçma No"]) {
        specs["Saçma No"] = line.replace(/saçma\s*(?:no|numaras[ıi])\s*[:\s]*/i, "");
      } else if (/h[ıi]z/i.test(line) && /\d+\s*m\/s/i.test(line) && !specs["Namlu Çıkış Hızı"]) {
        specs["Namlu Çıkış Hızı"] = line;
      } else if (/bas[ıi]nç/i.test(line) && /\d+\s*bar/i.test(line) && !specs["Basınç"]) {
        specs["Basınç"] = line;
      } else if (lower.includes("misina") && !specs["Misina"]) {
        specs["Misina"] = line;
      } else if ((lower.includes("kamış") || lower.includes("karbon") || lower.includes("fiberglas")) && !specs["Kamış Yapısı"]) {
        specs["Kamış Yapısı"] = line;
      } else if (lower.includes("kurulu") && !specs["Kurulum"]) {
        specs["Kurulum"] = line;
      }

      // S. Şarjör, Taktik Aksesuar ve Silah Parçaları Özellikleri
      if ((/kapasite/i.test(line) || /\b\d+\s*adet\b/i.test(line) || /\b\d+\s*fişek\b/i.test(line)) && !specs["Kapasite"]) {
        const capMatch = line.match(/(?:kapasite(?:si)?\s*[:\s]*)?(\d+)\s*(?:adet|fişek)?/i);
        if (capMatch) specs["Kapasite"] = `${capMatch[1]} Adet / Fişek`;
      }
      if (/uyumlu|uygun/i.test(line) && !specs["Uyumlu Modeller / Platform"]) {
        specs["Uyumlu Modeller / Platform"] = line.replace(/^(?:not|uyarı)\s*[:\s]*/i, "").trim();
      }
      if (/(?:yay\s*boşaltma|patentli)/i.test(line) && !specs["Mekanizma"]) {
        specs["Mekanizma"] = line;
      }
      if (/ağırlık|agirlik/i.test(line) && !specs["Ağırlık"]) {
        const wMatch = line.match(/(\d+(?:[\.,]\d+)?\s*(?:kg|gr|gram))/i);
        if (wMatch) specs["Ağırlık"] = wMatch[1];
      }
      if (/ölçüler|ebat/i.test(line) && !specs["Ölçüler"]) {
        specs["Ölçüler"] = line.replace(/^(?:ölçüler|ebat(?:lar)?)\s*[:\s]*/i, "").trim();
      }
      if (/montaj|bağlantı|picatinny|ray/i.test(line) && !specs["Bağlantı Tipi"]) {
        specs["Bağlantı Tipi"] = line;
      }
    });

    if (descList.length > 0) {
      result.description = descList.join("\n");
    }
  }

  // Fallback description from description tab paragraphs
  if (!result.description || result.description.length < 15) {
    const descTab = doc.querySelector("#tab_Ürün-açıklaması, #tab-Ürün-açıklaması, .entry-content");
    if (descTab) {
      const ps = Array.from(descTab.querySelectorAll("p"))
        .map((p) => p.textContent.trim())
        .filter((t) => t.length > 25);
      if (ps.length > 0) {
        result.description = ps.slice(0, 3).join(" ");
      }
    }
  }

  // Fallback: Eğer açıklama metni hala boş veya çok kısaysa, teknik tablodan zengin açıklama oluştur
  if (!result.description || result.description.length < 20) {
    const validSpecs = Object.entries(specs).filter(
      ([k]) => !["Marka", "Model", "Kategori", "Stok Kodu", "Ürün Kodu", "SKU", "sku", "Ürün No", "Stok Durumu"].includes(k)
    );
    if (validSpecs.length > 0) {
      const descLines = ["Teknik Detaylar:"];
      validSpecs.forEach(([k, v]) => {
        descLines.push(`${k}: ${v}`);
      });
      result.description = descLines.join("\n");
    }
  }

  // D. Başlıktan ekstra özellikler
  const lengthMatch = result.title.match(/(\d{2,4}\s*cm)/i);
  if (lengthMatch && !specs["Kamış Boyu"] && !specs["Uzunluk"] && !specs["Ebatlar"]) {
    specs["Uzunluk"] = lengthMatch[1];
  }

  const capInTitle = result.title.match(/\b(5|8|10|12|15|20|25)['’`]?l[ıiuü]\b/i);
  if (capInTitle && !specs["Kapasite"]) {
    specs["Kapasite"] = `${capInTitle[1]} Fişek / Adet`;
  }

  const calInTitle = result.title.match(/\b(12|16|20|28|36)\s*(?:kalibre|cal|ga)\b/i);
  if (calInTitle && !specs["Kalibre"]) {
    specs["Kalibre"] = `${calInTitle[1]} Kalibre`;
  }

  const colorInTitle = result.title.match(/\b(yeşil|kırmızı|sarı|siyah|haki|kamuflaj)\b/i);
  if (colorInTitle && !specs["Renk"]) {
    specs["Renk"] = colorInTitle[1].charAt(0).toUpperCase() + colorInTitle[1].slice(1);
  }

  if (/fosforlu/i.test(result.title) && !specs["Nişangah Tipi"]) {
    specs["Nişangah Tipi"] = "Fosforlu Nişangah / Arpacık";
  }

  if (currentUrl.includes("/bullpup/") || result.title.toLowerCase().includes("bullpup")) {
    if (!result.category) result.category = "Tüfek - Bullpup";
    specs["Tipi"] = "Bullpup";
  }

  // Model ve Markayı dahili kodlardan (Ürün Kodu vb.) henüz silinmeden yakala
  if (!result.model) {
    const rawCode = specs["Ürün Kodu"] || specs["Stok Kodu"] || specs["Model"] || specs["ürün kodu"];
    if (rawCode && !/^yb_|^stk_|^prd_|^art_/i.test(rawCode)) {
      result.model = String(rawCode).trim();
    }
  }
  if (!result.brand) {
    result.brand = specs["Marka"] || specs["Brand"] || "";
  }

  // KULLANICI TALEBİ: "stok kodunu almasın" -> Dahili tedarikçi ve depo kodları temizlenir
  const excludeSupplierKeys = [
    "Stok Kodu", "stok kodu",
    "Ürün Kodu", "ürün kodu",
    "Ürün No", "ürün no", "Ürün No:", "Ürün Numarası",
    "Stok Durumu", "stok durumu",
    "Barkod", "barkod", "Barkodlar", "Barkodlar:",
    "SKU", "sku",
    "Kategori",
    "Id_Urun",
    "Favorilerime Ekle",
    "Miktar"
  ];
  for (const ek of excludeSupplierKeys) {
    delete specs[ek];
  }

  // Fiyat bilgisi specs'lerden kesinlikle çıkarılır (yasal gereklilik)
  Object.keys(specs).forEach(k => {
    const kl = k.toLowerCase();
    if (kl.includes("kdv") || kl.includes("net fiyat") || (kl.includes("fiyat") && kl.includes("adet"))) {
      delete specs[k];
    }
  });

  // Eğer model bir dahili depo stok koduysa (yb_..., stk_...), modeli temizle
  if (result.model && /^yb_|^stk_|^prd_|^art_/i.test(result.model)) {
    result.model = "";
  }

  result.specs = specs;

  // Marka / Model son kontrolü
  if (!result.brand && (specs["Marka"] || specs["Brand"])) {
    result.brand = specs["Marka"] || specs["Brand"];
  }
  if (!result.model && specs["Model"]) {
    result.model = specs["Model"];
  }

  // =========================================================================
  // 9. Kategori ve Ruhsat Durumu Otomatik Tespiti (Tüfek / Ruhsat Öncelikli)
  // =========================================================================
  const fullText = (
    (result.title || "") + " " +
    (result.category || "") + " " +
    JSON.stringify(specs) + " " +
    currentUrl
  ).toLowerCase();

  const titleLower = (result.title || "").toLowerCase();

  const isOptic =
    currentUrl.includes("durbun") ||
    currentUrl.includes("optik") ||
    currentUrl.includes("scope") ||
    currentUrl.includes("red-dot") ||
    currentUrl.includes("reddot") ||
    titleLower.includes("dürbün") ||
    titleLower.includes("durbun") ||
    titleLower.includes("scope") ||
    titleLower.includes("red dot") ||
    titleLower.includes("reddot") ||
    titleLower.includes("red-dot") ||
    titleLower.includes("termal") ||
    titleLower.includes("gece görüş") ||
    titleLower.includes("gece gorus") ||
    titleLower.includes("lazer") ||
    titleLower.includes("laser") ||
    titleLower.includes("boresighter") ||
    titleLower.includes("monoküler") ||
    titleLower.includes("monokuler") ||
    titleLower.includes("dürbün ayağı") ||
    titleLower.includes("durbun ayagi");

  const isAccessory =
    !isOptic && (
      currentUrl.includes("av-taktik-aksesuar") ||
      currentUrl.includes("taktik-aksesuarlari") ||
      currentUrl.includes("av-aksesuarlari") ||
      currentUrl.includes("k-237") ||
      currentUrl.includes("k-238") ||
      currentUrl.includes("k-239") ||
      (result.category && /taktik aksesuar|av aksesuar|aksesuarlar/i.test(result.category)) ||
      titleLower.includes("şarjör") ||
      titleLower.includes("sarjor") ||
      titleLower.includes("tambur") ||
      titleLower.includes("arpacık") ||
      titleLower.includes("arpacik") ||
      titleLower.includes("gez ") ||
      titleLower.includes("gez-") ||
      titleLower.includes("gez takımı") ||
      titleLower.includes("nişangah") ||
      titleLower.includes("nisangah") ||
      titleLower.includes("tutamak") ||
      titleLower.includes("tutamağı") ||
      titleLower.includes("tutamagi") ||
      titleLower.includes("foregrip") ||
      titleLower.includes("grip") ||
      titleLower.includes("kayışlık") ||
      titleLower.includes("kayislik") ||
      titleLower.includes("askı kayışı") ||
      titleLower.includes("aski kayisi") ||
      titleLower.includes("namlu kelepçesi") ||
      titleLower.includes("kelepçe") ||
      titleLower.includes("kelepce") ||
      titleLower.includes("mobil şok") ||
      titleLower.includes("şok tüp") ||
      titleLower.includes("şok takımı") ||
      titleLower.includes("şok ") ||
      titleLower.includes("sok ") ||
      titleLower.includes("çanta") ||
      titleLower.includes("canta") ||
      titleLower.includes("kılıf") ||
      titleLower.includes("kilif") ||
      titleLower.includes("dipçik") ||
      titleLower.includes("dipcik") ||
      titleLower.includes("el kundağı") ||
      titleLower.includes("kundak") ||
      titleLower.includes("bipod") ||
      titleLower.includes("çatal ayak") ||
      titleLower.includes("catal ayak") ||
      titleLower.includes("picatinny") ||
      titleLower.includes("ray adaptör") ||
      titleLower.includes("ray pedi") ||
      titleLower.includes("ray kapak") ||
      titleLower.includes("fişeklik") ||
      titleLower.includes("fiseklik") ||
      titleLower.includes("pikatin")
    );

  const isBakim =
    titleLower.includes("temizleme seti") ||
    titleLower.includes("bakım seti") ||
    titleLower.includes("bakim seti") ||
    titleLower.includes("bakım yağı") ||
    titleLower.includes("bakim yagi") ||
    titleLower.includes("silah yağı") ||
    titleLower.includes("silah yagi") ||
    titleLower.includes("harbi") ||
    titleLower.includes("namlu temizleme") ||
    titleLower.includes("pas sökücü") ||
    titleLower.includes("pas sokucu") ||
    titleLower.includes("koruyucu yağ") ||
    titleLower.includes("koruyucu yag") ||
    titleLower.includes("bore cleaner") ||
    titleLower.includes("gun oil") ||
    titleLower.includes("gun cleaner") ||
    fullText.includes("bakim-malzemeleri") ||
    fullText.includes("temizleme-bakim") ||
    fullText.includes("silah-bakim");

  const isFirearm =
    !isOptic &&
    !isAccessory &&
    !isBakim && (
      titleLower.includes("tüfek") ||
      titleLower.includes("tufek") ||
      titleLower.includes("tabanca") ||
      titleLower.includes("av tüfeği") ||
      titleLower.includes("av tufegi") ||
      titleLower.includes("pompalı") ||
      titleLower.includes("pompali") ||
      titleLower.includes("poze") ||
      titleLower.includes("çifte") ||
      titleLower.includes("cifte")
    );

  if (isOptic) {
    result.requires_license = false;
    result.category = "optik";
  } else if (isBakim) {
    result.requires_license = false;
    result.category = "tufek-bakim";
  } else if (isAccessory) {
    result.requires_license = false;
    result.category = "tufek-aksesuar";
  } else if (isFirearm) {
    result.requires_license = true;
    if (fullText.includes("bullpup")) {
      result.category = "tufek-bullpup";
    } else if (titleLower.includes("şarjörlü") || titleLower.includes("sarjorlu") || (specs["Tipi"] && /şarjör/i.test(specs["Tipi"]))) {
      result.category = "tufek-sarjorlu";
    } else if (fullText.includes("pompalı") || fullText.includes("pompali") || fullText.includes("pump")) {
      result.category = "tufek-pompali";
    } else if (fullText.includes("süperpoze") || fullText.includes("superpoze") || fullText.includes("poze")) {
      result.category = "tufek-superpoze";
    } else if (fullText.includes("çifte") || fullText.includes("cifte")) {
      result.category = "tufek-cifte";
    } else if (fullText.includes("tek kırma") || fullText.includes("tek kirma")) {
      result.category = "tufek-tek-kirma";
    } else if (
      fullText.includes("yarı otomatik") ||
      fullText.includes("yari otomatik") ||
      fullText.includes("semi auto") ||
      fullText.includes("inertia") ||
      fullText.includes("kinetik") ||
      fullText.includes("gazlı") ||
      fullText.includes("patrol") ||
      fullText.includes("gordion")
    ) {
      result.category = "tufek-yari-otomatik";
    } else {
      result.category = "tufek";
    }
  } else {
    // Mühimmat kontrolü (Yalnızca açıkça tüfek/silah değilse çalışır)
    const isAmmo =
      (result.category && (result.category === "muhimmat" || result.category.startsWith("muhimmat-"))) ||
      titleLower.includes("fişek") ||
      titleLower.includes("fisek") ||
      titleLower.includes("mühimmat") ||
      titleLower.includes("muhimmat") ||
      titleLower.includes("sterling") ||
      titleLower.includes("kartuş") ||
      titleLower.includes("kartus") ||
      /\b(24|28|30|32|34|36|38|40)\s*(?:gram|gr)\b/i.test(titleLower);

    if (isAmmo) {
      // Mühimmat / Av Fişeği: Ruhsat kesinlikle İSTENMEZ!
      result.requires_license = false;

      const gramMatch = fullText.match(/\b(24|28|30|32|34|36|38|40)\s*(?:gram|gr)\b/i);
      if (gramMatch) {
        result.category = `muhimmat-${gramMatch[1]}-gram`;
      } else if (fullText.includes("tek kurşun") || fullText.includes("tek kursun") || fullText.includes("slug")) {
        result.category = "muhimmat-tek-kursun";
      } else if (fullText.includes("şavrotin") || fullText.includes("savrotin") || fullText.includes("buckshot")) {
        result.category = "muhimmat-savrotin";
      } else if (fullText.includes("trap") || fullText.includes("skeet")) {
        result.category = "muhimmat-trap-skeet";
      } else if (fullText.includes("magnum")) {
        result.category = "muhimmat-magnum";
      } else if (fullText.includes("çelik") || fullText.includes("celik") || fullText.includes("kurşunsuz")) {
        result.category = "muhimmat-kursunsuz-celik";
      } else if (fullText.includes("özel dolum") || fullText.includes("karışık")) {
        result.category = "muhimmat-ozel-dolum";
      } else {
        result.category = "muhimmat";
      }
    } else if (
      currentUrl.includes("cadir-aksesuarlari") ||
      ((fullText.includes("çadır") || fullText.includes("cadir") || fullText.includes("tent")) &&
       (fullText.includes("aksesuar") || fullText.includes("tente") || fullText.includes("kazık") || fullText.includes("ip") || fullText.includes("tamir")))
    ) {
      result.category = "kamp-cadir-aksesuari";
      result.requires_license = false;
    } else if (
      currentUrl.includes("cadir-k-") ||
      currentUrl.includes("cadir") ||
      fullText.includes("çadır") ||
      fullText.includes("cadir") ||
      fullText.includes("tent")
    ) {
      result.category = "kamp-cadir";
      result.requires_license = false;
    } else if (
      currentUrl.includes("uyku-tulumu") ||
      fullText.includes("uyku tulumu") ||
      fullText.includes("sleeping bag")
    ) {
      result.category = "kamp-uyku-tulumu";
      result.requires_license = false;
    } else if (
      currentUrl.includes("mat-k-") ||
      fullText.includes("kamp mat") ||
      fullText.includes("şişme mat") ||
      fullText.includes("şişme yatak") ||
      fullText.includes("mat ")
    ) {
      result.category = "kamp-mat";
      result.requires_license = false;
    } else if (
      fullText.includes("kamp") ||
      fullText.includes("termos") ||
      fullText.includes("matara") ||
      fullText.includes("sandalye") ||
      fullText.includes("kamp masa") ||
      fullText.includes("kamp ocak") ||
      fullText.includes("olta") ||
      fullText.includes("balık") ||
      fullText.includes("balik") ||
      fullText.includes("kamış") ||
      fullText.includes("kamis") ||
      fullText.includes("misina") ||
      fullText.includes("fener")
    ) {
      result.category = "kamp";
      result.requires_license = false;
    } else if (
      fullText.includes("bıçak") ||
      fullText.includes("bicak") ||
      fullText.includes("çakı") ||
      fullText.includes("caki") ||
      fullText.includes("balta") ||
      fullText.includes("bıçak kılıf") ||
      fullText.includes("bicak kilif") ||
      fullText.includes("multitool")
    ) {
      result.category = "bicak";
      result.requires_license = false;
    } else if (
      fullText.includes("dürbün") ||
      fullText.includes("durbun") ||
      fullText.includes("scope") ||
      fullText.includes("optik") ||
      fullText.includes("red dot") ||
      fullText.includes("reddot") ||
      fullText.includes("termal")
    ) {
      result.category = "optik";
      result.requires_license = false;
    } else if (
      fullText.includes("giyim") ||
      fullText.includes("mont") ||
      fullText.includes("pantolon") ||
      fullText.includes("yelek") ||
      fullText.includes("bot") ||
      fullText.includes("çizme") ||
      fullText.includes("yağmurluk")
    ) {
      result.category = "giyim";
      result.requires_license = false;
    }
  }

  return result;
}

function cleanImageUrl(url) {
  let u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("//")) u = "https:" + u;

  // Çift slash temizliği (örn: admin//Images -> admin/Images)
  u = u.replace(/([^:])\/{2,}/g, "$1/");

  // Kobimaster / Özler Av: /Medium/ veya /Small/ veya /Thumb/ -> /Large/
  u = u.replace(/\/Images\/Urun\/(Medium|Small|Thumb)\//gi, "/Images/Urun/Large/");

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
  const seenFiles = new Set();
  const res = [];
  for (const raw of urls) {
    if (!raw) continue;
    const cleaned = cleanImageUrl(raw);
    const norm = cleaned.replace(/-scaled\.(jpe?g|png|webp)/i, ".$1");

    // Dosya adı bazında tekilleştirme (örn: 33443_15082026095955.jpg)
    const fileMatch = norm.match(/\/([^\/?#]+\.(?:jpe?g|png|webp|avif))/i);
    const filename = fileMatch ? fileMatch[1].toLowerCase() : null;

    if (filename) {
      if (seenFiles.has(filename)) continue;
      seenFiles.add(filename);
    }

    if (!seen.has(norm)) {
      seen.add(norm);
      res.push(norm);
    }
  }
  return res;
}

