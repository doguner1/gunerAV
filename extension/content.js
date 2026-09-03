// Güner AV - Tedarikçi Sayfası İçerik Yakalayıcı (Content Script)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXTRACT_PRODUCT") {
    try {
      const data = extractProductData();
      sendResponse({ success: true, data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // async response support
});

function extractProductData() {
  const result = {
    title: "",
    brand: "",
    model: "",
    price: null,
    images: [],
    specs: {},
    description: "",
  };

  // 1. Ürün Başlığı (Title)
  const h1 = document.querySelector("h1");
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (h1 && h1.textContent.trim()) {
    result.title = h1.textContent.trim();
  } else if (ogTitle && ogTitle.content) {
    result.title = ogTitle.content.trim();
  } else {
    result.title = document.title.split(/[-|]/)[0].trim();
  }

  // 2. Fiyat Tespiti (Varsa)
  const priceEl =
    document.querySelector(".price, .product-price, [itemprop='price'], .current-price") ||
    Array.from(document.querySelectorAll("span, div")).find((el) =>
      /(\d+[\.,]\d{2}|\d+)\s*(TL|₺|USD|EUR)/i.test(el.textContent) && el.children.length === 0
    );

  if (priceEl) {
    const rawPrice = priceEl.textContent.replace(/[^\d,\.]/g, "").replace(",", ".");
    const num = parseFloat(rawPrice);
    if (!isNaN(num)) result.price = num;
  }

  // 3. Görsel URL'leri (Image Gallery)
  const imageSet = new Set();

  // og:image
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content && !ogImage.content.includes("logo")) {
    imageSet.add(ogImage.content);
  }

  // Galeri resimleri
  const galleryImgs = document.querySelectorAll(
    ".product-image img, .gallery img, .product-gallery img, .swiper-slide img, .carousel-item img, [data-zoom-image]"
  );

  galleryImgs.forEach((img) => {
    const src =
      img.getAttribute("data-zoom-image") ||
      img.getAttribute("data-large") ||
      img.getAttribute("data-src") ||
      img.src;

    if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("banner")) {
      imageSet.add(src);
    }
  });

  // Genel büyük resimler fallback
  if (imageSet.size === 0) {
    document.querySelectorAll("img").forEach((img) => {
      if (img.naturalWidth > 300 || img.width > 300) {
        if (!img.src.includes("logo") && !img.src.includes("icon")) {
          imageSet.add(img.src);
        }
      }
    });
  }

  result.images = Array.from(imageSet).slice(0, 6);

  // 4. Teknik Özellikler Tablosu (Specs Table)
  const tables = document.querySelectorAll("table, .tech-specs, .specifications, dl");
  const specs = {};

  tables.forEach((table) => {
    const rows = table.querySelectorAll("tr");
    rows.forEach((row) => {
      const cells = row.querySelectorAll("th, td");
      if (cells.length >= 2) {
        const key = cells[0].textContent.replace(/[:]/g, "").trim();
        const value = cells[1].textContent.trim();
        if (key && value && key.length < 50 && value.length < 200) {
          specs[key] = value;
        }
      }
    });

    // dl / dt / dd listeleri
    const dts = table.querySelectorAll("dt");
    dts.forEach((dt) => {
      const dd = dt.nextElementSibling;
      if (dd && dd.tagName.toLowerCase() === "dd") {
        const key = dt.textContent.replace(/[:]/g, "").trim();
        const value = dd.textContent.trim();
        if (key && value) specs[key] = value;
      }
    });
  });

  result.specs = specs;

  // Marka ve Model çıkarımı
  if (specs["Marka"] || specs["Brand"]) {
    result.brand = specs["Marka"] || specs["Brand"];
  }
  if (specs["Model"]) {
    result.model = specs["Model"];
  }

  // 5. Ürün Açıklaması
  const descEl = document.querySelector(
    ".product-description, #tab-description, [itemprop='description'], .product-detail"
  );
  if (descEl) {
    result.description = descEl.textContent.trim().slice(0, 500);
  }

  return result;
}
