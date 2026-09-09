// Güner AV - Chrome Eklentisi Popup Mantığı

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Tab Değiştirme
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
    });
  });

  document.getElementById("btnSettingsToggle")?.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tabPanes.forEach((p) => p.classList.remove("active"));
    const settingsTab = document.querySelector('[data-tab="tabSettings"]');
    settingsTab?.classList.add("active");
    document.getElementById("tabSettings")?.classList.add("active");
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
    "fldDescription",
    "fldSpecsJson",
  ];

  formInputs.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", saveFormDraft);
    el.addEventListener("change", saveFormDraft);
  });

  // Kategori değiştiğinde tüfek ise ruhsat zorunluluğunu otomatik aç, mühimmat veya diğerlerinde kapat
  document.getElementById("fldCategory")?.addEventListener("change", (e) => {
    const val = e.target.value;
    const isFirearm = val.startsWith("tufek-") || val === "tufek" || val === "silah-muhimmat";
    const isAmmo = val === "muhimmat" || val.startsWith("muhimmat-");
    const licenseChk = document.getElementById("chkRequiresLicense");
    if (licenseChk) {
      if (isFirearm) {
        licenseChk.checked = true;
      } else if (isAmmo) {
        licenseChk.checked = false; // Av fişeklerinde ruhsat istenmez
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
      const price = priceVal ? parseFloat(priceVal) : null;

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

      const slug = slugify(nameTr);

      const payload = {
        id: slug,
        slug_tr: slug,
        slug_en: slug + "-en",
        category,
        brand,
        model,
        name_tr: nameTr,
        description_tr:
          document.getElementById("fldDescription")?.value?.trim() ||
          `${nameTr}. Malatya Av Güner Av Bayii resmi güvencesiyle mağazamızda.`,
        description_en:
          document.getElementById("fldDescription")?.value?.trim() ||
          `${nameTr}. Available at official dealer Guner AV in Malatya.`,
        price,
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
});

// =========================================================================
// Yardımcı Fonksiyonlar
// =========================================================================

function populateForm(data) {
  if (data.title) document.getElementById("fldNameTr").value = data.title;
  if (data.name_tr) document.getElementById("fldNameTr").value = data.name_tr;

  const brandVal =
    data.brand ||
    (data.specs ? data.specs["Marka"] || data.specs["Brand"] : "") ||
    (data.specs_tr ? data.specs_tr["Marka"] || data.specs_tr["Brand"] : "");
  if (brandVal) document.getElementById("fldBrand").value = brandVal;

  if (data.model) {
    if (/^yb_|^stk_|^prd_|^art_/i.test(data.model)) {
      document.getElementById("fldModel").value = "";
    } else {
      document.getElementById("fldModel").value = data.model;
    }
  } else {
    document.getElementById("fldModel").value = "";
  }

  if (data.price) document.getElementById("fldPrice").value = data.price;

  if (data.description && document.getElementById("fldDescription")) {
    document.getElementById("fldDescription").value = data.description;
  }

  if (data.images && Array.isArray(data.images)) {
    document.getElementById("fldImages").value = data.images.join("\n");
  } else if (typeof data.images === "string") {
    document.getElementById("fldImages").value = data.images;
  }

  // Specs
  const specs = data.specs_tr || data.specs || {};
  delete specs["Stok Kodu"];
  delete specs["stok kodu"];
  delete specs["Ürün Kodu"];
  delete specs["SKU"];
  delete specs["sku"];
  delete specs["Kategori"];
  document.getElementById("fldSpecsJson").value = JSON.stringify(specs, null, 2);

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

  const isAmmo =
    (data.category && (data.category === "muhimmat" || data.category.startsWith("muhimmat-"))) ||
    fullText.includes("fişek") ||
    fullText.includes("fisek") ||
    fullText.includes("mühimmat") ||
    fullText.includes("muhimmat") ||
    fullText.includes("kartuş") ||
    fullText.includes("sterling") ||
    /\b(24|28|30|32|34|36|38|40)\s*(?:gram|gr)\b/i.test(fullText);

  // 1. Mühimmat & Av Fişekleri Tespiti (Ruhsat KESİNLİKLE İstenmez)
  if (isAmmo) {
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
    fullText.includes("kılıf")
  ) {
    catSelect.value = "bicak";
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
  } else if (
    fullText.includes("olta") ||
    fullText.includes("balık") ||
    fullText.includes("balik") ||
    fullText.includes("kamış") ||
    fullText.includes("kamis") ||
    fullText.includes("misina") ||
    fullText.includes("iğne") ||
    fullText.includes("yem") ||
    fullText.includes("çadır") ||
    fullText.includes("kamp") ||
    fullText.includes("fener") ||
    fullText.includes("termos") ||
    fullText.includes("tulum")
  ) {
    catSelect.value = "kamp";
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

function showStatus(msg, type) {
  const b = document.getElementById("statusBanner");
  if (!b) return;
  b.className = `status-banner ${type}`;
  b.style.display = "block";
  b.textContent = msg;
}

