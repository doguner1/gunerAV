// Güner AV - Chrome Eklentisi Popup Mantığı

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Tab Değiştirme
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("batch") === "1") {
    setTimeout(() => {
      const batchTabBtn = document.querySelector('[data-tab="tabBatch"]');
      if (batchTabBtn) batchTabBtn.click();
      runBatchScrape();
    }, 500);
  }

  const tabs = document.querySelectorAll(".tab");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.dataset.tab;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");

      const sharedForm = document.getElementById("sharedProductForm");
      if (sharedForm) {
        if (targetId === "tabBatch" || targetId === "tabSettings") {
          sharedForm.style.display = "none";
        } else {
          sharedForm.style.display = "block";
        }
      }
    });
  });

  document.getElementById("btnSettingsToggle")?.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tabPanes.forEach((p) => p.classList.remove("active"));
    const settingsTab = document.querySelector('[data-tab="tabSettings"]');
    settingsTab?.classList.add("active");
    document.getElementById("tabSettings")?.classList.add("active");

    const sharedForm = document.getElementById("sharedProductForm");
    if (sharedForm) sharedForm.style.display = "none";
  });

  // 2. Supabase Ayarlarını Yükle
  const cfg = await chrome.storage.local.get(["supabaseUrl", "supabaseKey"]);
  if (cfg.supabaseUrl) document.getElementById("cfgSupabaseUrl").value = cfg.supabaseUrl;
  if (cfg.supabaseKey) document.getElementById("cfgSupabaseKey").value = cfg.supabaseKey;

  document.getElementById("btnSaveConfig")?.addEventListener("click", async () => {
    const url = document.getElementById("cfgSupabaseUrl").value.trim().replace(/\/+$/, "");
    const key = document.getElementById("cfgSupabaseKey").value.trim();

    await chrome.storage.local.set({ supabaseUrl: url, supabaseKey: key });
    showStatus("✅ Supabase ayarları başarıyla kaydedildi!", "success");
  });

  // 2b. Supabase Bağlantısını Test Et
  document.getElementById("btnTestConfig")?.addEventListener("click", async () => {
    const statusEl = document.getElementById("testConnectionStatus");
    const url = document.getElementById("cfgSupabaseUrl").value.trim().replace(/\/+$/, "");
    const key = document.getElementById("cfgSupabaseKey").value.trim();

    if (!url || !key) {
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.style.background = "rgba(239, 68, 68, 0.15)";
        statusEl.style.color = "#f87171";
        statusEl.style.border = "1px solid #ef4444";
        statusEl.textContent = "❌ Lütfen önce URL ve Key alanlarını doldurun.";
      }
      return;
    }

    if (statusEl) {
      statusEl.style.display = "block";
      statusEl.style.background = "rgba(56, 189, 248, 0.15)";
      statusEl.style.color = "#38bdf8";
      statusEl.style.border = "1px solid #0284c7";
      statusEl.textContent = "⏳ Supabase bağlantısı test ediliyor...";
    }

    try {
      const res = await fetch(`${url}/rest/v1/products?select=id,name_tr`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }

      const products = await res.json();
      const count = Array.isArray(products) ? products.length : 0;

      if (statusEl) {
        statusEl.style.background = "rgba(34, 197, 94, 0.15)";
        statusEl.style.color = "#4ade80";
        statusEl.style.border = "1px solid #22c55e";
        statusEl.textContent = `✅ Bağlantı Başarılı! Veritabanında şu an ${count} adet ürün bulunuyor.`;
      }
    } catch (err) {
      if (statusEl) {
        statusEl.style.background = "rgba(239, 68, 68, 0.15)";
        statusEl.style.color = "#f87171";
        statusEl.style.border = "1px solid #ef4444";
        statusEl.textContent = `❌ Bağlantı başarısız: ${err.message}`;
      }
    }
  });

  // 2c. Aksesuarları tufek-aksesuar kategorisine aktarma
  document.getElementById("btnMigrateAccessories")?.addEventListener("click", () => {
    migrateAccessoriesToTufekAksesuar(true);
  });
  // Açılışta sessizce mevcut aksesuarları normalize et
  setTimeout(() => {
    migrateAccessoriesToTufekAksesuar(false);
  }, 1000);

  // 3. İndirim Alanı Göster/Gizle
  const chkHasDiscount = document.getElementById("chkHasDiscount");
  const discountPercentRow = document.getElementById("discountPercentRow");
  chkHasDiscount?.addEventListener("change", () => {
    discountPercentRow.style.display = chkHasDiscount.checked ? "block" : "none";
    saveFormDraft();
  });

  // 4. Görseller Değişince Önizleme
  const fldImages = document.getElementById("fldImages");
  fldImages?.addEventListener("input", () => {
    updateImagesPreview();
    saveFormDraft();
  });

  // 4b. Tedarikçi Açıklamasını Kullan Seçimi (Varsayılan: Kapalı)
  document.getElementById("chkUseScrapedDescription")?.addEventListener("change", (e) => {
    const descEl = document.getElementById("fldDescription");
    if (!descEl) return;
    if (e.target.checked) {
      if (lastScrapedDescription) {
        descEl.value = lastScrapedDescription;
      }
    } else {
      descEl.value = generateStandardDescription();
    }
    saveFormDraft();
  });

  // 5. Form Alanlarındaki Değişiklikleri Dinle ve Otomatik Taslak Olarak Kaydet (Persistence)
  const formInputs = [
    "fldNameTr",
    "fldCategory",
    "fldPrice",
    "fldBrand",
    "fldModel",
    "fldDiscountPercent",
    "chkFeatured",
    "chkHeroSpotlight",
    "chkRequiresLicense",
    "chkInStock",
    "chkUseScrapedDescription",
    "fldDescription",
    "fldSpecsJson",
  ];

  formInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", saveFormDraft);
    el.addEventListener("change", saveFormDraft);
  });

  // Kategori değiştiğinde tüfek ise ruhsat zorunluluğunu otomatik aç, aksesuar / mühimmat veya diğerlerinde kapat
  document.getElementById("fldCategory")?.addEventListener("change", (e) => {
    const val = e.target.value;
    const isFirearm = (val.startsWith("tufek-") && val !== "tufek-aksesuar") || val === "tufek" || val === "silah-muhimmat";
    const isAmmo = val === "muhimmat" || val.startsWith("muhimmat-");
    const isAccessory = val.startsWith("aksesuar") || val === "bicak" || val.startsWith("bicak-") || val.startsWith("kamp");
    const licenseChk = document.getElementById("chkRequiresLicense");
    if (licenseChk) {
      if (isFirearm) {
        licenseChk.checked = true;
      } else if (isAmmo || isAccessory) {
        licenseChk.checked = false; // Aksesuar ve fişeklerde ruhsat istenmez
      }
      saveFormDraft();
    }
  });

  // 6. Önceki Taslağı Geri Yükle (Popup tekrar açıldığında veri kaybolmasın)
  const { productFormDraft } = await chrome.storage.local.get(["productFormDraft"]);
  if (productFormDraft && (productFormDraft.nameTr || productFormDraft.images || productFormDraft.brand)) {
    restoreFormDraft(productFormDraft);
  }

  // 7. Formu Temizle Butonu
  document.getElementById("btnResetForm")?.addEventListener("click", async () => {
    await resetForm();
    showStatus("Form temizlendi.", "success");
    setTimeout(() => {
      const b = document.getElementById("statusBanner");
      if (b) b.style.display = "none";
    }, 1500);
  });

  // 8. Sayfadan Otomatik Çek (Scraper)
  document.getElementById("btnScrapePage")?.addEventListener("click", async () => {
    // İSTEK: "tekrar tedarikçi sayfasını tara butona basınca önce silsin sonra çekebildiği veriyi çeksin"
    await resetForm();

    showStatus("🔍 Sayfa taranıyor...", "success");

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showStatus("Aktif sekme bulunamadı.", "error");
      return;
    }

    const applyExtractedData = (data) => {
      populateForm(data);
      saveFormDraft();
      showStatus(`✅ Ürün yakalandı: ${(data.title || "").slice(0, 35)}...`, "success");
    };

    try {
      chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_PRODUCT" }, async (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          // Sayfa eklenti yüklenmeden önce açılmışsa content script dinamik enjekte edilir
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"],
            });
            chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_PRODUCT" }, (retryRes) => {
              if (chrome.runtime.lastError || !retryRes?.success) {
                showStatus(
                  "Sayfa içeriği okunamadı. Lütfen sayfayı bir kez yenileyip (F5) tekrar butona basınız.",
                  "error"
                );
                return;
              }
              applyExtractedData(retryRes.data);
            });
          } catch (injErr) {
            showStatus(
              "Sayfa içeriği okunamadı. Lütfen sayfayı bir kez yenileyip (F5) tekrar deneyin.",
              "error"
            );
          }
          return;
        }

        applyExtractedData(response.data);
      });
    } catch (e) {
      showStatus("Hata: " + e.message, "error");
    }
  });

  // 9. Manuel JSON'u Parse Et
  document.getElementById("btnParseJson")?.addEventListener("click", () => {
    const raw = document.getElementById("rawJsonInput").value.trim();
    if (!raw) {
      showStatus("Lütfen geçerli bir JSON yapıştırın.", "error");
      return;
    }

    try {
      const data = JSON.parse(raw);
      populateForm(data);
      saveFormDraft();
      showStatus("✅ JSON başarıyla forma aktarıldı!", "success");
    } catch (e) {
      showStatus("Geçersiz JSON formatı: " + e.message, "error");
    }
  });

  // 10. Supabase'e Gönder & Yayınla
  document.getElementById("btnSubmitToSupabase")?.addEventListener("click", async () => {
    const btn = document.getElementById("btnSubmitToSupabase");
    const nameTr = document.getElementById("fldNameTr").value.trim();

    if (!nameTr) {
      showStatus("Lütfen ürün adını girin.", "error");
      return;
    }

    const savedCfg = await chrome.storage.local.get(["supabaseUrl", "supabaseKey"]);
    if (!savedCfg.supabaseUrl || !savedCfg.supabaseKey) {
      showStatus("Lütfen önce Ayarlar sekmesinden Supabase URL ve Key girin.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "⏳ Supabase'e Aktarılıyor...";

    try {
      const category = document.getElementById("fldCategory").value;
      const brand = document.getElementById("fldBrand").value.trim();
      const model = document.getElementById("fldModel").value.trim();
      const priceVal = document.getElementById("fldPrice").value;
      const price = priceVal ? parseTurkishPrice(priceVal) : null;

      const rawImages = document.getElementById("fldImages").value;
      const images = rawImages
        .split(/[\n,]/)
        .map(normalizeUrl)
        .filter((u) => u.startsWith("http"));

      const isFeatured = document.getElementById("chkFeatured").checked;
      const isHeroSpotlight = document.getElementById("chkHeroSpotlight").checked;
      const hasDiscount = document.getElementById("chkHasDiscount").checked;
      const discountVal = document.getElementById("fldDiscountPercent").value;
      const discountPercent = hasDiscount && discountVal ? parseInt(discountVal, 10) : null;
      const requiresLicense = document.getElementById("chkRequiresLicense").checked;
      const inStock = document.getElementById("chkInStock").checked;

      // Specs parse
      let specs = {};
      try {
        const specsText = document.getElementById("fldSpecsJson").value.trim();
        if (specsText) specs = JSON.parse(specsText);
      } catch (e) {
        specs = {};
      }

      // Variants parse
      let variants = [];
      try {
        const variantsText = document.getElementById("fldVariantsJson")?.value?.trim();
        if (variantsText) variants = JSON.parse(variantsText);
      } catch (e) {
        variants = [];
      }

      // Fallback: varyantları hem ana kolona hem de specs_tr içine koyuyoruz (garanti)
      if (Array.isArray(variants) && variants.length > 0) {
        specs.variants = variants;
      }

      let finalDescription = document.getElementById("fldDescription")?.value?.trim();
      const chkUseScraped = document.getElementById("chkUseScrapedDescription");
      if ((!chkUseScraped || !chkUseScraped.checked) && (!finalDescription || (lastScrapedDescription && finalDescription === lastScrapedDescription))) {
        finalDescription = generateStandardDescription(null, specs);
        if (document.getElementById("fldDescription")) {
          document.getElementById("fldDescription").value = finalDescription;
        }
      }
      if (!finalDescription) {
        finalDescription = generateStandardDescription(null, specs);
      }

      const slug = slugify(nameTr) || `product-${Date.now()}`;

      const payload = {
        id: slug,
        slug_tr: slug,
        slug_en: slug + "-en",
        category,
        brand,
        model,
        name_tr: nameTr,
        description_tr: finalDescription,
        description_en: finalDescription,
        price: requiresLicense ? null : price,
        discount_percent: discountPercent,
        images: images.length > 0 ? images : ["/images/products/optics-1.webp"],
        variants: variants.length > 0 ? variants : [],
        featured: isFeatured,
        is_hero_spotlight: isHeroSpotlight,
        requires_license: requiresLicense,
        in_stock: inStock,
        specs_tr: specs,
        specs_en: specs,
      };

      const endpoint = `${savedCfg.supabaseUrl}/rest/v1/products`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: savedCfg.supabaseKey,
          Authorization: `Bearer ${savedCfg.supabaseKey}`,
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        // RLS Hatası tespiti (42501)
        if (errText.includes("42501") || errText.includes("row-level security")) {
          throw new Error(
            `Supabase Yetki Kısıtlaması (RLS 42501):\nKullandığınız anahtar ('anon key') veritabanına yazma yetkisine sahip değil.\n\nÇÖZÜM: Eklenti Ayarlar sekmesine Supabase panelinizdeki (Project Settings -> API) 'service_role (secret)' anahtarını yapıştırınız.`
          );
        }
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      showStatus("🎉 Ürün başarıyla Supabase'e kaydedildi ve yayına alındı!", "success");
      btn.textContent = "✅ Başarıyla Kaydedildi";

      // Başarılı kayıttan sonra taslağı sil
      await chrome.storage.local.remove("productFormDraft");

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = "🚀 Supabase'e Aktar & Sitede Yayınla";
      }, 3000);
    } catch (err) {
      showStatus("Hata: " + err.message, "error");
      btn.disabled = false;
      btn.textContent = "🚀 Tekrar Dene";
    }
  });

  // 11. Toplu Çekim (Kategori) Butonları
  document.getElementById("btnStartBatch")?.addEventListener("click", async () => {
    const isPopup = window.innerWidth < 800;
    if (isPopup) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await chrome.storage.local.set({ targetBatchTabId: tab.id });
      }
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") + "?batch=1" });
    } else {
      runBatchScrape();
    }
  });

  document.getElementById("btnStopBatch")?.addEventListener("click", () => {
    cancelBatchRequested = true;
    appendBatchLog("⏹️ Durdurma isteği gönderildi. Sıradaki işlemde durduruluyor...", "warn");
  });
});

// =========================================================================
// Yardımcı Fonksiyonlar
// =========================================================================

let lastScrapedDescription = "";

function generateStandardDescription(data, specsObj) {
  const brand = document.getElementById("fldBrand")?.value.trim() || data?.brand || "";
  const model = document.getElementById("fldModel")?.value.trim() || data?.model || "";

  let specs = specsObj;
  if (!specs) {
    try {
      specs = JSON.parse(document.getElementById("fldSpecsJson")?.value || "{}");
    } catch {
      specs = {};
    }
  }
  const kalibre = specs["Kalibre"] || specs["kalibre"] || "";

  // {Marka,Model,Kalibre} oluşturma
  const parts = [];
  if (brand) parts.push(brand);
  if (model && !model.toLowerCase().includes(brand.toLowerCase())) {
    parts.push(model);
  }
  if (kalibre && !model.toLowerCase().includes(kalibre.toLowerCase())) {
    parts.push(kalibre);
  }

  const prefix = parts.length > 0 ? parts.join(" ") : document.getElementById("fldNameTr")?.value.trim() || data?.title || "Ürünümüz";
  return `${prefix}, Malatya Av Güner Av Bayii resmi güvencesiyle mağazamızda. Teknik detaylar sayfanın altındadır.`;
}

function populateForm(data) {
  if (data.title) document.getElementById("fldNameTr").value = data.title;
  if (data.name_tr) document.getElementById("fldNameTr").value = data.name_tr;

  const specs = data.specs_tr || data.specs || {};

  const brandVal =
    data.brand ||
    (specs ? specs["Marka"] || specs["Brand"] : "") ||
    "";
  if (brandVal) document.getElementById("fldBrand").value = brandVal;

  if (data.model) {
    if (/^yb_|^stk_|^prd_|^art_/i.test(data.model)) {
      document.getElementById("fldModel").value = "";
    } else {
      document.getElementById("fldModel").value = data.model;
    }
  } else if (specs["Ürün Kodu"] || specs["ürün kodu"] || specs["Model"]) {
    document.getElementById("fldModel").value = specs["Ürün Kodu"] || specs["ürün kodu"] || specs["Model"];
  } else {
    document.getElementById("fldModel").value = "";
  }

  if (data.price !== undefined && data.price !== null) {
    const cleanedPrice = parseTurkishPrice(data.price);
    document.getElementById("fldPrice").value = cleanedPrice !== null ? cleanedPrice : data.price;
  }

  if (typeof data.in_stock === "boolean") {
    const chkInStock = document.getElementById("chkInStock");
    if (chkInStock) chkInStock.checked = data.in_stock;
  }

  if (data.images && Array.isArray(data.images)) {
    document.getElementById("fldImages").value = data.images.join("\n");
  } else if (typeof data.images === "string") {
    document.getElementById("fldImages").value = data.images;
  }

  // Specs
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
  document.getElementById("fldSpecsJson").value = JSON.stringify(specs, null, 2);

  // Açıklama Yönetimi: Tedarikçi açıklaması vs. Güner AV standart resmi güvence açıklaması
  lastScrapedDescription = data.description || "";
  const chkUseScraped = document.getElementById("chkUseScrapedDescription");
  const descEl = document.getElementById("fldDescription");
  if (descEl) {
    if (chkUseScraped && chkUseScraped.checked && lastScrapedDescription) {
      descEl.value = lastScrapedDescription;
    } else {
      descEl.value = generateStandardDescription(data, specs);
    }
  }

  // Variants (Renk / Model Varyantları)
  const variants = data.variants || [];
  renderVariantsPreview(variants);

  // Akıllı Kategori ve Ruhsat Tahmini
  const fullText = (
    (data.title || "") + " " +
    (data.category || "") + " " +
    (data.brand || "") + " " +
    JSON.stringify(specs) + " " +
    (data.description || "")
  ).toLowerCase();

  const catSelect = document.getElementById("fldCategory");
  const licenseChk = document.getElementById("chkRequiresLicense");

  const ensureCategoryOption = (selectEl, val, label) => {
    if (!selectEl.querySelector(`option[value="${val}"]`)) {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = label || val;
      selectEl.appendChild(opt);
    }
  };

  const titleLower = (data.title || "").toLowerCase();
  const isAccessory =
    (data.category && (data.category.startsWith("aksesuar") || data.category === "bicak" || data.category.startsWith("bicak-"))) ||
    fullText.includes("av-taktik-aksesuar") ||
    fullText.includes("taktik-aksesuar") ||
    fullText.includes("k-237") ||
    fullText.includes("k-238") ||
    fullText.includes("k-239") ||
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
    titleLower.includes("kundak") ||
    titleLower.includes("bipod") ||
    titleLower.includes("çatal ayak") ||
    titleLower.includes("temizleme seti") ||
    titleLower.includes("bakım seti") ||
    titleLower.includes("harbi") ||
    titleLower.includes("picatinny") ||
    titleLower.includes("ray adaptör") ||
    titleLower.includes("ray pedi") ||
    titleLower.includes("ray kapak") ||
    titleLower.includes("fişeklik") ||
    titleLower.includes("fiseklik") ||
    titleLower.includes("pikatin");

  const isFirearm =
    !isAccessory &&
    (titleLower.includes("tüfek") ||
    titleLower.includes("tufek") ||
    titleLower.includes("tabanca") ||
    titleLower.includes("av tüfeği") ||
    titleLower.includes("av tufegi") ||
    titleLower.includes("pompalı") ||
    titleLower.includes("pompali") ||
    titleLower.includes("poze") ||
    titleLower.includes("çifte") ||
    titleLower.includes("cifte"));

  // 0. Öncelikli Kategori (Aksesuarlar doğrudan Tüfek - Aksesuarlar kategorisine atanır)
  if (isAccessory) {
    licenseChk.checked = false;
    catSelect.value = "tufek-aksesuar";
  } else if (data.category && data.category !== "kamp" && data.category !== "tufek" && data.category !== "muhimmat" && data.category !== "bicak" && !data.category.startsWith("aksesuar")) {
    ensureCategoryOption(catSelect, data.category, data.category);
    catSelect.value = data.category;
    licenseChk.checked = data.category.startsWith("tufek") && data.category !== "tufek-aksesuar";
  } else if (isFirearm) {
    licenseChk.checked = true;
    if (fullText.includes("bullpup")) {
      catSelect.value = "tufek-bullpup";
    } else if (titleLower.includes("şarjörlü") || titleLower.includes("sarjorlu") || (specs["Tipi"] && /şarjör/i.test(specs["Tipi"]))) {
      catSelect.value = "tufek-sarjorlu";
    } else if (fullText.includes("pompalı") || fullText.includes("pompali") || fullText.includes("pump")) {
      catSelect.value = "tufek-pompali";
    } else if (fullText.includes("tek kırma") || fullText.includes("tek kirma") || fullText.includes("tekkırma")) {
      catSelect.value = "tufek-tek-kirma";
    } else if (fullText.includes("süperpoze") || fullText.includes("superpoze") || fullText.includes("over and under") || fullText.includes("poze")) {
      catSelect.value = "tufek-superpoze";
    } else if (fullText.includes("çifte") || fullText.includes("cifte") || fullText.includes("side by side")) {
      catSelect.value = "tufek-cifte";
    } else if (
      fullText.includes("yarı otomatik") ||
      fullText.includes("yari otomatik") ||
      fullText.includes("otomatik") ||
      fullText.includes("kinetik") ||
      fullText.includes("inertia") ||
      fullText.includes("gazlı") ||
      fullText.includes("semi-auto") ||
      fullText.includes("semi auto") ||
      fullText.includes("patrol") ||
      fullText.includes("gordion")
    ) {
      catSelect.value = "tufek-yari-otomatik";
    } else {
      catSelect.value = "tufek";
    }
  } else if (
    (data.category && (data.category === "muhimmat" || data.category.startsWith("muhimmat-"))) ||
    titleLower.includes("fişek") ||
    titleLower.includes("fisek") ||
    titleLower.includes("mühimmat") ||
    titleLower.includes("muhimmat") ||
    titleLower.includes("kartuş") ||
    titleLower.includes("kartus") ||
    titleLower.includes("sterling") ||
    /\b(24|28|30|32|34|36|38|40)\s*(?:gram|gr)\b/i.test(titleLower)
  ) {
    // 2. Mühimmat & Av Fişekleri Tespiti (Ruhsat KESİNLİKLE İstenmez)
    licenseChk.checked = false; // Av fişekleri ruhsatsız satılır

    if (data.category && (data.category === "muhimmat" || data.category.startsWith("muhimmat-"))) {
      ensureCategoryOption(catSelect, data.category, data.category);
      catSelect.value = data.category;
    } else {
      const gramMatch = fullText.match(/\b(24|28|30|32|34|36|38|40)\s*(?:gram|gr)\b/i);
      if (gramMatch) {
        const catVal = `muhimmat-${gramMatch[1]}-gram`;
        ensureCategoryOption(catSelect, catVal, `Fişek - ${gramMatch[1]} Gram`);
        catSelect.value = catVal;
      } else if (fullText.includes("tek kurşun") || fullText.includes("tek kursun") || fullText.includes("slug")) {
        catSelect.value = "muhimmat-tek-kursun";
      } else if (fullText.includes("şavrotin") || fullText.includes("savrotin") || fullText.includes("buckshot")) {
        catSelect.value = "muhimmat-savrotin";
      } else if (fullText.includes("trap") || fullText.includes("skeet")) {
        catSelect.value = "muhimmat-trap-skeet";
      } else if (fullText.includes("magnum")) {
        catSelect.value = "muhimmat-magnum";
      } else if (fullText.includes("çelik") || fullText.includes("celik") || fullText.includes("kurşunsuz")) {
        catSelect.value = "muhimmat-kursunsuz-celik";
      } else if (fullText.includes("özel dolum") || fullText.includes("karışık")) {
        catSelect.value = "muhimmat-ozel-dolum";
      } else {
        catSelect.value = "muhimmat";
      }
    }
  } else if (fullText.includes("bullpup")) {
    catSelect.value = "tufek-bullpup";
    licenseChk.checked = true;
  } else if (
    fullText.includes("şarjör") ||
    fullText.includes("sarjor") ||
    fullText.includes("şarjörlü") ||
    fullText.includes("sarjorlu")
  ) {
    catSelect.value = "tufek-sarjorlu";
    licenseChk.checked = true;
  } else if (
    fullText.includes("pompalı") ||
    fullText.includes("pompali") ||
    fullText.includes("pump action") ||
    fullText.includes("pump-action")
  ) {
    catSelect.value = "tufek-pompali";
    licenseChk.checked = true;
  } else if (
    fullText.includes("tek kırma") ||
    fullText.includes("tek kirma") ||
    fullText.includes("tekkırma")
  ) {
    catSelect.value = "tufek-tek-kirma";
    licenseChk.checked = true;
  } else if (
    fullText.includes("süperpoze") ||
    fullText.includes("superpoze") ||
    fullText.includes("over and under") ||
    fullText.includes("poze")
  ) {
    catSelect.value = "tufek-superpoze";
    licenseChk.checked = true;
  } else if (
    fullText.includes("çifte") ||
    fullText.includes("cifte") ||
    fullText.includes("side by side")
  ) {
    catSelect.value = "tufek-cifte";
    licenseChk.checked = true;
  } else if (
    fullText.includes("yarı otomatik") ||
    fullText.includes("yari otomatik") ||
    fullText.includes("otomatik av tüfeği") ||
    fullText.includes("otomatik") ||
    fullText.includes("kinetik") ||
    fullText.includes("gazlı") ||
    fullText.includes("semi-auto") ||
    fullText.includes("semi auto")
  ) {
    catSelect.value = "tufek-yari-otomatik";
    licenseChk.checked = true;
  } else if (
    fullText.includes("tüfek") ||
    fullText.includes("shotgun") ||
    fullText.includes("yivsiz") ||
    fullText.includes("av tüfeği")
  ) {
    catSelect.value = "tufek-yari-otomatik";
    licenseChk.checked = true;
  } else if (
    fullText.includes("dürbün") ||
    fullText.includes("scope") ||
    fullText.includes("optik") ||
    fullText.includes("termal") ||
    fullText.includes("red dot") ||
    fullText.includes("reddot")
  ) {
    catSelect.value = "optik";
    licenseChk.checked = false;
  } else if (
    fullText.includes("bıçak") ||
    fullText.includes("bicak") ||
    fullText.includes("çakı") ||
    fullText.includes("caki") ||
    fullText.includes("knife") ||
    fullText.includes("pala") ||
    fullText.includes("balta") ||
    fullText.includes("bıçak kılıf") ||
    fullText.includes("bicak kilif")
  ) {
    catSelect.value = "bicak";
    licenseChk.checked = false;
  } else if (fullText.includes("çadır") || fullText.includes("cadir") || fullText.includes("tent")) {
    catSelect.value = (fullText.includes("aksesuar") || fullText.includes("tente") || fullText.includes("kazık") || fullText.includes("ip")) ? "kamp-cadir-aksesuari" : "kamp-cadir";
    licenseChk.checked = false;
  } else if (fullText.includes("uyku tulumu") || fullText.includes("tulum") || fullText.includes("sleeping bag")) {
    catSelect.value = "kamp-uyku-tulumu";
    licenseChk.checked = false;
  } else if (fullText.includes("kamp mat") || fullText.includes("mat ") || fullText.includes("şişme mat") || fullText.includes("şişme yatak") || fullText.includes("kamp yatak")) {
    catSelect.value = "kamp-mat";
    licenseChk.checked = false;
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
    catSelect.value = "kamp";
    licenseChk.checked = false;
  } else if (
    fullText.includes("giyim") ||
    fullText.includes("mont") ||
    fullText.includes("pantolon") ||
    fullText.includes("yelek") ||
    fullText.includes("bot") ||
    fullText.includes("çizme") ||
    fullText.includes("polar") ||
    fullText.includes("şapka") ||
    fullText.includes("eldiven")
  ) {
    catSelect.value = "giyim";
    licenseChk.checked = false;
  } else {
    catSelect.value = "kamp";
    licenseChk.checked = false;
  }

  updateImagesPreview();
}

async function saveFormDraft() {
  const draft = {
    nameTr: document.getElementById("fldNameTr")?.value || "",
    category: document.getElementById("fldCategory")?.value || "kamp",
    price: document.getElementById("fldPrice")?.value || "",
    brand: document.getElementById("fldBrand")?.value || "",
    model: document.getElementById("fldModel")?.value || "",
    images: document.getElementById("fldImages")?.value || "",
    variantsJson: document.getElementById("fldVariantsJson")?.value || "",
    featured: document.getElementById("chkFeatured")?.checked ?? true,
    heroSpotlight: document.getElementById("chkHeroSpotlight")?.checked ?? false,
    hasDiscount: document.getElementById("chkHasDiscount")?.checked ?? false,
    discountPercent: document.getElementById("fldDiscountPercent")?.value || "",
    requiresLicense: document.getElementById("chkRequiresLicense")?.checked ?? false,
    inStock: document.getElementById("chkInStock")?.checked ?? true,
    useScrapedDescription: document.getElementById("chkUseScrapedDescription")?.checked ?? false,
    description: document.getElementById("fldDescription")?.value || "",
    specsJson: document.getElementById("fldSpecsJson")?.value || "",
  };

  await chrome.storage.local.set({ productFormDraft: draft });
}

function restoreFormDraft(draft) {
  if (!draft) return;

  if (draft.nameTr) document.getElementById("fldNameTr").value = draft.nameTr;
  if (draft.category) document.getElementById("fldCategory").value = draft.category;
  if (draft.price) document.getElementById("fldPrice").value = draft.price;
  if (draft.brand) document.getElementById("fldBrand").value = draft.brand;
  if (draft.model) document.getElementById("fldModel").value = draft.model;
  if (draft.images) document.getElementById("fldImages").value = draft.images;

  if (typeof draft.useScrapedDescription === "boolean" && document.getElementById("chkUseScrapedDescription")) {
    document.getElementById("chkUseScrapedDescription").checked = draft.useScrapedDescription;
  }

  if (draft.description && document.getElementById("fldDescription")) {
    document.getElementById("fldDescription").value = draft.description;
  }

  if (draft.variantsJson) {
    try {
      const vars = JSON.parse(draft.variantsJson);
      renderVariantsPreview(vars);
    } catch (e) {}
  }

  if (typeof draft.featured === "boolean") document.getElementById("chkFeatured").checked = draft.featured;
  if (typeof draft.heroSpotlight === "boolean") document.getElementById("chkHeroSpotlight").checked = draft.heroSpotlight;

  if (typeof draft.hasDiscount === "boolean") {
    document.getElementById("chkHasDiscount").checked = draft.hasDiscount;
    const discountRow = document.getElementById("discountPercentRow");
    if (discountRow) discountRow.style.display = draft.hasDiscount ? "block" : "none";
  }
  if (draft.discountPercent) document.getElementById("fldDiscountPercent").value = draft.discountPercent;

  if (typeof draft.requiresLicense === "boolean") document.getElementById("chkRequiresLicense").checked = draft.requiresLicense;
  if (typeof draft.inStock === "boolean") document.getElementById("chkInStock").checked = draft.inStock;

  if (draft.specsJson) document.getElementById("fldSpecsJson").value = draft.specsJson;

  updateImagesPreview();

  const draftStatusEl = document.getElementById("draftStatus");
  if (draftStatusEl) {
    draftStatusEl.style.display = "block";
    setTimeout(() => {
      draftStatusEl.style.display = "none";
    }, 4000);
  }
}

async function resetForm() {
  document.getElementById("fldNameTr").value = "";
  document.getElementById("fldBrand").value = "";
  document.getElementById("fldModel").value = "";
  document.getElementById("fldPrice").value = "";
  document.getElementById("fldImages").value = "";
  document.getElementById("fldSpecsJson").value = "";
  document.getElementById("fldCategory").value = "kamp";

  const descEl = document.getElementById("fldDescription");
  if (descEl) descEl.value = "";

  if (document.getElementById("chkUseScrapedDescription")) {
    document.getElementById("chkUseScrapedDescription").checked = false;
  }
  lastScrapedDescription = "";

  renderVariantsPreview([]);

  document.getElementById("chkFeatured").checked = true;
  document.getElementById("chkHeroSpotlight").checked = false;
  document.getElementById("chkHasDiscount").checked = false;
  document.getElementById("discountPercentRow").style.display = "none";
  document.getElementById("fldDiscountPercent").value = "";
  document.getElementById("chkRequiresLicense").checked = false;
  document.getElementById("chkInStock").checked = true;

  const previewBox = document.getElementById("imagesPreviewBox");
  if (previewBox) previewBox.innerHTML = "";

  const draftStatusEl = document.getElementById("draftStatus");
  if (draftStatusEl) draftStatusEl.style.display = "none";

  const banner = document.getElementById("statusBanner");
  if (banner) banner.style.display = "none";

  await chrome.storage.local.remove("productFormDraft");
}

function renderVariantsPreview(variants) {
  const sec = document.getElementById("variantsSection");
  const list = document.getElementById("variantsList");
  const count = document.getElementById("variantsCount");
  const fld = document.getElementById("fldVariantsJson");

  if (!sec || !list || !fld) return;

  if (Array.isArray(variants) && variants.length > 0) {
    sec.style.display = "block";
    if (count) count.textContent = variants.length;
    fld.value = JSON.stringify(variants);
    list.innerHTML = "";

    variants.forEach((v) => {
      const chip = document.createElement("div");
      chip.style.cssText =
        "display: inline-flex; align-items: center; gap: 5px; padding: 4px 8px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; font-size: 10px; color: #f0f6fc; font-weight: 600;";

      if (v.images && v.images[0]) {
        const img = document.createElement("img");
        img.src = v.images[0];
        img.style.cssText = "width: 20px; height: 14px; object-fit: contain; border-radius: 2px; background: #fff; border: 1px solid #444;";
        chip.appendChild(img);
      }

      const label = document.createElement("span");
      label.textContent = `${v.color_code || v.name} (${v.images ? v.images.length : 0} resim)`;
      chip.appendChild(label);

      list.appendChild(chip);
    });
  } else {
    sec.style.display = "none";
    fld.value = "";
    list.innerHTML = "";
  }
}

function updateImagesPreview() {
  const box = document.getElementById("imagesPreviewBox");
  if (!box) return;
  box.innerHTML = "";

  const text = document.getElementById("fldImages").value;
  const urls = text
    .split(/[\n,]/)
    .map(normalizeUrl)
    .filter((u) => u.startsWith("http"));

  urls.slice(0, 6).forEach((url) => {
    const img = document.createElement("img");
    img.src = url;
    img.className = "image-thumb";
    img.onerror = () => {
      img.style.display = "none";
    };
    box.appendChild(img);
  });
}

function normalizeUrl(url) {
  let u = (url || "").trim();
  if (u.startsWith("//")) {
    u = "https:" + u;
  }
  return u;
}

function slugify(text) {
  const trMap = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
  return text
    .replace(/[çğışöüÇĞİŞÖÜ]/g, (m) => trMap[m])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseTurkishPrice(rawStr) {
  if (rawStr === null || rawStr === undefined) return null;
  if (typeof rawStr === "number") return isNaN(rawStr) ? null : Math.round(rawStr);
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

function showStatus(msg, type) {
  const b = document.getElementById("statusBanner");
  if (!b) return;
  b.className = `status-banner ${type}`;
  b.style.display = "block";
  b.textContent = msg;
}

async function migrateAccessoriesToTufekAksesuar(interactive = false) {
  const cfg = await chrome.storage.local.get(["supabaseUrl", "supabaseKey"]);
  if (!cfg.supabaseUrl || !cfg.supabaseKey) {
    if (interactive) showStatus("⚠️ Supabase ayarları bulunamadı. Lütfen Ayarlar sekmesinden URL ve Key giriniz.", "warn");
    return;
  }
  try {
    const headers = {
      "Content-Type": "application/json",
      apikey: cfg.supabaseKey,
      Authorization: `Bearer ${cfg.supabaseKey}`,
      Prefer: "return=representation",
    };

    // 1. Update any category starting with aksesuar
    const res1 = await fetch(`${cfg.supabaseUrl}/rest/v1/products?category=like.aksesuar*`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ category: "tufek-aksesuar", requires_license: false }),
    });

    // 2. Update bicak-av
    const res2 = await fetch(`${cfg.supabaseUrl}/rest/v1/products?category=eq.bicak-av`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ category: "tufek-aksesuar", requires_license: false }),
    });

    let count = 0;
    if (res1.ok) {
      try {
        const data1 = await res1.json();
        if (Array.isArray(data1)) count += data1.length;
      } catch (e) {}
    }
    if (res2.ok) {
      try {
        const data2 = await res2.json();
        if (Array.isArray(data2)) count += data2.length;
      } catch (e) {}
    }

    if (interactive) {
      showStatus(`✅ ${count > 0 ? count + " adet ürün" : "Tüm aksesuarlar"} başarıyla 'Aksesuarlar' (tufek-aksesuar) kategorisine aktarıldı!`, "success");
    }
  } catch (err) {
    console.error("Migrate error:", err);
    if (interactive) {
      showStatus("❌ Taşıma hatası: " + err.message, "error");
    }
  }
}

// =========================================================================
// TOPLU ÜRÜN ÇEKİMİ VE AKILLI RENK VARYANTI GRUPLAMA
// =========================================================================

let isBatchRunning = false;
let cancelBatchRequested = false;

const COLOR_KEYWORDS = [
  // Compound color+material patterns (MUST be first, longest match wins)
  "siyah ahşap gezli slug",
  "siyah ahsap gezli slug",
  "gri ahşap gezli slug",
  "gri ahsap gezli slug",
  "bronz ahşap gezli slug",
  "bronz ahsap gezli slug",
  "siyah ahşap sentetik",
  "siyah ahsap sentetik",
  "bottomland bronz kamuflaj",
  "bottomland kamuflaj",
  "bottomland bronz",
  "bottomland",
  "max7 kamuflaj",
  "max-7 kamuflaj",
  "max7",
  "max5 kamuflaj",
  "max-5 kamuflaj",
  "max5",
  "timber kamuflaj",
  "timber",
  "realtree",
  "kryptek",
  "optifade",
  "sentetik siyah",
  "siyah sentetik",
  "gri sentetik",
  "bronz sentetik",
  "siyah ahşap",
  "siyah ahsap",
  "gri ahşap",
  "gri ahsap",
  "bronz ahşap",
  "bronz ahsap",
  "ahşap bronz",
  "ahsap bronz",
  "ahşap gri",
  "ahsap gri",
  "ahşap siyah",
  "ahsap siyah",
  "ceviz bronz",
  "ceviz gri",
  "ceviz siyah",
  "mat siyah",
  "parlak siyah",
  "ahşap",
  "ahsap",
  "ceviz",
  "bronz",
  "bronze",
  "kamuflaj",
  "camo",
  "cerakote",
  "tungsten",
  "nikel",
  "krom",
  "titanium",
  "haki",
  "yeşil",
  "yesil",
  "kum",
  "çöl",
  "col",
  "desert",
  "fde",
  "coyote",
  "gri",
  "siyah",
  "karbon",
  "carbon",
  "beyaz",
  "kırmızı",
  "mavi"
];

function extractColorAndBaseModel(title, brand) {
  let clean = (title || "").trim();
  if (brand) {
    const bRegex = new RegExp(`^${brand}\\s*`, "i");
    clean = clean.replace(bRegex, "").trim();
  }

  // Tüm temizleme regex'leri — sırasıyla ve tekrarlı uygula
  const cleanPatterns = [
    /y\.\s*oto/gi,                            // Y.Oto, Y. Oto
  ];
  // Türkçe kelime sınırı (\b) çalışmaz, bu yüzden case-insensitive string replace kullanıyoruz
  const stripTerms = [
    "12 kalibre", "20 kalibre", "28 kalibre", "36 kalibre", "410 kalibre",
    "12 cal", "20 cal", "12 ga", "20 ga",
    "av tüfeği", "av tufegi",
    "yarı otomatik", "yari otomatik",
    "pompalı", "pompali",
    "süperpoze", "superpoze",
    "çifte", "cifte"
  ];

  // Regex temizlikleri
  cleanPatterns.forEach(pat => { clean = clean.replace(pat, " "); });

  // String bazlı temizlikler (Türkçe-uyumlu)
  stripTerms.forEach(term => {
    const termLower = term.toLowerCase();
    let lower = clean.toLowerCase();
    let idx = lower.indexOf(termLower);
    while (idx !== -1) {
      const before = idx === 0 || lower[idx - 1] === " ";
      const afterIdx = idx + termLower.length;
      const after = afterIdx >= lower.length || lower[afterIdx] === " ";
      if (before && after) {
        clean = (clean.substring(0, idx) + " " + clean.substring(afterIdx)).trim();
        lower = clean.toLowerCase();
        idx = lower.indexOf(termLower);
      } else {
        break;
      }
    }
  });
  clean = clean.replace(/\s+/g, " ").trim();

  // Renk kalıbını ara (longest match first - COLOR_KEYWORDS uzundan kısaya sıralı)
  let detectedColor = "";
  const cleanLower = clean.toLowerCase();
  for (const c of COLOR_KEYWORDS) {
    const cLower = c.toLowerCase();
    const idx = cleanLower.indexOf(cLower);
    if (idx === -1) continue;

    const before = idx === 0 || cleanLower[idx - 1] === " ";
    const afterIdx = idx + cLower.length;
    const after = afterIdx >= cleanLower.length || cleanLower[afterIdx] === " ";

    if (before && after) {
      detectedColor = clean.substring(idx, idx + cLower.length);
      clean = (clean.substring(0, idx) + " " + clean.substring(afterIdx)).replace(/\s+/g, " ").trim();
      break;
    }
  }

  const baseModel = clean.trim();
  return {
    baseModel: baseModel || (brand ? brand + " (Model)" : title),
    detectedColor: detectedColor ? capitalizeWords(detectedColor) : ""
  };
}

function capitalizeWords(str) {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function groupProductsByVariant(rawProducts, options = {}) {
  const useSupplierDesc = options.useSupplierDesc ?? false;
  const groups = new Map();

  rawProducts.forEach((p) => {
    let brand = p.brand || (p.specs && (p.specs["Marka"] || p.specs["Brand"])) || "";

    // Dinamik marka algılama: Marka boşsa başlığın ilk kelimesini marka olarak kullan
    // Böylece "Garcia p202 Kırmızı" gibi bilinmeyen markalarda da varyant gruplama çalışır
    if (!brand && p.title) {
      const words = p.title.trim().split(/\s+/);
      if (words.length > 1 && words[0].length >= 3 && /^[A-ZÇĞİÖŞÜa-zçğıöşü]+$/i.test(words[0])) {
        brand = words[0];
      }
    }

    const { baseModel, detectedColor } = extractColorAndBaseModel(p.title, brand);

    // Gruplama anahtarı: Marka + Baz Model (örn: "retay::air control extreme r")
    const normBrand = brand.toLowerCase().trim();
    const normModel = baseModel.toLowerCase().trim();
    const groupKey = normBrand && normModel ? `${normBrand}::${normModel}` : (p.title || Math.random().toString());

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        brand,
        baseModel,
        category: p.category,
        requires_license: p.requires_license,
        items: [],
      });
    }

    groups.get(groupKey).items.push({
      ...p,
      detectedColor: detectedColor || p.title,
    });
  });

  const finalProducts = [];

  groups.forEach((g) => {
    if (g.items.length === 1) {
      // Tekil ürün (farklı rengi yok)
      const item = g.items[0];
      if (!item.model && g.baseModel) {
        item.model = g.baseModel;
      }
      const desc = useSupplierDesc && item.description
        ? item.description
        : generateStandardDescription(item, item.specs);

      finalProducts.push({
        ...item,
        brand: item.brand || g.brand || (item.specs && (item.specs["Marka"] || item.specs["Brand"])) || "",
        model: item.model || g.baseModel || (item.specs && (item.specs["Ürün Kodu"] || item.specs["Model"] || item.specs["Stok Kodu"])) || "",
        in_stock: item.in_stock !== false,
        name_tr: item.title,
        description_tr: desc,
        description_en: desc,
      });
    } else {
      // BİRDEN FAZLA RENK VARYANTI TESPİT EDİLDİ (Castello CSR-12 gibi birleştir)
      const primaryItem = g.items[0];
      const variants = [];

      g.items.forEach((item, idx) => {
        const variantName = item.detectedColor || `Renk Seçeneği ${idx + 1}`;
        variants.push({
          name: variantName,
          color_code: variantName,
          images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [],
        });
      });

      // Ana başlık: Tüfek ise Marka + Baz Model + Kalibre + Tüfek, aksesuar ise Marka + Model
      const isShotgun =
        (primaryItem.category && primaryItem.category.startsWith("tufek") && !primaryItem.category.startsWith("tufek-aksesuar")) ||
        (primaryItem.requires_license && !primaryItem.category?.startsWith("aksesuar"));
      const typeSuffix = isShotgun ? "Yarı Otomatik Av Tüfeği" : "";
      const kalibre = primaryItem.specs?.["Kalibre"] || primaryItem.specs?.["kalibre"] || (isShotgun ? "12 Kalibre" : "");
      
      let baseModelPart = g.baseModel || "";
      if (g.brand && baseModelPart.toLowerCase().startsWith(g.brand.toLowerCase())) {
        baseModelPart = baseModelPart.substring(g.brand.length).trim();
      }
      
      const unifiedTitle = isShotgun
        ? [g.brand, baseModelPart, kalibre, typeSuffix].filter(Boolean).join(" ")
        : ([g.brand, baseModelPart].filter(Boolean).join(" ") || primaryItem.title);

      // Ana görseller: ilk varyantın görselleri
      const mainImages = variants[0]?.images?.length > 0 ? variants[0].images : (primaryItem.images || []);

      // Fiyat: En düşük olan (taban fiyat)
      const prices = g.items.map((i) => i.price).filter((pr) => typeof pr === "number" && !isNaN(pr));
      const minPrice = prices.length > 0 ? Math.min(...prices) : primaryItem.price;
      const inStock = g.items.some((i) => i.in_stock !== false);

      // Açıklama
      const desc = useSupplierDesc && primaryItem.description
        ? primaryItem.description
        : `${g.brand || "Ürünümüz"} ${baseModelPart}, Malatya Av Güner Av Bayii resmi güvencesiyle mağazamızda. Teknik detaylar sayfanın altındadır.`;

      finalProducts.push({
        ...primaryItem,
        title: unifiedTitle,
        name_tr: unifiedTitle,
        brand: g.brand || primaryItem.brand || (primaryItem.specs && (primaryItem.specs["Marka"] || primaryItem.specs["Brand"])) || "",
        model: g.baseModel || primaryItem.model || (primaryItem.specs && (primaryItem.specs["Ürün Kodu"] || primaryItem.specs["Model"])) || "",
        price: minPrice,
        in_stock: inStock,
        images: mainImages,
        variants: variants,
        description: desc,
        description_tr: desc,
        description_en: desc,
      });
    }
  });

  return finalProducts;
}

function appendBatchLog(msg, type = "info") {
  const consoleEl = document.getElementById("batchConsoleLog");
  if (!consoleEl) return;
  consoleEl.style.display = "block";
  const line = document.createElement("div");
  line.className = `log-line ${type}`;
  const time = new Date().toLocaleTimeString("tr-TR", { hour12: false });
  line.textContent = `[${time}] ${msg}`;
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function updateBatchProgress(percent, statusText, countText, addedText) {
  const bar = document.getElementById("batchProgressBar");
  const pText = document.getElementById("batchPercentText");
  const sText = document.getElementById("batchStatusText");
  const cText = document.getElementById("batchCountText");
  const aText = document.getElementById("batchAddedText");

  if (bar) bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  if (pText) pText.textContent = `${Math.round(percent)}%`;
  if (sText && statusText !== undefined) sText.textContent = statusText;
  if (cText && countText !== undefined) cText.textContent = countText;
  if (aText && addedText !== undefined) aText.textContent = addedText;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function finishBatchUI() {
  isBatchRunning = false;
  const btnStart = document.getElementById("btnStartBatch");
  const btnStop = document.getElementById("btnStopBatch");
  if (btnStart) {
    btnStart.disabled = false;
    btnStart.style.opacity = "1";
    btnStart.textContent = "🚀 Sayfadaki Ürünleri Toplu Çek & Aktar";
  }
  if (btnStop) btnStop.style.display = "none";
}

async function runBatchScrape() {
  const savedCfg = await chrome.storage.local.get(["supabaseUrl", "supabaseKey"]);
  if (!savedCfg.supabaseUrl || !savedCfg.supabaseKey) {
    alert("Lütfen önce Ayarlar sekmesinden Supabase URL ve Key (service_role) kaydedin!");
    const settingsTab = document.querySelector('[data-tab="tabSettings"]');
    settingsTab?.click();
    return;
  }

  const btnStart = document.getElementById("btnStartBatch");
  const btnStop = document.getElementById("btnStopBatch");
  const wrapper = document.getElementById("batchProgressWrapper");
  const consoleEl = document.getElementById("batchConsoleLog");

  isBatchRunning = true;
  cancelBatchRequested = false;

  btnStart.disabled = true;
  btnStart.style.opacity = "0.6";
  btnStart.textContent = "⏳ Toplu Çekim Devam Ediyor...";
  btnStop.style.display = "block";
  wrapper.style.display = "block";
  consoleEl.style.display = "block";
  consoleEl.innerHTML = "";

  appendBatchLog("🚀 Toplu tarama işlemi başlatıldı...", "info");
  updateBatchProgress(5, "Sayfadaki ürün linkleri toplanıyor...", "0 / 0", "0");

  try {
    let targetTab = null;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("batch") === "1") {
      const { targetBatchTabId } = await chrome.storage.local.get("targetBatchTabId");
      if (targetBatchTabId) {
        try { targetTab = await chrome.tabs.get(targetBatchTabId); } catch(e){}
      }
    }
    
    if (!targetTab) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      targetTab = activeTab;
    }

    if (!targetTab?.id) {
      throw new Error("Aktif tarayıcı sekmesi bulunamadı.");
    }
    
    const tab = targetTab;

    // Özel URL girilmişse ve aktif sekme o URL'de değilse
    const customUrl = document.getElementById("fldBatchUrl")?.value.trim();
    if (customUrl && !tab.url?.includes(customUrl)) {
      appendBatchLog(`🌐 Belirtilen URL'ye gidiliyor: ${customUrl}`, "info");
      await chrome.tabs.update(tab.id, { url: customUrl });
      // Sayfanın yüklenmesini bekle
      await sleep(2500);
    }

    // 1. Content Script'e ürün linklerini toplat
    const getLinksPromise = () =>
      new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_LISTING_LINKS" }, (res) => {
          if (chrome.runtime.lastError || !res?.success) {
            // Content script henüz inject edilmemiş olabilir, manuel inject et ve tekrar dene
            chrome.scripting.executeScript(
              { target: { tabId: tab.id }, files: ["content.js"] },
              () => {
                chrome.tabs.sendMessage(tab.id, { action: "EXTRACT_LISTING_LINKS" }, (retryRes) => {
                  if (chrome.runtime.lastError || !retryRes?.success) {
                    reject(new Error("Kategori sayfasındaki ürün linkleri okunamadı. Lütfen sayfayı bir kez yenileyip (F5) deneyin."));
                  } else {
                    resolve({ links: retryRes.links || [], paginationPages: retryRes.paginationPages || [] });
                  }
                });
              }
            );
          } else {
            resolve({ links: res.links || [], paginationPages: res.paginationPages || [] });
          }
        });
      });

    const listingData = await getLinksPromise();
    let links = Array.isArray(listingData.links) ? [...listingData.links] : [];
    const paginationPages = Array.isArray(listingData.paginationPages) ? listingData.paginationPages : [];

    // İlave Sayfaları da Otomatik Tara (Sayfa 2, Sayfa 3...)
    const chkAllPages = document.getElementById("chkBatchAllPages")?.checked ?? true;
    if (chkAllPages && paginationPages.length > 0) {
      appendBatchLog(`📑 Sayfalama tespit edildi: ${paginationPages.length} ilave sayfa taranıyor...`, "info");
      for (const pUrl of paginationPages) {
        if (cancelBatchRequested) break;
        try {
          const pageRes = await new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: "FETCH_PAGE_LINKS", url: pUrl }, (r) => {
              resolve(r?.success ? r.links : []);
            });
          });
          if (Array.isArray(pageRes) && pageRes.length > 0) {
            let added = 0;
            pageRes.forEach((l) => {
              if (!links.includes(l)) {
                links.push(l);
                added++;
              }
            });
            appendBatchLog(`  ✓ ${pUrl.split("?")[1] || pUrl} sayfasından +${added} ürün linki eklendi.`, "success");
          }
        } catch (e) {}
      }
    }

    if (!links || links.length === 0) {
      appendBatchLog("⚠️ Sayfada ürün bağlantısı bulunamadı. Lütfen bir kategori veya ürün listesi sayfasında olduğunuzdan emin olun.", "warn");
      updateBatchProgress(0, "Ürün bağlantısı bulunamadı.", "0 / 0", "0");
      finishBatchUI();
      return;
    }

    appendBatchLog(`🔍 Toplam ${links.length} adet tekil ürün bağlantısı tespit edildi.`, "success");
    updateBatchProgress(10, `0 / ${links.length} ürün okunuyor...`, `0 / ${links.length}`, "0");

    // 2. Her ürünün detaylarını sırayla çek
    const rawProducts = [];
    for (let i = 0; i < links.length; i++) {
      if (cancelBatchRequested) {
        appendBatchLog("⏹️ Kullanıcı işlemi durdurdu.", "warn");
        break;
      }

      const url = links[i];
      const shortName = url.split("/").filter(Boolean).pop() || url;
      appendBatchLog(`[${i + 1}/${links.length}] Detaylar çekiliyor: ${shortName}`, "info");

      const productDataPromise = () =>
        new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, { action: "FETCH_AND_EXTRACT_PRODUCT", url }, (res) => {
            if (chrome.runtime.lastError || !res?.success) {
              resolve(null);
            } else {
              resolve(res.data);
            }
          });
        });

      const pData = await productDataPromise();
      if (pData && (pData.title || pData.name_tr)) {
        rawProducts.push(pData);
        appendBatchLog(`  ✓ Başarıyla okundu: ${(pData.title || pData.name_tr).slice(0, 40)}`, "success");
      } else {
        appendBatchLog(`  ✗ Ürün verisi alınamadı: ${shortName}`, "error");
      }

      const crawlPercent = 10 + Math.round(((i + 1) / links.length) * 45); // 10% -> 55%
      updateBatchProgress(
        crawlPercent,
        `Sayfalar taranıyor (${i + 1}/${links.length})...`,
        `${i + 1} / ${links.length}`,
        "0"
      );

      // Sunucuyu yormamak ve güvenli gezinti için insani bekleme
      await sleep(1000);
    }

    if (rawProducts.length === 0) {
      appendBatchLog("❌ Hiçbir ürünün detay verisi çekilemedi.", "error");
      finishBatchUI();
      return;
    }

    // 3. Akıllı Renk Varyantı Gruplama
    const groupVariants = document.getElementById("chkBatchGroupVariants")?.checked ?? true;
    const useSupplierDesc = document.getElementById("chkBatchUseSupplierDesc")?.checked ?? false;
    const batchCategory = document.getElementById("fldBatchCategory")?.value || "auto";

    // Eğer kategori manuel seçilmişse uygula, değilse liste linkinden veya ürün detayından otomatik çıkar
    if (batchCategory !== "auto") {
      const isFirearmCat = batchCategory.startsWith("tufek") && !batchCategory.startsWith("aksesuar") && batchCategory !== "tufek-aksesuar";
      rawProducts.forEach((p) => {
        p.category = batchCategory;
        if (isFirearmCat) p.requires_license = true;
        else p.requires_license = false;
      });
      appendBatchLog(`📁 Seçilen kategori uygulandı: ${batchCategory}`, "info");
    } else {
      // Liste linki veya geçerli sekme URL'sinden otomatik kategori tespiti
      const activeUrl = (document.getElementById("fldBatchUrl")?.value || tab?.url || targetTab?.url || "").toLowerCase();
      let autoDetectedCat = null;
      if (
        activeUrl.includes("av-taktik-aksesuar") ||
        activeUrl.includes("taktik-aksesuarlari") ||
        activeUrl.includes("av-aksesuarlari") ||
        activeUrl.includes("k-237") ||
        activeUrl.includes("k-238") ||
        activeUrl.includes("k-239")
      ) {
        autoDetectedCat = "tufek-aksesuar";
      }
      else if (activeUrl.includes("cadir-aksesuarlari")) autoDetectedCat = "kamp-cadir-aksesuari";
      else if (activeUrl.includes("cadir-k-") || activeUrl.includes("cadir")) autoDetectedCat = "kamp-cadir";
      else if (activeUrl.includes("uyku-tulumu")) autoDetectedCat = "kamp-uyku-tulumu";
      else if (activeUrl.includes("mat-k-") || activeUrl.includes("mat-")) autoDetectedCat = "kamp-mat";
      else if (activeUrl.includes("yari-otomatik")) autoDetectedCat = "tufek-yari-otomatik";
      else if (activeUrl.includes("pompali")) autoDetectedCat = "tufek-pompali";
      else if (activeUrl.includes("sarjorlu")) autoDetectedCat = "tufek-sarjorlu";
      else if (activeUrl.includes("bullpup")) autoDetectedCat = "tufek-bullpup";
      else if (activeUrl.includes("superpoze")) autoDetectedCat = "tufek-superpoze";
      else if (activeUrl.includes("cifte")) autoDetectedCat = "tufek-cifte";
      else if (activeUrl.includes("tek-kirma")) autoDetectedCat = "tufek-tek-kirma";

      if (autoDetectedCat) {
        rawProducts.forEach((p) => {
          if (!p.category || p.category === "kamp" || p.category === "tufek" || p.category.startsWith("aksesuar")) {
            p.category = autoDetectedCat;
            if (autoDetectedCat.startsWith("tufek") && autoDetectedCat !== "tufek-aksesuar") {
              p.requires_license = true;
            } else {
              p.requires_license = false;
            }
          }
        });
        appendBatchLog(`🤖 Tedarikçi liste linkinden kategori otomatik algılandı: ${autoDetectedCat}`, "info");
      } else {
        // Taktik aksesuarları veya karma listeler: Her ürünün başlığından akıllı kategori tayini
        rawProducts.forEach((p) => {
          const titleLower = (p.title || "").toLowerCase();
          const isAccessory =
            (p.category && (p.category.startsWith("aksesuar") || p.category === "tufek-aksesuar")) ||
            activeUrl.includes("taktik-aksesuar") ||
            activeUrl.includes("k-237") ||
            activeUrl.includes("k-238") ||
            activeUrl.includes("k-239") ||
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
            titleLower.includes("kundak") ||
            titleLower.includes("bipod") ||
            titleLower.includes("çatal ayak") ||
            titleLower.includes("temizleme seti") ||
            titleLower.includes("bakım seti") ||
            titleLower.includes("harbi") ||
            titleLower.includes("picatinny");

          if (isAccessory) {
            p.requires_license = false;
            p.category = "tufek-aksesuar";
          }
        });
        appendBatchLog("🤖 Kategori her ürünün kendi detay sayfasından ve başlığından otomatik belirlendi.", "info");
      }
    }

    let finalProducts = [];
    if (groupVariants) {
      appendBatchLog("⚡ Renk ve model varyantları akıllı olarak analiz ediliyor...", "info");
      finalProducts = groupProductsByVariant(rawProducts, { useSupplierDesc });
      appendBatchLog(`✨ Analiz tamamlandı: ${rawProducts.length} linkten ${finalProducts.length} adet tekil/zengin ürün oluşturuldu.`, "success");
    } else {
      finalProducts = rawProducts.map((p) => ({
        ...p,
        name_tr: p.title,
        description_tr: useSupplierDesc && p.description ? p.description : generateStandardDescription(p, p.specs),
        description_en: useSupplierDesc && p.description ? p.description : generateStandardDescription(p, p.specs),
      }));
    }

    // 4. Supabase'e Sırayla Yükle
    appendBatchLog("💾 Supabase veritabanına aktarım başlıyor...", "info");
    let successCount = 0;

    for (let j = 0; j < finalProducts.length; j++) {
      if (cancelBatchRequested) {
        appendBatchLog("⏹️ Kullanıcı işlemi durdurdu.", "warn");
        break;
      }

      const p = finalProducts[j];
      const uploadPercent = 55 + Math.round(((j + 1) / finalProducts.length) * 45); // 55% -> 100%

      updateBatchProgress(
        uploadPercent,
        `Supabase'e aktarılıyor: ${(p.name_tr || p.title || "").slice(0, 25)}...`,
        `${rawProducts.length} / ${links.length}`,
        `${successCount} / ${finalProducts.length}`
      );

      const nameTr = p.name_tr || p.title;
      const slug = slugify(nameTr) || `product-${Date.now()}-${j}`;
      const specs = p.specs_tr || p.specs || {};
      const variants = p.variants || [];
      if (variants.length > 0) {
        specs.variants = variants;
      }

      const brandVal = p.brand || (specs && (specs["Marka"] || specs["Brand"])) || "Hunthink";
      const modelVal = p.model || (specs && (specs["Ürün Kodu"] || specs["Model"] || specs["Stok Kodu"])) || "";
      const priceVal = (p.requires_license === true) ? null : parseTurkishPrice(p.price);
      const inStock = p.in_stock !== false;

      const payload = {
        id: slug,
        slug_tr: slug,
        slug_en: slug + "-en",
        category: p.category || "aksesuar-taktik",
        brand: brandVal,
        model: modelVal,
        name_tr: nameTr,
        description_tr: p.description_tr || generateStandardDescription(p, specs),
        description_en: p.description_en || generateStandardDescription(p, specs),
        price: priceVal,
        discount_percent: null,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/images/products/optics-1.webp"],
        variants: variants,
        featured: true,
        is_hero_spotlight: false,
        requires_license: p.requires_license ?? false,
        in_stock: inStock,
        specs_tr: specs,
        specs_en: specs,
      };

      try {
        const res = await fetch(`${savedCfg.supabaseUrl}/rest/v1/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: savedCfg.supabaseKey,
            Authorization: `Bearer ${savedCfg.supabaseKey}`,
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errTxt = await res.text();
          throw new Error(`HTTP ${res.status}: ${errTxt}`);
        }

        successCount++;
        const variantMsg = variants.length > 1 ? ` (${variants.length} Renk Seçeneği ile)` : "";
        appendBatchLog(`✅ [${j + 1}/${finalProducts.length}] Yayına alındı: ${nameTr}${variantMsg}`, "success");
      } catch (upErr) {
        appendBatchLog(`❌ [${j + 1}/${finalProducts.length}] Yüklenemedi: ${nameTr} (${upErr.message})`, "error");
      }

      await sleep(300);
    }

    updateBatchProgress(
      100,
      `🎉 Tamamlandı! Toplam ${successCount} ürün yayında.`,
      `${rawProducts.length} / ${links.length}`,
      `${successCount} / ${finalProducts.length}`
    );
    appendBatchLog(`🎉 Tebrikler! Toplu aktarım başarıyla tamamlandı. Toplam ${successCount} adet ürün sitenizde yayına alındı.`, "success");
  } catch (err) {
    appendBatchLog(`❌ Beklenmeyen hata: ${err.message}`, "error");
    updateBatchProgress(0, `Hata: ${err.message}`);
  } finally {
    finishBatchUI();
  }
}

