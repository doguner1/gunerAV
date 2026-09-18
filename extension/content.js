// Güner AV - Tedarikçi Sayfası Gelişmiş İçerik Yakalayıcı (Content Script)
// AvAlemi / IdeaSoft, Ticimax, T-Soft, Shopify ve standart e-ticaret siteleri ile %100 uyumlu.

let cachedCustomSiteRules = {};
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get("customSiteRules", (res) => {
    if (res?.customSiteRules) cachedCustomSiteRules = res.customSiteRules;
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.customSiteRules) {
      cachedCustomSiteRules = changes.customSiteRules.newValue || {};
    }
  });
}

// =========================================================================
// NETWORK/API YAKALAMA SİSTEMİ - SPA siteler için ürün verisini API'den çeker
// =========================================================================
const capturedApiData = {
  product: null,
  responses: [],
  productUrls: new Set(),
};

function initApiInterceptor() {
  if (window._gunerAvApiInterceptorInitialized) return;
  window._gunerAvApiInterceptorInitialized = true;

  const productUrlPatterns = [
    /\/api\/.*product/i,
    /\/api\/.*urun/i,
    /\/graphql/i,
    /\/product\//i,
    /\/urun\//i,
    /\/item\//i,
    /\/p\//i,
    /product.*detail/i,
    /urun.*detay/i,
  ];

  function isProductRelatedUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      const path = urlObj.pathname.toLowerCase();
      const search = urlObj.search.toLowerCase();
      return productUrlPatterns.some(p => p.test(path) || p.test(search));
    } catch {
      return false;
    }
  }

  function tryExtractProductFromJson(json) {
    if (!json || typeof json !== "object") return null;

    const candidates = [];

    function traverse(obj, depth = 0) {
      if (depth > 4) return;
      if (!obj || typeof obj !== "object") return;

      if (Array.isArray(obj)) {
        obj.forEach(item => traverse(item, depth + 1));
        return;
      }

      // Ürün benzeri obje mi?
      const keys = Object.keys(obj).map(k => k.toLowerCase());
      const hasProductFields = keys.some(k =>
        ["name", "title", "urunadi", "urun_adi", "productname", "product_name", "adi"].includes(k)
      ) && keys.some(k =>
        ["price", "fiyat", "saleprice", "satis_fiyati", "satisfiyati", "amount", "tutar"].includes(k)
      );

      if (hasProductFields) {
        candidates.push(obj);
      }

      Object.values(obj).forEach(v => traverse(v, depth + 1));
    }

    traverse(json);

    if (candidates.length > 0) {
      // En kapsamlı olanı seç
      return candidates.reduce((best, curr) =>
        Object.keys(curr).length > Object.keys(best).length ? curr : best
      );
    }
    return null;
  }

  // fetch intercept
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (url, options = {}) {
    const isProductUrl = isProductRelatedUrl(url.toString());
    const response = await originalFetch(url, options);

    if (isProductUrl && response.ok) {
      const cloned = response.clone();
      try {
        const contentType = cloned.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await cloned.json();
          const product = tryExtractProductFromJson(json);
          if (product) {
            capturedApiData.product = product;
            capturedApiData.responses.push({ url: url.toString(), data: product, timestamp: Date.now() });
            console.log("[GünerAV] API'den ürün verisi yakalandı:", url);
          }
        }
      } catch (e) {}
    }
    return response;
  };

  // XHR intercept
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._gunerAvUrl = url;
    this._gunerAvIsProduct = isProductRelatedUrl(url.toString());
    return originalXHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (this._gunerAvIsProduct) {
      this.addEventListener("load", function () {
        if (this.status >= 200 && this.status < 300) {
          const contentType = this.getResponseHeader("content-type") || "";
          if (contentType.includes("application/json")) {
            try {
              const json = JSON.parse(this.responseText);
              const product = tryExtractProductFromJson(json);
              if (product) {
                capturedApiData.product = product;
                capturedApiData.responses.push({ url: this._gunerAvUrl, data: product, timestamp: Date.now() });
                console.log("[GünerAV] XHR'dan ürün verisi yakalandı:", this._gunerAvUrl);
              }
            } catch (e) {}
          }
        }
      });
    }
    return originalXHRSend.apply(this, arguments);
  };

  console.log("[GünerAV] API Interceptor aktif");
}

// Sayfa yüklendiğinde başlat
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApiInterceptor);
} else {
  initApiInterceptor();
}

// Global erişim için
window._gunerAvCapturedApiData = capturedApiData;

if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_CLEAN_PAGE_HTML") {
      (async () => {
        try {
          const info = await getCleanPageHtml();
          sendResponse({ success: true, data: info });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
      return true;
    }

    if (request.action === "TEST_AI_SELECTORS") {
      try {
        const preview = extractWithCustomRule({ selectors: request.selectors }, document);
        sendResponse({ success: true, data: preview });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }

    if (request.action === "EXTRACT_PRODUCT") {
      (async () => {
        try {
          const data = await extractProductData();
          sendResponse({ success: true, data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })();
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
          const data = await extractProductData(doc, request.url);
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

  // 0. AI İle Öğrenilmiş Özel Liste Seçicisi Varsa
  let pageDomain = "";
  try {
    const rawUrl = origin || (typeof window !== "undefined" && window.location ? window.location.href : "");
    pageDomain = new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch (e) {}

  if (pageDomain && cachedCustomSiteRules[pageDomain]?.selectors?.listing_link) {
    try {
      const customAnchors = doc.querySelectorAll(cachedCustomSiteRules[pageDomain].selectors.listing_link);
      customAnchors.forEach((a) => {
        let href = a.getAttribute("href") || a.href;
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;
        if (href.startsWith("/")) {
          href = (origin || "") + href;
        }
        const clean = href.split("#")[0].split("?")[0];
        if (clean.startsWith("http")) foundUrls.add(clean);
      });
    } catch (e) {
      console.warn("Özel listeleme seçicisi hatası:", e);
    }
  }

  // Altunbaş Bayi Sistemi özel yakalama
  if (pageDomain.includes("altunbasas")) {
    const altAnchors = doc.querySelectorAll(
      ".product-item-1 a, [class*='product-item'] a, .product-details h5 a, .product-details a"
    );
    altAnchors.forEach((a) => {
      let href = a.getAttribute("href");
      if (!href) return;
      href = href.trim();
      if (href.startsWith("#") || href.startsWith("javascript:")) return;
      if (href.includes("-urunleri") || href.includes("brandid=") || href.includes("hesabim") || href.includes("sepet")) return;
      try {
        const fullUrl = new URL(href, origin).href;
        foundUrls.add(fullUrl);
      } catch (e) {}
    });
    if (foundUrls.size > 0) {
      return Array.from(foundUrls);
    }
  }

  // Özler Av (.uruncard, .kobi-urunlist, .urun-grid), Altunbaş ve genel e-ticaret seçicileri
  const candidateAnchors = doc.querySelectorAll(
    ".urun-grid a, .kobi-urunlist a, .uruncard a, .product-item a, [class*='product-item'] a, .product-details a, .product-card a, .product-box a, a[href*='-p-']"
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
  const anchors = doc.querySelectorAll("a[href*='PageNumber='], a[href*='sayfa='], a[href*='page='], .pagination a, .sayfalama a");
  anchors.forEach((a) => {
    const href = a.getAttribute("href");
    if (href && (href.includes("PageNumber=") || href.includes("sayfa=") || href.includes("page="))) {
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

// AI Destekli Site Analizi İçin Temizlenmiş HTML İskeleti Çıkarıcı
async function getCleanPageHtml() {
  const doc = document;

  // SPA siteler için: ürün verisi DOM'a yüklenene kadar bekle (max 3 sn)
  await waitForProductContent(doc, 3000);

  const clone = doc.cloneNode(true);

  // Yakalanan API verisini de HTML snippet'e ekle (AI için)
  let apiHtmlAddition = "";
  try {
    const apiData = window._gunerAvCapturedApiData?.product;
    if (apiData) {
      apiHtmlAddition = "\n<!--YAKALANAN_API_VERISI-->\n" + JSON.stringify(apiData, null, 2).slice(0, 5000);
    }
  } catch (e) {}

  // Gereksiz etiketleri kaldırarak token ve boyut tasarrufu sağla
  const removeSelectors = [
    "script", "style", "svg", "noscript", "iframe", "header", "footer",
    "nav", ".navbar", ".header", ".footer", ".nav", ".menu", ".sidebar",
    "#header", "#footer", "#menu", "#sidebar", ".cookie-banner", ".modal",
    "#modal", ".cart", "#cart", ".sepet", ".search", "#search", ".comments",
    ".reviews", ".similar-products", ".related-products", ".benzer-urunler"
  ];
  removeSelectors.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // Sadece gerekli nitelikleri (class, id, src, data-src) bırak, gerisini temizle
  clone.querySelectorAll("*").forEach((el) => {
    const allowedAttrs = ["class", "id", "src", "data-src", "data-zoom-image", "data-large"];
    Array.from(el.attributes).forEach((attr) => {
      if (!allowedAttrs.includes(attr.name)) {
        el.removeAttribute(attr.name);
      }
    });

    if (el.tagName === "IMG") {
      const src = el.getAttribute("src") || "";
      if (src.startsWith("data:")) {
        el.setAttribute("src", "[base64_gorsel]");
      }
    }
  });

  // Ürün ana gövdesi adayı
  const mainCandidate = clone.querySelector(".product-detail, .product-container, .urun-detay, .product-page, [itemtype*='Product'], main, #content");
  let html = mainCandidate ? mainCandidate.innerHTML : (clone.body ? clone.body.innerHTML : clone.innerHTML);

  // Açıklama ve özellikler için ek bölümleri dahil et (mainCandidate dışında kalanlar)
  const descSelectors = [".product-description", ".product-detail .description", "#tab_Ürün-açıklaması", "#tab-Ürün-açıklaması", ".entry-content", ".divAciklamaIcerik", "[itemprop='description']"];
  descSelectors.forEach(sel => {
    const el = clone.querySelector(sel);
    if (el && el.innerHTML.trim().length > 10) {
      html += "\n<!--AÇIKLAMA-->" + el.innerHTML;
    }
  });

  // Teknik özellikler tabloları
  const specSelectors = ["table.product-specs", ".tech-specs", ".specifications", ".product-list-row", ".product-feature-row", ".feature-row", ".spec-row", "table"];
  specSelectors.forEach(sel => {
    const els = clone.querySelectorAll(sel);
    els.forEach(el => {
      if (el.innerHTML.trim().length > 5) {
        html += "\n<!--ÖZELLİKLER-->" + el.outerHTML;
      }
    });
  });

  // API verisini de ekle
  if (apiHtmlAddition) html += apiHtmlAddition;

  // Boşlukları sıkıştır
  html = html.replace(/\s+/g, " ").trim();

  // Daha düşük token limitiyle çalışmak için en fazla 18.000 karakter tut (AI bağlamı daha büyük)
  const MAX_CHARS = 18000;
  if (html.length > MAX_CHARS) {
    html = html.slice(0, MAX_CHARS) + "... [HTML kesildi]";
  }

  // Sayfa başlığı ve açıklamasını da eklemek için metin içeriği
  const pageTitle = doc.title || "";
  const metaDesc = (doc.querySelector('meta[name="description"]') || {}).content || "";
  const ogDesc = (doc.querySelector('meta[property="og:description"]') || {}).content || "";
  const descriptionText = metaDesc || ogDesc || "";

  return {
    url: window.location.href,
    domain: window.location.hostname.replace(/^www\./, "").toLowerCase(),
    title: pageTitle,
    description: descriptionText,
    htmlSnippet: html,
  };
}

function waitForProductContent(doc, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const productSelectors = [
      "[itemprop='name']", "[itemprop='price']", "[itemprop='description']",
      "h1.product-title", "h1.product-name", ".product-title", ".product-name", ".urun-adi",
      ".price", ".product-price", ".fiyat", "[itemprop='price']",
      ".product-description", ".description", "[itemprop='description']",
      ".product-gallery", ".product-images", ".gallery",
      ".specifications", ".product-specs", ".tech-specs"
    ];

    function checkContent() {
      const hasContent = productSelectors.some(sel => doc.querySelector(sel));
      if (hasContent) return resolve();

      if (Date.now() - startTime > timeoutMs) return resolve();

      requestAnimationFrame(checkContent);
    }

    // MutationObserver ile daha hızlı tepki
    const observer = new MutationObserver(() => {
      if (productSelectors.some(sel => doc.querySelector(sel))) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(doc.body, { childList: true, subtree: true, attributes: true });

    checkContent();
  });
}

// AI ile Üretilmiş Özel Seçicileri (Selectors) Sayfada Çalıştırıp Veri Çekme
function extractWithCustomRule(customRule, doc = (typeof document !== "undefined" ? document : null)) {
  if (!doc || !customRule || !customRule.selectors) return null;
  const sel = customRule.selectors;
  const result = {
    title: "",
    price: null,
    images: [],
    specs: {},
    brand: "",
    description: "",
  };

  // Title
  if (sel.title) {
    try {
      const el = doc.querySelector(sel.title);
      if (el && el.textContent.trim()) result.title = el.textContent.trim();
    } catch (e) {}
  }

  // Price
  if (sel.price) {
    try {
      const el = doc.querySelector(sel.price);
      if (el) {
        result.price = parseTurkishPrice(el.textContent.trim());
      }
    } catch (e) {}
  }

  // Brand
  if (sel.brand) {
    try {
      const el = doc.querySelector(sel.brand);
      if (el && el.textContent.trim()) result.brand = el.textContent.trim();
    } catch (e) {}
  }

  // Description
  if (sel.description) {
    try {
      const el = doc.querySelector(sel.description);
      if (el && el.textContent.trim()) result.description = el.textContent.trim();
    } catch (e) {}
  }

  // Images
  if (sel.images) {
    try {
      const attr = sel.image_attr || "src";
      const imgs = doc.querySelectorAll(sel.images);
      imgs.forEach((img) => {
        const src = img.getAttribute(attr) || img.getAttribute("data-src") || img.getAttribute("src") || img.getAttribute("data-zoom-image");
        if (src && !src.startsWith("data:") && !src.includes("blank.gif")) {
          const clean = cleanImageUrl(src);
          if (clean && !result.images.includes(clean)) result.images.push(clean);
        }
      });
    } catch (e) {}
  }

  // Specs Table
  if (sel.specs_table || sel.specs_row) {
    try {
      const rowSelector = sel.specs_row || `${sel.specs_table} tr, ${sel.specs_table} li`;
      const rows = doc.querySelectorAll(rowSelector);
      rows.forEach((row) => {
        const keyEl = sel.specs_key ? row.querySelector(sel.specs_key) : row.querySelector("th, td:first-child, dt, strong");
        const valEl = sel.specs_val ? row.querySelector(sel.specs_val) : row.querySelector("td:last-child, dd, span");
        if (keyEl && valEl) {
          const k = keyEl.textContent.trim().replace(/[:：]$/, "");
          const v = valEl.textContent.trim();
          if (k && v && k !== v && k.length < 50) {
            result.specs[k] = v;
          }
        }
      });
    } catch (e) {}
  }

  return result;
}

async function extractProductData(doc = (typeof document !== "undefined" ? document : null), pageUrl = "") {
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

  // =========================================================================
  // 0. AI İle Öğrenilmiş Özel Site Kuralları (Varsa En Öncelikli Çalışır)
  // =========================================================================
  let pageDomain = "";
  try {
    pageDomain = new URL(currentUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch (e) {}

  if (pageDomain && cachedCustomSiteRules[pageDomain]) {
    try {
      const customExtracted = extractWithCustomRule(cachedCustomSiteRules[pageDomain], doc);
      if (customExtracted) {
        if (customExtracted.title) result.title = customExtracted.title;
        if (customExtracted.price !== null && customExtracted.price !== undefined) result.price = customExtracted.price;
        if (customExtracted.brand) result.brand = customExtracted.brand;
        if (customExtracted.description) result.description = customExtracted.description;
        if (Array.isArray(customExtracted.images) && customExtracted.images.length > 0) {
          result.images = [...customExtracted.images];
        }
        if (customExtracted.specs && Object.keys(customExtracted.specs).length > 0) {
          result.specs = { ...customExtracted.specs };
        }
      }
    } catch (ruleErr) {
      console.warn("Özel kural çalıştırma uyarısı:", ruleErr);
    }
  }

  // =========================================================================
  // 0b. YAKALANAN API VERİSİ (SPA siteler için - en yüksek öncelik)
  // =========================================================================
  try {
    const apiData = window._gunerAvCapturedApiData?.product;
    if (apiData) {
      const mapApiField = (obj, possibleKeys) => {
        for (const key of possibleKeys) {
          const val = obj[key] || obj[key.toLowerCase()] || obj[key.toUpperCase()];
          if (val !== undefined && val !== null && val !== "") return val;
        }
        return null;
      };

      // Title: önce tam başlığı dene, yoksa brand+model'den oluştur
      let title = mapApiField(apiData, [
        "fullName", "full_name", "fullTitle", "full_title", "displayName", "display_name",
        "productTitle", "product_title", "productFullName", "product_full_name",
        "name", "title", "productName", "product_name", "urunAdi", "urun_adi", "adi"
      ]);
      
      const brand = mapApiField(apiData, ["brand", "marka", "brandName", "brand_name", "manufacturer", "uretimci"]);
      const model = mapApiField(apiData, ["model", "sku", "mpn", "productCode", "product_code", "urunKodu", "urun_kodu", "code", "partNumber", "variant", "variantName", "variant_name"]);
      const variant = mapApiField(apiData, ["variant", "variantName", "variant_name", "renk", "color", "renkAdi", "renk_adi"]);
      const caliber = mapApiField(apiData, ["caliber", "kalibre", "kaliber", "gauge"]);

      // Eğer title sadece model ise (kısa, tek kelime, büyük harf) → brand+model birleştir
      const isJustModel = title && title.trim().length < 30 && 
        /^[A-ZÇĞİÖŞÜ0-9\s\-]+$/i.test(title.trim()) && 
        !/\s/.test(title.trim().split(/[\s\-]+/)[0]); // tek kelime görünüyorsa

      if (title && !isJustModel) {
        result.title = String(title).trim();
      } else if (brand && model) {
        // Brand + Model + Variant + Caliber birleştir
        const parts = [brand, model];
        if (variant && !model.toLowerCase().includes(variant.toLowerCase())) parts.push(variant);
        if (caliber && !model.toLowerCase().includes(caliber.toLowerCase())) parts.push(caliber);
        result.title = parts.join(" ");
      } else if (title) {
        result.title = String(title).trim();
      }

      if (brand) result.brand = String(brand).trim();

      if (model) result.model = String(model).trim();

      const price = mapApiField(apiData, ["price", "fiyat", "salePrice", "sale_price", "satisFiyati", "satis_fiyati", "amount", "tutar", "listPrice", "list_price"]);
      if (price !== null) {
        const parsed = parseTurkishPrice(price);
        if (parsed) result.price = parsed;
      }

      const images = mapApiField(apiData, ["images", "resimler", "imageUrls", "image_urls", "photos", "pictures", "gallery", "gorseller"]);
      if (images && Array.isArray(images)) {
        images.forEach(img => {
          const url = typeof img === "string" ? img : (img?.url || img?.src || img?.image);
          if (url) {
            const clean = cleanImageUrl(url);
            if (clean && !result.images.includes(clean)) result.images.push(clean);
          }
        });
      } else if (images && typeof images === "string") {
        const clean = cleanImageUrl(images);
        if (clean) result.images.push(clean);
      }

      const description = mapApiField(apiData, ["description", "aciklama", "aciklama_uzun", "shortDescription", "short_description", "detay", "content", "icerik"]);
      if (description) result.description = String(description).trim();

      const specs = mapApiField(apiData, ["specifications", "specs", "ozellikler", "attributes", "features", "teknikOzellikler", "teknik_ozellikler", "productAttributes"]);
      if (specs && typeof specs === "object") {
        Object.entries(specs).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== "") {
            result.specs[String(k).trim()] = String(v).trim();
          }
        });
      }

      const category = mapApiField(apiData, ["category", "kategori", "categoryName", "category_name", "categoryPath", "category_path"]);
      if (category) result.category = String(category).trim();

      const inStock = mapApiField(apiData, ["inStock", "in_stock", "stokDurumu", "stok_durumu", "availability", "stockStatus", "stock_status"]);
      if (inStock !== null) result.in_stock = Boolean(inStock);

      console.log("[GünerAV] API verisinden ürün dolduruldu:", { title: result.title, brand: result.brand, price: result.price });
    }
  } catch (e) {
    console.warn("API verisi işlenirken hata:", e);
  }

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

  const isAirgun =
    titleLower.includes("havalı tabanca") ||
    titleLower.includes("havali tabanca") ||
    titleLower.includes("havalı tüfek") ||
    titleLower.includes("havali tufek") ||
    titleLower.includes("havalı tufek") ||
    titleLower.includes("havali tüfek") ||
    titleLower.includes("kurusıkı") ||
    titleLower.includes("kurusiki") ||
    titleLower.includes("ses tabancası") ||
    titleLower.includes("ses tabancasi") ||
    titleLower.includes("airgun") ||
    titleLower.includes("air pistol") ||
    titleLower.includes("air rifle") ||
    titleLower.includes("co2 tüp") ||
    titleLower.includes("co2 tup") ||
    titleLower.includes("havalı saçma") ||
    titleLower.includes("havali sacma") ||
    titleLower.includes("pellet") ||
    fullText.includes("havali-tabanca") ||
    fullText.includes("havali-tufek") ||
    fullText.includes("kurusiki-tabanca");

  const isFirearm =
    !isAirgun &&
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

  if (isAirgun) {
    result.requires_license = false;
    if ((titleLower.includes("tabanca") || titleLower.includes("pistol")) && !titleLower.includes("tüfek") && !titleLower.includes("tufek")) {
      if (titleLower.includes("kurusıkı") || titleLower.includes("kurusiki") || titleLower.includes("ses tabanca")) {
        result.category = "kurusiki-tabanca";
      } else {
        result.category = "havali-tabanca";
      }
    } else if (titleLower.includes("tüfek") || titleLower.includes("tufek") || titleLower.includes("rifle")) {
      result.category = "havali-tufek";
    } else if (titleLower.includes("pellet") || titleLower.includes("saçma") || titleLower.includes("sacma") || titleLower.includes("co2")) {
      result.category = "havali-muhimmat";
    } else {
      result.category = "havali-kurusiki";
    }
  } else if (isOptic) {
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

  result.url = currentUrl;

  const urlLow = (currentUrl || "").toLowerCase();
  const nameLow = ((result.title || "") + " " + (result.brand || "")).toLowerCase();
  if (urlLow.includes("arslansilah") || nameLow.includes("castello")) {
    result.supplier_id = 1;
  } else if (urlLow.includes("ozlerav")) {
    result.supplier_id = 2;
  } else {
    result.supplier_id = 2;
  }

  const hasMinimalData = result.title && (result.price || result.brand || result.images.length > 0);
  
  if (!hasMinimalData) {
    try {
      const universalResult = await extractProductUniversal(doc, currentUrl, cachedCustomSiteRules);
      
      if (universalResult.title) result.title = universalResult.title;
      if (universalResult.brand) result.brand = universalResult.brand;
      if (universalResult.model) result.model = universalResult.model;
      if (universalResult.price !== null) result.price = universalResult.price;
      if (universalResult.images.length > 0) result.images = [...new Set([...result.images, ...universalResult.images])];
      if (Object.keys(universalResult.specs).length > 0) result.specs = { ...result.specs, ...universalResult.specs };
      if (universalResult.description) result.description = universalResult.description;
      if (universalResult.category) result.category = universalResult.category;
      if (universalResult.variants?.length > 0) result.variants = universalResult.variants;
      if (universalResult._needsAiAnalysis) result._needsAiAnalysis = true;
      if (universalResult._extractionLog) result._extractionLog = universalResult._extractionLog;
      if (universalResult._extractionMethod) result._extractionMethod = universalResult._extractionMethod;
    } catch (e) {
      console.warn("Universal extractor fallback failed:", e);
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

class UniversalProductExtractor {
  constructor(doc, url, customRules = {}) {
    this.doc = doc;
    this.url = url;
    this.domain = this.extractDomain(url);
    this.customRules = customRules[this.domain] || null;
    this.result = {
      title: "",
      brand: "",
      model: "",
      category: "",
      price: null,
      in_stock: true,
      images: [],
      specs: {},
      description: "",
      variants: [],
      requires_license: false,
      supplier_id: 2,
    };
    this.extractionLog = [];
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch (e) {
      return "";
    }
  }

  log(step, success, details = "") {
    this.extractionLog.push({ step, success, details, timestamp: Date.now() });
  }

  async extract() {
    this.log("start", true, `Domain: ${this.domain}`);

    if (this.customRules?.selectors) {
      const customData = this.applyCustomRules();
      if (this.hasMeaningfulData(customData)) {
        this.mergeResult(customData);
        this.log("custom_rules", true, "Özel kural ile veri çekildi");
        return this.finalize();
      }
    }

    const strategies = [
      { name: "schema_org", fn: () => this.extractSchemaOrg() },
      { name: "open_graph", fn: () => this.extractOpenGraph() },
      { name: "json_ld", fn: () => this.extractJsonLd() },
      { name: "meta_tags", fn: () => this.extractMetaTags() },
      { name: "js_variables", fn: () => this.extractJsVariables() },
      { name: "microdata", fn: () => this.extractMicrodata() },
      { name: "heuristic_dom", fn: () => this.extractHeuristicDom() },
      { name: "fallback_generic", fn: () => this.extractFallbackGeneric() },
    ];

    for (const strategy of strategies) {
      try {
        const data = strategy.fn();
        if (data && this.hasMeaningfulData(data)) {
          this.mergeResult(data);
          this.log(strategy.name, true, `Veri bulundu: ${Object.keys(data).filter(k => data[k]).join(", ")}`);
          
          if (this.isResultComplete()) {
            this.log("complete", true, "Tüm alanlar doldu, erken çıkış");
            break;
          }
        } else {
          this.log(strategy.name, false, "Anlamlı veri bulunamadı");
        }
      } catch (e) {
        this.log(strategy.name, false, `Hata: ${e.message}`);
      }
    }

    if (!this.isResultComplete()) {
      this.log("needs_ai", true, "Standart yöntemler yetersiz, AI analizi gerekli");
      this.result._needsAiAnalysis = true;
      this.result._extractionLog = this.extractionLog;
    }

    return this.finalize();
  }

  hasMeaningfulData(data) {
    if (!data) return false;
    const meaningfulFields = ["title", "price", "brand", "images"];
    return meaningfulFields.some(f => data[f] && (Array.isArray(data[f]) ? data[f].length > 0 : data[f].toString().trim().length > 0));
  }

  isResultComplete() {
    const required = ["title", "price", "brand", "images"];
    return required.every(f => this.result[f] && (Array.isArray(this.result[f]) ? this.result[f].length > 0 : this.result[f].toString().trim().length > 0));
  }

  mergeResult(data) {
    for (const key of Object.keys(this.result)) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
        if (Array.isArray(this.result[key]) && Array.isArray(data[key])) {
          this.result[key] = [...new Set([...this.result[key], ...data[key]])];
        } else if (typeof this.result[key] === "object" && typeof data[key] === "object") {
          this.result[key] = { ...this.result[key], ...data[key] };
        } else if (!this.result[key]) {
          this.result[key] = data[key];
        }
      }
    }
  }

  applyCustomRules() {
    if (!this.customRules?.selectors) return null;
    return extractWithCustomRule(this.customRules, this.doc);
  }

  extractSchemaOrg() {
    const data = {};
    const productNodes = this.doc.querySelectorAll('[itemtype*="Product"], [itemtype*="product"]');
    
    for (const node of productNodes) {
      const nameEl = node.querySelector('[itemprop="name"]');
      if (nameEl && !data.title) data.title = nameEl.textContent.trim();

      const brandEl = node.querySelector('[itemprop="brand"] [itemprop="name"], [itemprop="brand"]');
      if (brandEl && !data.brand) {
        data.brand = brandEl.getAttribute("content") || brandEl.textContent.trim();
      }

      const priceEl = node.querySelector('[itemprop="price"]');
      if (priceEl && !data.price) {
        const price = priceEl.getAttribute("content") || priceEl.textContent;
        data.price = parseTurkishPrice(price);
      }

      const imageEl = node.querySelector('[itemprop="image"]');
      if (imageEl && !data.images) {
        const src = imageEl.getAttribute("content") || imageEl.src || imageEl.getAttribute("data-src");
        if (src) data.images = [cleanImageUrl(src)];
      }

      const descEl = node.querySelector('[itemprop="description"]');
      if (descEl && !data.description) data.description = descEl.textContent.trim();

      const skuEl = node.querySelector('[itemprop="sku"], [itemprop="mpn"]');
      if (skuEl && !data.model) data.model = skuEl.getAttribute("content") || skuEl.textContent.trim();

      const availabilityEl = node.querySelector('[itemprop="availability"]');
      if (availabilityEl) {
        const href = availabilityEl.getAttribute("href") || "";
        data.in_stock = !href.includes("OutOfStock") && !href.includes("SoldOut");
      }
    }
    return data;
  }

  extractOpenGraph() {
    const data = {};
    const ogTitle = this.doc.querySelector('meta[property="og:title"]');
    if (ogTitle) data.title = ogTitle.content.trim();

    const ogPrice = this.doc.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"]');
    if (ogPrice) data.price = parseTurkishPrice(ogPrice.content);

    const ogCurrency = this.doc.querySelector('meta[property="product:price:currency"], meta[property="og:price:currency"]');
    if (ogCurrency && data.price) data.currency = ogCurrency.content;

    const ogBrand = this.doc.querySelector('meta[property="product:brand"], meta[property="og:brand"]');
    if (ogBrand) data.brand = ogBrand.content.trim();

    const ogImage = this.doc.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const src = cleanImageUrl(ogImage.content);
      if (src && !src.includes("logo") && !src.includes("favicon")) data.images = [src];
    }

    const ogImages = this.doc.querySelectorAll('meta[property="og:image"]');
    if (ogImages.length > 1) {
      data.images = Array.from(ogImages)
        .map(m => cleanImageUrl(m.content))
        .filter(u => u && !u.includes("logo") && !u.includes("favicon"));
    }

    const ogDesc = this.doc.querySelector('meta[property="og:description"]');
    if (ogDesc) data.description = ogDesc.content.trim();

    const ogAvailability = this.doc.querySelector('meta[property="product:availability"]');
    if (ogAvailability) data.in_stock = !ogAvailability.content.includes("outofstock");

    return data;
  }

  extractJsonLd() {
    const data = {};
    const scripts = this.doc.querySelectorAll('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent);
        const items = Array.isArray(json) ? json : [json];
        
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
            if (item.name && !data.title) data.title = item.name;
            if (item.brand?.name && !data.brand) data.brand = item.brand.name;
            if (item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offers.price && !data.price) data.price = parseTurkishPrice(offers.price);
              if (offers.availability) data.in_stock = !offers.availability.includes("OutOfStock");
            }
            if (item.image) {
              const images = Array.isArray(item.image) ? item.image : [item.image];
              data.images = images.map(cleanImageUrl).filter(u => u && !u.includes("logo"));
            }
            if (item.description && !data.description) data.description = item.description;
            if (item.sku && !data.model) data.model = item.sku;
            if (item.mpn && !data.model) data.model = item.mpn;
          }
        }
      } catch (e) {}
    }
    return data;
  }

  extractMetaTags() {
    const data = {};
    const metaSelectors = {
      title: ['meta[name="title"]', 'meta[name="product:title"]', 'meta[itemprop="name"]'],
      price: ['meta[name="price"]', 'meta[name="product:price"]', 'meta[itemprop="price"]', 'meta[property="product:price"]'],
      brand: ['meta[name="brand"]', 'meta[name="product:brand"]', 'meta[itemprop="brand"]'],
      model: ['meta[name="sku"]', 'meta[name="product:sku"]', 'meta[name="mpn"]', 'meta[itemprop="sku"]', 'meta[itemprop="mpn"]'],
      description: ['meta[name="description"]', 'meta[property="og:description"]', 'meta[itemprop="description"]'],
      image: ['meta[name="image"]', 'meta[property="og:image"]', 'meta[itemprop="image"]'],
    };

    for (const [field, selectors] of Object.entries(metaSelectors)) {
      for (const sel of selectors) {
        const el = this.doc.querySelector(sel);
        if (el) {
          const val = el.getAttribute("content") || el.textContent;
          if (val && val.trim()) {
            if (field === "price") data[field] = parseTurkishPrice(val);
            else if (field === "image") data.images = [cleanImageUrl(val)].filter(u => u);
            else data[field] = val.trim();
            break;
          }
        }
      }
    }
    return data;
  }

  extractJsVariables() {
    const data = {};
    const html = this.doc.documentElement.innerHTML;
    
    const patterns = {
      title: [
        /fullName\s*:\s*["']([^"']+)["']/i,
        /productName\s*:\s*["']([^"']+)["']/i,
        /product_title\s*:\s*["']([^"']+)["']/i,
        /pageTitle\s*:\s*["']([^"']+)["']/i,
        /"name"\s*:\s*"([^"]+)"/i,
      ],
      price: [
        /salePrice\s*:\s*([\d\.]+)/i,
        /price\s*:\s*([\d\.]+)/i,
        /productPrice\s*:\s*([\d\.]+)/i,
        /"price"\s*:\s*([\d\.]+)/i,
        /priceAmount\s*:\s*([\d\.]+)/i,
      ],
      brand: [
        /brandName\s*:\s*["']([^"']+)["']/i,
        /brand\s*:\s*["']([^"']+)["']/i,
        /manufacturer\s*:\s*["']([^"']+)["']/i,
        /"brand"\s*:\s*"([^"]+)"/i,
      ],
      model: [
        /productCode\s*:\s*["']([^"']+)["']/i,
        /sku\s*:\s*["']([^"']+)["']/i,
        /mpn\s*:\s*["']([^"']+)["']/i,
        /"sku"\s*:\s*"([^"]+)"/i,
        /"model"\s*:\s*"([^"]+)"/i,
      ],
      category: [
        /categoryName\s*:\s*["']([^"']+)["']/i,
        /category\s*:\s*["']([^"']+)["']/i,
        /"category"\s*:\s*"([^"]+)"/i,
      ],
      images: [
        /primaryImageUrl\s*:\s*["']([^"']+)["']/i,
        /productImage\s*:\s*["']([^"']+)["']/i,
        /imageUrl\s*:\s*["']([^"']+)["']/i,
        /"image"\s*:\s*"([^"]+)"/i,
      ],
      description: [
        /description\s*:\s*["']([^"']+)["']/i,
        /productDescription\s*:\s*["']([^"']+)["']/i,
        /shortDescription\s*:\s*["']([^"']+)["']/i,
      ],
      specs: [
        /productAttributes\s*:\s*(\{[\s\S]*?\})/i,
        /attributes\s*:\s*(\{[\s\S]*?\})/i,
        /specifications\s*:\s*(\{[\s\S]*?\})/i,
      ],
    };

    for (const [field, regexes] of Object.entries(patterns)) {
      for (const regex of regexes) {
        const match = html.match(regex);
        if (match && match[1]) {
          let val = match[1];
          if (field === "price") {
            data[field] = parseTurkishPrice(val);
          } else if (field === "images") {
            data[field] = [cleanImageUrl(val)].filter(u => u);
          } else if (field === "specs") {
            try {
              const parsed = JSON.parse(val);
              if (parsed && typeof parsed === "object") data.specs = parsed;
            } catch (e) {}
          } else {
            data[field] = val.trim();
          }
          break;
        }
      }
    }

    try {
      const dataLayerMatch = html.match(/dataLayer\s*=\s*(\[[\s\S]*?\])/);
      if (dataLayerMatch) {
        const dataLayer = JSON.parse(dataLayerMatch[1]);
        for (const item of dataLayer) {
          if (item.ecommerce?.detail?.products?.[0]) {
            const p = item.ecommerce.detail.products[0];
            if (p.name && !data.title) data.title = p.name;
            if (p.brand && !data.brand) data.brand = p.brand;
            if (p.price && !data.price) data.price = parseTurkishPrice(p.price);
            if (p.variant && !data.model) data.model = p.variant;
            if (p.category && !data.category) data.category = p.category;
          }
        }
      }
    } catch (e) {}

    return data;
  }

  extractMicrodata() {
    const data = {};
    const productItems = this.doc.querySelectorAll('[itemscope][itemtype*="Product"]');
    
    for (const item of productItems) {
      const props = item.querySelectorAll('[itemprop]');
      for (const prop of props) {
        const propName = prop.getAttribute("itemprop");
        const value = prop.getAttribute("content") || prop.getAttribute("datetime") || prop.textContent.trim();
        
        if (!value) continue;
        
        switch (propName) {
          case "name": if (!data.title) data.title = value; break;
          case "brand": if (!data.brand) data.brand = value; break;
          case "price": if (!data.price) data.price = parseTurkishPrice(value); break;
          case "image": if (!data.images) data.images = [cleanImageUrl(value)].filter(u => u); break;
          case "description": if (!data.description) data.description = value; break;
          case "sku": case "mpn": if (!data.model) data.model = value; break;
          case "availability": data.in_stock = !value.includes("OutOfStock"); break;
        }
      }
    }
    return data;
  }

  extractHeuristicDom() {
    const data = {};

    const titleSelectors = [
      "h1.product-title", "h1.product-name", "h1[itemprop='name']",
      ".product-title h1", ".product-name h1", ".product-detail h1",
      ".urun-adi h1", ".product-header h1", "h1.page-title",
      "h1", ".product-title", ".product-name", ".urun-adi"
    ];
    for (const sel of titleSelectors) {
      const el = this.doc.querySelector(sel);
      if (el && el.textContent.trim().length > 3) {
        data.title = el.textContent.trim();
        break;
      }
    }

    const priceSelectors = [
      '[itemprop="price"]', '.product-price .price', '.price-current',
      '.sale-price', '.current-price', '.product-price', '#price',
      '.price', '.urun-fiyat', '.fiyat', '[class*="price"]', '[id*="price"]',
      '[class*="fiyat"]', '[id*="fiyat"]'
    ];
    for (const sel of priceSelectors) {
      const el = this.doc.querySelector(sel);
      if (el) {
        const text = el.textContent || el.getAttribute("content") || "";
        const price = parseTurkishPrice(text);
        if (price && price > 0) {
          data.price = price;
          break;
        }
      }
    }

    if (!data.price) {
      const textNodes = this.getAllTextNodes(this.doc.body);
      for (const text of textNodes) {
        const price = parseTurkishPrice(text);
        if (price && price > 100 && price < 1000000) {
          data.price = price;
          break;
        }
      }
    }

    const brandSelectors = [
      '[itemprop="brand"]', '.product-brand', '.brand-name', '.brand a',
      'a[href*="/marka/"]', 'a[href*="/brand/"]', '.manufacturer',
      '.product-manufacturer', '[class*="brand"]'
    ];
    for (const sel of brandSelectors) {
      const el = this.doc.querySelector(sel);
      if (el && el.textContent.trim().length > 1 && el.textContent.trim().length < 50) {
        data.brand = el.textContent.trim();
        break;
      }
    }

    if (!data.brand && data.title) {
      const knownBrands = [
        "Hunthink", "Dağlıoğlu", "Daglioglu", "Hunt Group", "Serengeti", "Retay Arms", "Retay",
        "Castello", "Arslan", "Husan", "Derya", "Armsan", "Ata Arms", "Ata", "Mavoric",
        "Stoeger", "Beretta", "Benelli", "Browning", "Winchester", "Hatsan",
        "Kral Arms", "Kral", "Huğlu", "Huglu", "Akdaş", "Akdas",
        "Yıldız", "Yildiz", "Sarsılmaz", "Sarsilmaz", "Canik", "Girsan",
        "Tisaş", "Tisas", "Steiner", "Zeiss", "Swarovski", "Optisan", "Hawke", "Vortex"
      ];
      for (const b of knownBrands) {
        if (new RegExp(`\\b${b}\\b`, "i").test(data.title)) {
          data.brand = b;
          break;
        }
      }
    }

    const imageSelectors = [
      '[itemprop="image"]', '.product-image img', '.product-gallery img',
      '.gallery img', '.main-image img', '#main-image', '#product-image',
      '.zoom-image', '[data-zoom-image]', '.product-img img',
      '.slider img', '.carousel img', '.swiper-slide img'
    ];
    const images = [];
    for (const sel of imageSelectors) {
      const els = this.doc.querySelectorAll(sel);
      for (const el of els) {
        const src = el.getAttribute("src") || el.getAttribute("data-src") || 
                    el.getAttribute("data-zoom-image") || el.getAttribute("data-large") ||
                    (el.tagName === "A" ? el.href : "");
        if (src) {
          const cleaned = cleanImageUrl(src);
          if (cleaned && this.isValidProductImage(cleaned)) {
            images.push(cleaned);
          }
        }
      }
      if (images.length > 0) break;
    }
    if (images.length > 0) data.images = [...new Set(images)].slice(0, 10);

    const descSelectors = [
      '[itemprop="description"]', '.product-description', '.product-detail .description',
      '.product-info .description', '#description', '.description',
      '.product-content', '.urun-aciklama', '.product-tabs .tab-content'
    ];
    for (const sel of descSelectors) {
      const el = this.doc.querySelector(sel);
      if (el && el.textContent.trim().length > 20) {
        data.description = el.textContent.trim().slice(0, 5000);
        break;
      }
    }

    const specData = this.extractSpecsFromTables();
    if (Object.keys(specData).length > 0) data.specs = specData;

    return data;
  }

  isValidProductImage(url) {
    const exclude = ["logo", "icon", "banner", "favicon", "sprite", "placeholder", "loading", "blank", "default"];
    const lower = url.toLowerCase();
    if (exclude.some(x => lower.includes(x))) return false;
    if (!/\.(jpe?g|png|webp|avif)(\?|$)/i.test(url)) return false;
    return true;
  }

  getAllTextNodes(root) {
    const texts = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (text.length > 5 && text.length < 200 && /\d/.test(text)) {
        texts.push(text);
      }
    }
    return texts;
  }

  extractSpecsFromTables() {
    const specs = {};
    const tableSelectors = [
      "table.product-specs", "table.specifications", "table.tech-specs",
      ".spec-table table", ".product-attributes table", ".product-specs table",
      ".specification-table", "#specs table", ".divAciklamaIcerik table",
      "table", "dl.specs", ".specs-list"
    ];

    for (const sel of tableSelectors) {
      const tables = this.doc.querySelectorAll(sel);
      for (const table of tables) {
        const rows = table.querySelectorAll("tr");
        for (const row of rows) {
          const cells = row.querySelectorAll("th, td");
          if (cells.length >= 2) {
            const key = cells[0].textContent.replace(/[:：]/g, "").trim();
            const val = cells[1].textContent.trim();
            if (key && val && key.length < 60 && val.length < 300) {
              specs[key] = val;
            }
          }
        }

        const dts = table.querySelectorAll("dt");
        for (const dt of dts) {
          const dd = dt.nextElementSibling;
          if (dd && dd.tagName.toLowerCase() === "dd") {
            const key = dt.textContent.replace(/[:：]/g, "").trim();
            const val = dd.textContent.trim();
            if (key && val) specs[key] = val;
          }
        }
      }
    }

    const listSelectors = [
      ".product-list-row", ".product-feature-row", ".feature-row", ".spec-row",
      ".product-specs li", ".specifications li", ".attributes li"
    ];
    for (const sel of listSelectors) {
      const items = this.doc.querySelectorAll(sel);
      for (const item of items) {
        const keyEl = item.querySelector(".title, .name, .label, dt, strong, th, .product-list-title");
        const valEl = item.querySelector(".value, .content, .desc, dd, td, .product-list-content");
        if (keyEl && valEl) {
          const key = keyEl.textContent.replace(/[:：]/g, "").trim();
          const val = valEl.textContent.trim();
          if (key && val && key.length < 60 && val.length < 300) {
            specs[key] = val;
          }
        }
      }
    }

    return specs;
  }

  extractFallbackGeneric() {
    const data = {};
    
    if (!data.title) {
      data.title = (this.doc.title || "").split(/[-|–]/)[0].trim();
    }

    if (!data.price) {
      const allText = this.doc.body.innerText;
      const priceMatches = allText.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:TL|₺|TRY)/gi);
      if (priceMatches) {
        const prices = priceMatches.map(p => parseTurkishPrice(p)).filter(p => p && p > 50 && p < 500000);
        if (prices.length > 0) {
          data.price = Math.min(...prices);
        }
      }
    }

    if (!data.images) {
      const allImages = this.doc.querySelectorAll("img");
      const images = [];
      for (const img of allImages) {
        if (img.naturalWidth > 200 || img.width > 200) {
          const src = img.src || img.getAttribute("data-src") || img.getAttribute("data-lazy");
          if (src) {
            const cleaned = cleanImageUrl(src);
            if (cleaned && this.isValidProductImage(cleaned)) {
              images.push(cleaned);
            }
          }
        }
      }
      if (images.length > 0) data.images = [...new Set(images)].slice(0, 10);
    }

    return data;
  }

  finalize() {
    if (!this.result.brand && this.result.title) {
      const knownBrands = [
        "Hunthink", "Dağlıoğlu", "Daglioglu", "Hunt Group", "Serengeti", "Retay Arms", "Retay",
        "Castello", "Arslan", "Husan", "Derya", "Armsan", "Ata Arms", "Ata", "Mavoric",
        "Stoeger", "Beretta", "Benelli", "Browning", "Winchester", "Hatsan",
        "Kral Arms", "Kral", "Huğlu", "Huglu", "Akdaş", "Akdas",
        "Yıldız", "Yildiz", "Sarsılmaz", "Sarsilmaz", "Canik", "Girsan",
        "Tisaş", "Tisas", "Steiner", "Zeiss", "Swarovski", "Optisan", "Hawke", "Vortex"
      ];
      for (const b of knownBrands) {
        if (new RegExp(`\\b${b}\\b`, "i").test(this.result.title)) {
          this.result.brand = b;
          break;
        }
      }
    }

    if (!this.result.model && this.result.title && this.result.brand) {
      const titleWithoutBrand = this.result.title.replace(new RegExp(`\\b${this.result.brand}\\b`, "i"), "").trim();
      const modelMatch = titleWithoutBrand.match(/\b([A-Z]{1,4}[-\s]?\d{2,4}[A-Z]?|MOD[-\s]?\d+|[A-Z]{2,}-\d+)\b/i);
      if (modelMatch) this.result.model = modelMatch[1].trim();
    }

    const specKeys = Object.keys(this.result.specs);
    for (const key of specKeys) {
      const lower = key.toLowerCase();
      if (lower.includes("marka") && !this.result.brand) this.result.brand = this.result.specs[key];
      if ((lower.includes("model") || lower.includes("sku") || lower.includes("ürün kodu")) && !this.result.model) {
        this.result.model = this.result.specs[key];
      }
    }

    const urlLow = this.url.toLowerCase();
    const titleLow = (this.result.title || "").toLowerCase();
    const brandLow = (this.result.brand || "").toLowerCase();
    
    if (urlLow.includes("arslansilah") || brandLow.includes("castello")) this.result.supplier_id = 1;
    else if (urlLow.includes("ozlerav")) this.result.supplier_id = 2;

    this.result.url = this.url;
    this.result._extractionLog = this.extractionLog;
    this.result._extractionMethod = this.extractionLog.find(l => l.success)?.step || "unknown";

    return this.result;
  }
}

async function extractProductUniversal(doc, url, customRules = {}) {
  const extractor = new UniversalProductExtractor(doc, url, customRules);
  return await extractor.extract();
}

class AiSelectorCompiler {
  static compile(aiResult, doc, url) {
    const selectors = {};
    const domain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    const extracted = aiResult.extracted_preview || {};
    const html = doc.documentElement.innerHTML;

    if (extracted.title) {
      selectors.title = this.findSelectorForText(doc, extracted.title, "title");
    }
    if (extracted.price !== null && extracted.price !== undefined) {
      selectors.price = this.findSelectorForPrice(doc, extracted.price);
    }
    if (extracted.brand) {
      selectors.brand = this.findSelectorForText(doc, extracted.brand, "brand");
    }
    if (extracted.model) {
      selectors.model = this.findSelectorForText(doc, extracted.model, "model");
    }
    if (extracted.description) {
      selectors.description = this.findSelectorForText(doc, extracted.description.slice(0, 200), "description");
    }
    if (Array.isArray(extracted.images) && extracted.images.length > 0) {
      selectors.images = this.findImageSelector(doc, extracted.images[0]);
      selectors.image_attr = "src";
    }
    if (extracted.specs && Object.keys(extracted.specs).length > 0) {
      const specSelectors = this.findSpecSelectors(doc, extracted.specs);
      if (specSelectors.table) selectors.specs_table = specSelectors.table;
      if (specSelectors.row) selectors.specs_row = specSelectors.row;
      if (specSelectors.key) selectors.specs_key = specSelectors.key;
      if (specSelectors.val) selectors.specs_val = specSelectors.val;
    }

    return {
      domain,
      updatedAt: new Date().toISOString(),
      selectors,
      extractionConfidence: this.calculateConfidence(selectors, extracted),
      source: "ai_analysis",
      sampleExtracted: extracted,
    };
  }

  static findSelectorForText(doc, targetText, fieldType) {
    const cleanTarget = targetText.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!cleanTarget || cleanTarget.length < 3) return "";

    const candidates = [];
    
    const allElements = doc.querySelectorAll("*");
    for (const el of allElements) {
      const text = el.textContent?.trim() || "";
      if (text === targetText.trim() || (text.includes(targetText.trim()) && text.length < targetText.length * 2)) {
        const selector = this.generateSelector(el);
        if (selector) candidates.push({ selector, score: this.scoreSelector(el, fieldType) });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].selector;
    }

    const metaSelectors = {
      title: ['h1', '[itemprop="name"]', 'meta[property="og:title"]', '.product-title', '.product-name', '.urun-adi'],
      brand: ['[itemprop="brand"]', '.product-brand', '.brand-name', 'a[href*="/marka/"]', '[class*="brand"]'],
      model: ['[itemprop="sku"]', '[itemprop="mpn"]', '.product-code', '.sku', '[class*="model"]', '[class*="sku"]'],
      description: ['[itemprop="description"]', '.product-description', '.description', '#description', '.product-detail'],
    };

    const fallbacks = metaSelectors[fieldType] || [];
    for (const sel of fallbacks) {
      const el = doc.querySelector(sel);
      if (el && el.textContent?.includes(targetText.trim().slice(0, 30))) return sel;
    }

    return "";
  }

  static findSelectorForPrice(doc, targetPrice) {
    const priceStr = targetPrice.toString();
    const candidates = [];
    
    const allElements = doc.querySelectorAll("*");
    for (const el of allElements) {
      const text = el.textContent?.trim() || "";
      const parsed = parseTurkishPrice(text);
      if (parsed === targetPrice) {
        const selector = this.generateSelector(el);
        if (selector) candidates.push({ selector, score: this.scoreSelector(el, "price") });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].selector;
    }

    const priceSelectors = ['[itemprop="price"]', '.product-price', '.price', '.fiyat', '#price', '[class*="price"]', '[id*="price"]', '[class*="fiyat"]'];
    for (const sel of priceSelectors) {
      const el = doc.querySelector(sel);
      if (el) {
        const parsed = parseTurkishPrice(el.textContent || el.getAttribute("content") || "");
        if (parsed === targetPrice) return sel;
      }
    }

    return "";
  }

  static findImageSelector(doc, targetImageUrl) {
    const cleanTarget = cleanImageUrl(targetImageUrl);
    const allImages = doc.querySelectorAll("img, a[href]");
    
    for (const el of allImages) {
      const src = el.src || el.getAttribute("href") || el.getAttribute("data-src") || 
                  el.getAttribute("data-zoom-image") || el.getAttribute("data-large") || "";
      if (cleanImageUrl(src) === cleanTarget) {
        return this.generateSelector(el);
      }
    }
    return "";
  }

  static findSpecSelectors(doc, specs) {
    const specKeys = Object.keys(specs);
    if (specKeys.length === 0) return {};

    const tables = doc.querySelectorAll("table, .spec-table, .specifications, .product-specs, dl, .specs-list");
    let bestTable = null;
    let bestScore = 0;

    for (const table of tables) {
      let score = 0;
      const tableText = table.textContent.toLowerCase();
      for (const key of specKeys) {
        if (tableText.includes(key.toLowerCase())) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestTable = table;
      }
    }

    if (bestTable && bestScore >= Math.min(2, specKeys.length)) {
      const tableSelector = this.generateSelector(bestTable);
      const rowSelector = `${tableSelector} tr, ${tableSelector} li, ${tableSelector} .spec-row, ${tableSelector} .product-list-row`;
      return {
        table: tableSelector,
        row: rowSelector,
        key: "th, td:first-child, dt, .title, .name, .label, strong",
        val: "td:last-child, dd, .value, .content, .desc, span",
      };
    }

    return {};
  }

  static generateSelector(el) {
    if (!el || el === document.body) return "";
    
    if (el.id) return `#${el.id}`;
    
    const path = [];
    let current = el;
    while (current && current !== document.body && path.length < 4) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/).filter(c => c && !/^\d+$/.test(c) && c.length > 1);
        if (classes.length > 0) {
          selector += "." + classes.slice(0, 2).join(".");
        }
      }
      
      if (current === el && current.parentElement) {
        const siblings = Array.from(current.parentElement.children).filter(c => c.tagName === current.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(" > ");
  }

  static scoreSelector(el, fieldType) {
    let score = 0;
    const tag = el.tagName.toLowerCase();
    const className = el.className || "";
    const id = el.id || "";
    
    if (id) score += 100;
    
    const fieldClasses = {
      title: ["title", "name", "heading", "h1", "product-title", "urun-adi", "urunadi"],
      price: ["price", "fiyat", "cost", "amount", "sale-price", "current-price"],
      brand: ["brand", "marka", "manufacturer", "producer"],
      model: ["model", "sku", "mpn", "code", "product-code", "urun-kodu"],
      description: ["description", "desc", "aciklama", "detail", "content", "about"],
    };
    
    const relevantClasses = fieldClasses[fieldType] || [];
    for (const rc of relevantClasses) {
      if (className.toLowerCase().includes(rc) || id.toLowerCase().includes(rc)) score += 50;
    }
    
    if (tag === "h1" && fieldType === "title") score += 30;
    if (tag === "meta" && fieldType === "title") score += 40;
    if (el.hasAttribute("itemprop")) score += 40;
    if (el.hasAttribute("property") && el.getAttribute("property")?.includes("og:")) score += 30;
    
    const depth = this.getDepth(el);
    score -= depth * 2;
    
    return score;
  }

  static getDepth(el) {
    let depth = 0;
    while (el && el !== document.body) {
      depth++;
      el = el.parentElement;
    }
    return depth;
  }

  static calculateConfidence(selectors, extracted) {
    const fields = ["title", "price", "brand", "model", "description", "images"];
    let found = 0;
    for (const f of fields) {
      if (selectors[f] || (f === "images" && selectors.images)) found++;
    }
    return Math.round((found / fields.length) * 100);
  }
}

async function saveLearnedSelectors(domain, compiledRules) {
  return new Promise((resolve) => {
    chrome.storage.local.get(["customSiteRules"], (result) => {
      const rules = result.customSiteRules || {};
      rules[domain] = compiledRules;
      chrome.storage.local.set({ customSiteRules: rules }, () => {
        cachedCustomSiteRules = rules;
        resolve(true);
      });
    });
  });
}

async function triggerAiAnalysisAndLearn(tabId, pageInfo, engine, customPrompt) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: "REQUEST_AI_ANALYSIS",
      pageInfo,
      engine,
      customPrompt,
    }, (response) => {
      if (response?.success) {
        resolve(response.data);
      } else {
        reject(new Error(response?.error || "AI analysis failed"));
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "COMPILE_AND_SAVE_AI_RULES") {
    (async () => {
      try {
        const { aiResult, pageInfo } = request;
        const doc = document;
        const compiled = AiSelectorCompiler.compile(aiResult, doc, pageInfo.url);
        
        if (compiled.extractionConfidence >= 50) {
          await saveLearnedSelectors(compiled.domain, compiled);
          sendResponse({ success: true, compiled, message: `Kurallar kaydedildi (Güven: %${compiled.extractionConfidence})` });
        } else {
          sendResponse({ success: false, compiled, message: `Güven skoru düşük (%${compiled.extractionConfidence}), manuel doğrulama gerekli` });
        }
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (request.action === "GET_EXTRACTION_LOG") {
    sendResponse({ success: true, log: window.lastExtractionLog || [] });
    return true;
  }

  return true;
});

