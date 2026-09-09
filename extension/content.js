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
        sendResponse({ success: true, count: links.length, links });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
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

function extractProductData(doc = (typeof document !== "undefined" ? document : null), pageUrl = "") {
  if (!doc) return {};
  const currentUrl = pageUrl || (typeof window !== "undefined" && window.location ? window.location.href : "");
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
    const h1 = doc.querySelector("h1");
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (h1 && h1.textContent.trim()) {
      result.title = h1.textContent.trim();
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

  // Bilinen Av & Silah Markaları Listesi ve Başlıktan Marka Çıkarımı
  const KNOWN_BRANDS = [
    "Castello", "Arslan", "Husan", "Derya", "Armsan", "Ata Arms", "Ata", "Mavoric",
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
      ".spanFiyat",
      ".satisFiyati",
      ".fiyat",
      ".kobi-price",
      "[id*='fiyat' i]",
      "[class*='fiyat' i]",
    ];

    let foundPriceEl = null;
    for (const sel of priceSelectors) {
      const el = doc.querySelector(sel);
      if (el && el.textContent.trim()) {
        foundPriceEl = el;
        break;
      }
    }

    if (!foundPriceEl) {
      foundPriceEl = Array.from(doc.querySelectorAll("span, div")).find((el) =>
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
    rawLines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower === "özellikler" || lower === "özellikleri" || lower === "ozellikler") {
        descList.push("Özellikler:");
        return;
      }
      if (lower.includes("taksit") || lower.includes("havale") || lower.includes("kargo") || lower.includes("kdv dahil") || lower.includes("net fiyat")) return;

      descList.push(line);

      if (line.includes(":")) {
        const parts = line.split(":");
        const k = parts[0].trim();
        const v = parts.slice(1).join(":").trim();
        if (k.length > 1 && k.length < 35 && v.length > 0 && v.length < 100) {
          if (!k.toLowerCase().includes("stok") && !k.toLowerCase().includes("sku") && !k.toLowerCase().includes("ürün kodu") && !k.toLowerCase().includes("kdv") && !k.toLowerCase().includes("fiyat") && !k.toLowerCase().includes("adet")) {
            specs[k] = v;
          }
        }
      } else {
        // İki nokta (colon) içermeyen satırlar (Yaban Av / IdeaSoft av fişeği özellikleri)
        if (/^(\d+)\s*(gram|gr)$/i.test(line)) {
          specs["Gramaj"] = line;
        } else if (/^(\d+)\s*(kalibre|cal)$/i.test(line)) {
          specs["Kalibre"] = line;
        } else if (/tapa/i.test(line) && line.length < 35) {
          specs["Tapa Tipi"] = line;
        } else if (/kovan\s*uzunlu[ğg]u/i.test(line)) {
          specs["Kovan Uzunluğu"] = line.replace(/kovan\s*uzunlu[ğg]u\s*[:\s]*/i, "");
        } else if (/paket(?:te)?/i.test(line) || /^\d+\s*adet$/i.test(line)) {
          specs["Paket İçeriği"] = line.replace(/paket(?:te)?\s*[:\s]*/i, "");
        } else if (/saçma\s*(?:no|numaras[ıi])/i.test(line)) {
          specs["Saçma No"] = line.replace(/saçma\s*(?:no|numaras[ıi])\s*[:\s]*/i, "");
        } else if (/h[ıi]z/i.test(line) && /\d+\s*m\/s/i.test(line)) {
          specs["Namlu Çıkış Hızı"] = line;
        } else if (/bas[ıi]nç/i.test(line) && /\d+\s*bar/i.test(line)) {
          specs["Basınç"] = line;
        } else if (lower.includes("misina") && !specs["Misina"]) {
          specs["Misina"] = line;
        } else if ((lower.includes("kamış") || lower.includes("karbon") || lower.includes("fiberglas")) && !specs["Kamış Yapısı"]) {
          specs["Kamış Yapısı"] = line;
        } else if (lower.includes("kurulu") && !specs["Kurulum"]) {
          specs["Kurulum"] = line;
        } else if ((lower.includes("kaldır") || lower.includes("kiloluk") || lower.includes("kapasite")) && !specs["Taşıma Kapasitesi"]) {
          specs["Taşıma Kapasitesi"] = line.replace(/[\(\)]/g, "").trim();
        }
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
      ([k]) => !["Marka", "Model", "Kategori", "Stok Kodu", "Ürün Kodu", "SKU", "sku"].includes(k)
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
  if (lengthMatch && !specs["Kamış Boyu"] && !specs["Uzunluk"]) {
    specs["Uzunluk"] = lengthMatch[1];
  }

  if (currentUrl.includes("/bullpup/") || result.title.toLowerCase().includes("bullpup")) {
    if (!result.category) result.category = "Tüfek - Bullpup";
    specs["Tipi"] = "Bullpup";
  }

  // KULLANICI TALEBİ: "stok kodunu almasın" -> Stok Kodu ve SKU kesinlikle çıkarılır
  delete specs["Stok Kodu"];
  delete specs["stok kodu"];
  delete specs["Ürün Kodu"];
  delete specs["SKU"];
  delete specs["sku"];
  delete specs["Kategori"];
  // Fiyat bilgisi specs'lerden kesinlikle çıkarılır (yasal gereklilik)
  Object.keys(specs).forEach(k => {
    const kl = k.toLowerCase();
    if (kl.includes("kdv") || kl.includes("net fiyat") || kl.includes("fiyat") && kl.includes("adet")) {
      delete specs[k];
    }
  });

  // Eğer model bir dahili depo stok koduysa (yb_..., stk_...), modeli temizle
  if (result.model && /^yb_|^stk_|^prd_|^art_/i.test(result.model)) {
    result.model = "";
  }

  result.specs = specs;

  // Marka / Model tekrar kontrolü
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
  const isFirearm =
    titleLower.includes("tüfek") ||
    titleLower.includes("tufek") ||
    titleLower.includes("tabanca") ||
    titleLower.includes("av tüfeği") ||
    titleLower.includes("av tufegi") ||
    titleLower.includes("pompalı") ||
    titleLower.includes("pompali") ||
    titleLower.includes("poze") ||
    titleLower.includes("çifte") ||
    titleLower.includes("cifte");

  if (isFirearm) {
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

