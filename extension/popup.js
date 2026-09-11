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

  // 1b. Toplu Çekim Ayarları & Canlı Etiket Güncelleyici
  const chkAllPages = document.getElementById("chkBatchAllPages");
  const chkGroup = document.getElementById("chkBatchGroupVariants");
  const chkSupplierDesc = document.getElementById("chkBatchUseSupplierDesc");
  const selCat = document.getElementById("fldBatchCategory");
  const selBatchSup = document.getElementById("fldBatchSupplierId");
  const inpBatchSupCustom = document.getElementById("fldBatchSupplierIdCustom");
  const inpUrl = document.getElementById("fldBatchUrl");
  const lblGroup = document.getElementById("lblBatchGroupVariants");
  const descGroup = document.getElementById("descBatchGroupVariants");

  function updateGroupVariantsUI(isChecked) {
    if (!lblGroup || !descGroup) return;
    if (isChecked) {
      lblGroup.innerHTML = 'Varyant Birleştirme: <span style="color:#d4af37; font-weight:bold;">AÇIK (Varyantlı)</span>';
      descGroup.innerHTML = 'Aynı ürünün renklerini tek üründe toplar (Örn: 41 linkten 34 zengin varyantlı ürün).';
    } else {
      lblGroup.innerHTML = 'Varyant Birleştirme: <span style="color:#94a3b8; font-weight:bold;">KAPALI (Birebir Aktar)</span>';
      descGroup.innerHTML = '<b>Varyantlar kapalı:</b> Sayfadaki tüm linkler (41 ürünün 41\'i de) tek tek bağımsız ürün olarak eklenir.';
    }
  }

  try {
    const savedBatch = await chrome.storage.local.get([
      "batchAllPages",
      "batchGroupVariants",
      "batchUseSupplierDesc",
      "batchCategory",
      "batchSupplierId",
      "batchSupplierIdCustom",
      "batchUrl",
    ]);

    if (chkAllPages && typeof savedBatch.batchAllPages === "boolean") {
      chkAllPages.checked = savedBatch.batchAllPages;
    }
    if (chkGroup && typeof savedBatch.batchGroupVariants === "boolean") {
      chkGroup.checked = savedBatch.batchGroupVariants;
    }
    if (chkSupplierDesc && typeof savedBatch.batchUseSupplierDesc === "boolean") {
      chkSupplierDesc.checked = savedBatch.batchUseSupplierDesc;
    }
    if (selCat && savedBatch.batchCategory) {
      selCat.value = savedBatch.batchCategory;
    }
    if (selBatchSup && savedBatch.batchSupplierId) {
      selBatchSup.value = savedBatch.batchSupplierId;
      if (inpBatchSupCustom) {
        inpBatchSupCustom.style.display = savedBatch.batchSupplierId === "custom" ? "block" : "none";
        if (savedBatch.batchSupplierIdCustom) inpBatchSupCustom.value = savedBatch.batchSupplierIdCustom;
      }
    }
    if (inpUrl && savedBatch.batchUrl) {
      inpUrl.value = savedBatch.batchUrl;
    }
  } catch (e) {}

  if (chkGroup) {
    updateGroupVariantsUI(chkGroup.checked);
    chkGroup.addEventListener("change", (e) => {
      updateGroupVariantsUI(e.target.checked);
      chrome.storage.local.set({ batchGroupVariants: e.target.checked });
    });
  }

  chkAllPages?.addEventListener("change", (e) => {
    chrome.storage.local.set({ batchAllPages: e.target.checked });
  });
  chkSupplierDesc?.addEventListener("change", (e) => {
    chrome.storage.local.set({ batchUseSupplierDesc: e.target.checked });
  });
  selCat?.addEventListener("change", (e) => {
    chrome.storage.local.set({ batchCategory: e.target.value });
  });
  selBatchSup?.addEventListener("change", (e) => {
    if (inpBatchSupCustom) {
      inpBatchSupCustom.style.display = e.target.value === "custom" ? "block" : "none";
    }
    chrome.storage.local.set({ batchSupplierId: e.target.value });
  });
  inpBatchSupCustom?.addEventListener("input", (e) => {
    chrome.storage.local.set({ batchSupplierIdCustom: e.target.value });
  });
  inpUrl?.addEventListener("input", (e) => {
    chrome.storage.local.set({ batchUrl: e.target.value });
  });

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
        if (targetId === "tabBatch" || targetId === "tabSettings" || targetId === "tabAiLearner") {
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

  document.getElementById("btnGoToAi")?.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tabPanes.forEach((p) => p.classList.remove("active"));
    const aiTab = document.querySelector('[data-tab="tabAiLearner"]');
    aiTab?.classList.add("active");
    document.getElementById("tabAiLearner")?.classList.add("active");

    const sharedForm = document.getElementById("sharedProductForm");
    if (sharedForm) sharedForm.style.display = "none";
  });

  // 2. Supabase & AI Ayarlarını Yükle
  const DEFAULT_GROQ_KEY = "";
  const DEFAULT_OPENROUTER_KEY = "";

  const cfg = await chrome.storage.local.get([
    "supabaseUrl",
    "supabaseKey",
    "groqApiKey",
    "openrouterApiKey",
    "aiEngine",
    "customSiteRules",
  ]);
  if (cfg.supabaseUrl) document.getElementById("cfgSupabaseUrl").value = cfg.supabaseUrl;
  if (cfg.supabaseKey) document.getElementById("cfgSupabaseKey").value = cfg.supabaseKey;

  const currentGroqKey = cfg.groqApiKey || DEFAULT_GROQ_KEY;
  const currentOpenRouterKey = cfg.openrouterApiKey || DEFAULT_OPENROUTER_KEY;
  const currentAiEngine = cfg.aiEngine || "groq";

  if (document.getElementById("cfgGroqKey")) document.getElementById("cfgGroqKey").value = currentGroqKey;
  if (document.getElementById("cfgOpenRouterKey")) document.getElementById("cfgOpenRouterKey").value = currentOpenRouterKey;
  if (document.getElementById("selAiEngine")) document.getElementById("selAiEngine").value = currentAiEngine;

  document.getElementById("selAiEngine")?.addEventListener("change", (e) => {
    chrome.storage.local.set({ aiEngine: e.target.value });
  });

  renderSavedRulesList(cfg.customSiteRules || {});

  // Aktif Sekme Domain Tespiti
  let activeTabUrl = "";
  let activeTabDomain = "";
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.url) {
      activeTabUrl = activeTab.url;
      try {
        activeTabDomain = new URL(activeTab.url).hostname.replace(/^www\./, "").toLowerCase();
      } catch (e) {}
    }
  } catch (e) {}

  const domainBadge = document.getElementById("aiActiveDomainBadge");
  if (domainBadge) {
    domainBadge.textContent = activeTabDomain || "Sekme Açık Değil";
  }

  document.getElementById("btnSaveConfig")?.addEventListener("click", async () => {
    const url = document.getElementById("cfgSupabaseUrl").value.trim().replace(/\/+$/, "");
    const key = document.getElementById("cfgSupabaseKey").value.trim();
    const groqK = document.getElementById("cfgGroqKey")?.value.trim() || DEFAULT_GROQ_KEY;
    const openRK = document.getElementById("cfgOpenRouterKey")?.value.trim() || DEFAULT_OPENROUTER_KEY;

    await chrome.storage.local.set({
      supabaseUrl: url,
      supabaseKey: key,
      groqApiKey: groqK,
      openrouterApiKey: openRK,
    });
    showStatus("✅ Supabase ve AI ayarları başarıyla kaydedildi!", "success");
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

  // 2d. Dürbünleri optik kategorisine aktarma
  document.getElementById("btnMigrateOptics")?.addEventListener("click", () => {
    migrateOpticsToOptik(true);
  });

  // Açılışta sessizce mevcut aksesuarları ve yanlış kategorilenmiş dürbünleri normalize et
  setTimeout(() => {
    migrateAccessoriesToTufekAksesuar(false);
    migrateOpticsToOptik(false);
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
    "fldSupplierId",
    "fldSupplierIdCustom",
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

  // Tedarikçi değiştiğinde özel ID alanını göster/gizle
  const selSupplier = document.getElementById("fldSupplierId");
  const inpSupplierCustom = document.getElementById("fldSupplierIdCustom");
  selSupplier?.addEventListener("change", (e) => {
    if (inpSupplierCustom) {
      inpSupplierCustom.style.display = e.target.value === "custom" ? "block" : "none";
    }
    saveFormDraft();
  });

  // Kategori değiştiğinde tüfek ise ruhsat zorunluluğunu otomatik aç, aksesuar / mühimmat veya diğerlerinde kapat
  document.getElementById("fldCategory")?.addEventListener("change", (e) => {
    const val = e.target.value;
    const isFirearm = ((val.startsWith("tufek-") && val !== "tufek-aksesuar" && val !== "tufek-bakim") || val === "tufek" || val === "silah-muhimmat") && !val.startsWith("havali") && !val.startsWith("kurusiki");
    const isAmmo = val === "muhimmat" || val.startsWith("muhimmat-");
    const isAccessory = val.startsWith("aksesuar") || val === "bicak" || val.startsWith("bicak-") || val.startsWith("kamp");
    const isAirgun = val.startsWith("havali") || val.startsWith("kurusiki");
    const licenseChk = document.getElementById("chkRequiresLicense");
    if (licenseChk) {
      if (isFirearm) {
        licenseChk.checked = true;
      } else if (isAmmo || isAccessory || isAirgun) {
        licenseChk.checked = false; // Havalı, kurusıkı, aksesuar ve fişeklerde ruhsat istenmez
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

  // =========================================================================
  // 9b. AI Destekli Site Analizi ve Kural Çıkarma
  // =========================================================================
  let lastAiAnalysisResult = null;

  document.getElementById("btnAiAnalyzeSite")?.addEventListener("click", async () => {
    const statusBox = document.getElementById("aiStatusBox");
    const resultCard = document.getElementById("aiResultCard");
    const engine = document.getElementById("selAiEngine")?.value || "groq";
    const customPrompt = document.getElementById("inpAiCustomPrompt")?.value.trim() || "";

    const showAiStatus = (msg, type = "info") => {
      if (!statusBox) return;
      statusBox.style.display = "block";
      if (type === "loading") {
        statusBox.style.background = "rgba(99, 102, 241, 0.15)";
        statusBox.style.color = "#a5b4fc";
        statusBox.style.border = "1px solid #6366f1";
      } else if (type === "success") {
        statusBox.style.background = "rgba(34, 197, 94, 0.15)";
        statusBox.style.color = "#4ade80";
        statusBox.style.border = "1px solid #22c55e";
      } else {
        statusBox.style.background = "rgba(239, 68, 68, 0.15)";
        statusBox.style.color = "#f87171";
        statusBox.style.border = "1px solid #ef4444";
      }
      statusBox.innerHTML = msg;
    };

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showAiStatus("❌ Açık aktif bir sekme bulunamadı.", "error");
      return;
    }

    showAiStatus("⏳ Sayfa HTML yapısı okunuyor ve optimize ediliyor...", "loading");

    const getHtmlPromise = () =>
      new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, { action: "GET_CLEAN_PAGE_HTML" }, async (res) => {
          if (chrome.runtime.lastError || !res?.success) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"],
              });
              chrome.tabs.sendMessage(tab.id, { action: "GET_CLEAN_PAGE_HTML" }, (retryRes) => {
                resolve(retryRes?.success ? retryRes.data : null);
              });
            } catch (err) {
              resolve(null);
            }
          } else {
            resolve(res.data);
          }
        });
      });

    const pageInfo = await getHtmlPromise();
    if (!pageInfo || !pageInfo.htmlSnippet) {
      showAiStatus("❌ Sayfa içeriği okunamadı. Lütfen sayfayı bir kez yenileyip (F5) tekrar deneyin.", "error");
      return;
    }

    const savedKeys = await chrome.storage.local.get(["groqApiKey", "openrouterApiKey"]);
    const currentGroqKey = savedKeys.groqApiKey || DEFAULT_GROQ_KEY;
    const currentOpenRouterKey = savedKeys.openrouterApiKey || DEFAULT_OPENROUTER_KEY;

    showAiStatus(`🤖 Yapay zekâ (${engine === "groq" ? "Groq GPT OSS 120B" : "OpenRouter Nemotron Lightning"}) siteyi analiz ediyor...`, "loading");

    try {
      const aiData = await callAiSiteAnalyzer({
        engine,
        groqKey: currentGroqKey,
        openRouterKey: currentOpenRouterKey,
        pageInfo,
        customPrompt,
      });

      showAiStatus("🔍 Seçici kuralları sekmedeki canlı sayfada test ediliyor...", "loading");

      // 1. Canlı DOM üzerinde bulunan seçicileri hemen test et
      let liveData = null;
      try {
        const testRes = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tab.id, {
            action: "TEST_AI_SELECTORS",
            selectors: aiData.selectors,
          }, (res) => resolve(res));
        });
        if (testRes?.success && testRes.data) {
          liveData = testRes.data;
        }
      } catch (e) {
        console.warn("TEST_AI_SELECTORS uyarısı:", e);
      }

      const finalPreview = {
        ...(liveData || {}),
        ...(aiData.perfect_product_data || {}),
      };

      // Ensure images from liveData (which handles arrays/cleaning well) aren't completely lost
      if (liveData && liveData.images && liveData.images.length > 0) {
        if (!finalPreview.images || finalPreview.images.length === 0 || (typeof finalPreview.images === 'string')) {
          finalPreview.images = liveData.images;
        } else if (Array.isArray(finalPreview.images) && finalPreview.images.length > 0 && !finalPreview.images[0].startsWith("http")) {
          finalPreview.images = liveData.images;
        }
      }

      lastAiAnalysisResult = {
        ...aiData,
        extracted_preview: finalPreview,
      };

      showAiStatus(`🎉 Başarılı! Yapay zekâ <strong>${pageInfo.domain}</strong> için seçici kurallarını tespit etti ve başarıyla doğruladı.`, "success");

      if (resultCard) resultCard.style.display = "block";
      const domainEl = document.getElementById("aiExtractedDomain");
      if (domainEl) domainEl.textContent = pageInfo.domain;

      const sel = aiData.selectors || {};
      const lblT = document.getElementById("lblRuleTitle");
      const lblP = document.getElementById("lblRulePrice");
      const lblI = document.getElementById("lblRuleImages");
      const lblS = document.getElementById("lblRuleSpecs");

      if (lblT) lblT.textContent = sel.title || "(otomatik)";
      if (lblP) lblP.textContent = sel.price || (finalPreview.price ? "Tespit Edildi" : "(Katalog / Doğrudan Satış Fiyatı Yok)");
      if (lblI) lblI.textContent = `${sel.images || "(otomatik)"} [attr: ${sel.image_attr || "src"}]`;
      if (lblS) lblS.textContent = sel.specs_table || sel.specs_row || "(otomatik)";

      const prevEl = document.getElementById("aiSamplePreview");
      if (prevEl) {
        const hasPrice = finalPreview.price !== null && finalPreview.price !== undefined;
        const priceDisplay = hasPrice
          ? `<span style="color:#4ade80; font-weight:700;">${Number(finalPreview.price).toLocaleString("tr-TR")} ₺</span>`
          : `<span style="color:#94a3b8; font-style:italic;">Belirtilmemiş (Katalog / Fiyatsız Ürün)</span>`;

        const specsCount = finalPreview.specs ? Object.keys(finalPreview.specs).length : 0;
        const specsSampleList = specsCount > 0
          ? `<div style="font-size:10px; color:#cbd5e1; margin-top:4px; background:rgba(15,23,42,0.6); padding:4px 6px; border-radius:4px;"><b>Örnek Özellikler:</b> ${Object.entries(finalPreview.specs).slice(0, 4).map(([k, v]) => `<span>${k}: <b>${v}</b></span>`).join(" • ")}</div>`
          : "";

        prevEl.innerHTML = `
          <div><b>📌 Başlık:</b> <span style="color:#38bdf8; font-weight:600;">${finalPreview.title || "(Boş)"}</span></div>
          <div><b>💰 Fiyat:</b> ${priceDisplay}</div>
          <div><b>🏷️ Marka:</b> <span style="color:#fcd34d;">${finalPreview.brand || "(Boş)"}</span></div>
          <div><b>🖼️ Görseller:</b> <span style="color:#4ade80; font-weight:600;">${Array.isArray(finalPreview.images) ? finalPreview.images.length + " adet görsel yakalandı" : "0"}</span></div>
          <div><b>📋 Özellikler:</b> ${specsCount > 0 ? `<span style="color:#a78bfa; font-weight:600;">${specsCount} adet teknik parametre çıkarıldı</span>` : "Yok"}${specsSampleList}</div>
          ${aiData.notes ? `<div style="margin-top:6px; color:#38bdf8; font-size:10.5px; border-top:1px dashed #334155; padding-top:4px;">💡 <em>${aiData.notes}</em></div>` : ""}
        `;
      }
    } catch (err) {
      showAiStatus(`❌ AI Analiz Hatası: ${err.message}`, "error");
    }
  });

  // AI Kurallarını Hafızaya Kaydet
  document.getElementById("btnSaveAiRules")?.addEventListener("click", async () => {
    if (!lastAiAnalysisResult || !lastAiAnalysisResult.selectors) {
      showStatus("Önce geçerli bir analiz sonucu olmalıdır.", "error");
      return;
    }

    const domain = (lastAiAnalysisResult.domain || activeTabDomain || "").toLowerCase();
    if (!domain) {
      showStatus("Domain belirlenemedi.", "error");
      return;
    }

    const { customSiteRules = {} } = await chrome.storage.local.get("customSiteRules");
    customSiteRules[domain] = {
      domain,
      updatedAt: new Date().toISOString(),
      selectors: lastAiAnalysisResult.selectors,
      notes: lastAiAnalysisResult.notes || "",
    };

    await chrome.storage.local.set({ customSiteRules });
    renderSavedRulesList(customSiteRules);
    showStatus(`✅ '${domain}' kuralları hafızaya kaydedildi! Artık tekli ve toplu çekimlerde otomatik kullanılacak.`, "success");
  });

  // AI Önizleme Verisini Doğrudan Forma Aktar
  document.getElementById("btnApplyAiToForm")?.addEventListener("click", () => {
    if (!lastAiAnalysisResult) return;
    const prev = lastAiAnalysisResult.extracted_preview || {};
    populateForm({
      title: prev.title || "",
      brand: prev.brand || "",
      price: prev.price || null,
      images: Array.isArray(prev.images) ? prev.images : [],
      specs: prev.specs || {},
      description: prev.description || "",
      url: activeTabUrl,
    });
    saveFormDraft();

    tabs.forEach((t) => t.classList.remove("active"));
    tabPanes.forEach((p) => p.classList.remove("active"));
    const scrapeTab = document.querySelector('[data-tab="tabScrape"]');
    scrapeTab?.classList.add("active");
    document.getElementById("tabScrape")?.classList.add("active");

    const sharedForm = document.getElementById("sharedProductForm");
    if (sharedForm) sharedForm.style.display = "block";
    showStatus("✅ AI verisi forma başarıyla aktarıldı!", "success");
  });

  // Tüm Kayıtlı AI Kurallarını Temizle
  document.getElementById("btnClearAllAiRules")?.addEventListener("click", async () => {
    if (confirm("Tüm kayıtlı AI site kurallarını silmek istediğinize emin misiniz?")) {
      await chrome.storage.local.set({ customSiteRules: {} });
      renderSavedRulesList({});
      showStatus("🗑️ Tüm özel site kuralları temizlendi.", "info");
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

      const supSelect = document.getElementById("fldSupplierId")?.value || "2";
      let finalSupplierId = 2;
      if (supSelect === "custom") {
        const parsed = parseInt(document.getElementById("fldSupplierIdCustom")?.value, 10);
        finalSupplierId = isNaN(parsed) ? 2 : parsed;
      } else {
        finalSupplierId = parseInt(supSelect, 10) || 2;
      }

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
        supplier_id: finalSupplierId,
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
      const batchSettings = {
        targetBatchTabId: tab ? tab.id : null,
        batchAllPages: document.getElementById("chkBatchAllPages")?.checked ?? true,
        batchGroupVariants: document.getElementById("chkBatchGroupVariants")?.checked ?? true,
        batchUseSupplierDesc: document.getElementById("chkBatchUseSupplierDesc")?.checked ?? false,
        batchCategory: document.getElementById("fldBatchCategory")?.value || "auto",
        batchSupplierId: document.getElementById("fldBatchSupplierId")?.value || "auto",
        batchSupplierIdCustom: document.getElementById("fldBatchSupplierIdCustom")?.value || "",
        batchUrl: document.getElementById("fldBatchUrl")?.value || "",
      };
      await chrome.storage.local.set(batchSettings);
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
    (data.category && (data.category.startsWith("aksesuar") || data.category === "tufek-aksesuar" || data.category === "bicak" || data.category.startsWith("bicak-"))) ||
    titleLower.includes("aparati") ||
    titleLower.includes("aparatı") ||
    titleLower.includes("montaj rayı") ||
    titleLower.includes("montaj rayi") ||
    titleLower.includes("dönüştürücü ray") ||
    titleLower.includes("donusturucu ray") ||
    titleLower.includes("dürbün ayağı") ||
    titleLower.includes("durbun ayagi") ||
    titleLower.includes("yükseltici") ||
    titleLower.includes("yukseltici") ||
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
    titleLower.includes("picatinny") ||
    titleLower.includes("ray adaptör") ||
    titleLower.includes("ray pedi") ||
    titleLower.includes("ray kapak") ||
    titleLower.includes("fişeklik") ||
    titleLower.includes("fiseklik") ||
    titleLower.includes("kulaklık") ||
    titleLower.includes("kulaklik") ||
    titleLower.includes("pikatin");

  const isBakim =
    (data.category && data.category === "tufek-bakim") ||
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
    (data.category && (data.category.startsWith("havali") || data.category.startsWith("kurusiki"))) ||
    titleLower.includes("havalı tabanca") ||
    titleLower.includes("havali tabanca") ||
    titleLower.includes("havalı tüfek") ||
    titleLower.includes("havali tufek") ||
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

  const isOptic =
    !isAccessory &&
    !isBakim &&
    !isAirgun && (
      fullText.includes("av-optik") ||
      fullText.includes("durbun") ||
      fullText.includes("dürbün") ||
      fullText.includes("red dot") ||
      fullText.includes("reddot") ||
      fullText.includes("red-dot") ||
      fullText.includes("termal") ||
      fullText.includes("gece görüş") ||
      fullText.includes("gece gorus") ||
      fullText.includes("boresighter") ||
      fullText.includes("sıfırlama lazeri") ||
      fullText.includes("sifirlama lazeri") ||
      fullText.includes("monoküler") ||
      fullText.includes("monokuler") ||
      titleLower.includes("dürbün") ||
      titleLower.includes("durbun") ||
      titleLower.includes("scope") ||
      titleLower.includes("red dot") ||
      titleLower.includes("reddot") ||
      titleLower.includes("termal") ||
      titleLower.includes("sıfırlama lazeri") ||
      titleLower.includes("sifirlama lazeri")
    );

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

  // 0. Öncelikli Kategori (Havalı, Optik, Bakım ve Aksesuarlar tüfeklerden önce yakalanır)
  if (isAirgun) {
    licenseChk.checked = false;
    if ((titleLower.includes("tabanca") || titleLower.includes("pistol")) && !titleLower.includes("tüfek") && !titleLower.includes("tufek")) {
      if (titleLower.includes("kurusıkı") || titleLower.includes("kurusiki") || titleLower.includes("ses tabanca")) {
        catSelect.value = "kurusiki-tabanca";
      } else {
        catSelect.value = "havali-tabanca";
      }
    } else if (titleLower.includes("tüfek") || titleLower.includes("tufek") || titleLower.includes("rifle")) {
      catSelect.value = "havali-tufek";
    } else if (titleLower.includes("pellet") || titleLower.includes("saçma") || titleLower.includes("sacma") || titleLower.includes("co2")) {
      catSelect.value = "havali-muhimmat";
    } else {
      catSelect.value = "havali-kurusiki";
    }
  } else if (isOptic) {
    licenseChk.checked = false;
    catSelect.value = "optik";
  } else if (isBakim) {
    licenseChk.checked = false;
    catSelect.value = "tufek-bakim";
  } else if (isAccessory) {
    licenseChk.checked = false;
    catSelect.value = "tufek-aksesuar";
  } else if (data.category && data.category !== "kamp" && data.category !== "tufek" && data.category !== "muhimmat" && data.category !== "bicak" && !data.category.startsWith("aksesuar")) {
    ensureCategoryOption(catSelect, data.category, data.category);
    catSelect.value = data.category;
    licenseChk.checked = data.category.startsWith("tufek") && data.category !== "tufek-aksesuar" && data.category !== "tufek-bakim" && !data.category.startsWith("havali");
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
    fullText.includes("dürbün") ||
    fullText.includes("scope") ||
    fullText.includes("optik") ||
    fullText.includes("termal") ||
    fullText.includes("red dot") ||
    fullText.includes("reddot") ||
    fullText.includes("lazer") ||
    fullText.includes("laser")
  ) {
    catSelect.value = "optik";
    licenseChk.checked = false;
  } else if (
    !isOptic && !isAccessory && (
      fullText.includes("tüfek") ||
      fullText.includes("shotgun") ||
      fullText.includes("yivsiz") ||
      fullText.includes("av tüfeği")
    )
  ) {
    catSelect.value = "tufek-yari-otomatik";
    licenseChk.checked = true;
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

  // Tedarikçi (Supplier ID) Otomatik Tespiti
  const selSupplier = document.getElementById("fldSupplierId");
  const inpSupplierCustom = document.getElementById("fldSupplierIdCustom");
  if (selSupplier) {
    let supId = data.supplier_id;
    if (!supId) {
      const uLow = (data.url || (typeof window !== "undefined" ? window.location?.href : "") || "").toLowerCase();
      const nLow = ((data.title || "") + " " + (data.brand || "")).toLowerCase();
      if (uLow.includes("arslansilah") || nLow.includes("castello")) {
        supId = 1;
      } else if (uLow.includes("ozlerav")) {
        supId = 2;
      } else {
        supId = 2;
      }
    }
    const supStr = String(supId);
    if (["1", "2", "3", "4", "5"].includes(supStr)) {
      selSupplier.value = supStr;
      if (inpSupplierCustom) inpSupplierCustom.style.display = "none";
    } else {
      selSupplier.value = "custom";
      if (inpSupplierCustom) {
        inpSupplierCustom.style.display = "block";
        inpSupplierCustom.value = supStr;
      }
    }
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
    supplierId: document.getElementById("fldSupplierId")?.value || "2",
    supplierIdCustom: document.getElementById("fldSupplierIdCustom")?.value || "",
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
  if (draft.supplierId && document.getElementById("fldSupplierId")) {
    document.getElementById("fldSupplierId").value = draft.supplierId;
    const inpCustom = document.getElementById("fldSupplierIdCustom");
    if (inpCustom) {
      inpCustom.style.display = draft.supplierId === "custom" ? "block" : "none";
      if (draft.supplierIdCustom) inpCustom.value = draft.supplierIdCustom;
    }
  }
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
  if (document.getElementById("fldSupplierId")) document.getElementById("fldSupplierId").value = "2";
  if (document.getElementById("fldSupplierIdCustom")) {
    document.getElementById("fldSupplierIdCustom").value = "";
    document.getElementById("fldSupplierIdCustom").style.display = "none";
  }
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

async function migrateOpticsToOptik(interactive = false) {
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

    // Tüm ürünleri çek ve adında dürbün / durbun / scope / red dot / lazer geçen ama kategorisi tufek olanları tespit et
    const res = await fetch(`${cfg.supabaseUrl}/rest/v1/products?select=id,name_tr,category,requires_license`, {
      headers: {
        apikey: cfg.supabaseKey,
        Authorization: `Bearer ${cfg.supabaseKey}`,
      },
    });

    if (!res.ok) return;
    const products = await res.json();
    if (!Array.isArray(products)) return;

    const opticsToFix = products.filter((p) => {
      const name = (p.name_tr || "").toLowerCase();
      const id = (p.id || "").toLowerCase();
      const isOpticName =
        name.includes("dürbün") ||
        name.includes("durbun") ||
        name.includes("scope") ||
        name.includes("red dot") ||
        name.includes("reddot") ||
        name.includes("termal") ||
        name.includes("boresighter") ||
        name.includes("lazer") ||
        name.includes("laser") ||
        name.includes("monoküler") ||
        name.includes("monokuler") ||
        id.includes("durbun") ||
        id.includes("optik");

      return isOpticName && (p.category !== "optik" || p.requires_license === true);
    });

    if (opticsToFix.length === 0) {
      if (interactive) showStatus("✅ Yanlış kategorilenmiş dürbün ürünü bulunamadı (Hepsi güncel).", "success");
      return;
    }

    let updatedCount = 0;
    for (const prod of opticsToFix) {
      const patchRes = await fetch(`${cfg.supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(prod.id)}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ category: "optik", requires_license: false }),
      });
      if (patchRes.ok) updatedCount++;
    }

    if (interactive) {
      showStatus(`✅ Toplam ${updatedCount} adet dürbün ürünü 'Optik & Dürbün' kategorisine taşındı ve ruhsat kaldırıldı!`, "success");
    }
  } catch (err) {
    console.error("Migrate optics error:", err);
    if (interactive) {
      showStatus("❌ Dürbün taşıma hatası: " + err.message, "error");
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
        primaryItem.category &&
        primaryItem.category.startsWith("tufek") &&
        primaryItem.category !== "tufek-aksesuar" &&
        primaryItem.category !== "tufek-bakim" &&
        !primaryItem.category.startsWith("aksesuar") &&
        !primaryItem.category.startsWith("havali") &&
        !primaryItem.category.startsWith("kurusiki") &&
        primaryItem.category !== "optik" &&
        primaryItem.requires_license === true;
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
    const batchSupplierVal = document.getElementById("fldBatchSupplierId")?.value || "auto";
    const batchSupplierCustom = document.getElementById("fldBatchSupplierIdCustom")?.value || "";

    if (batchSupplierVal !== "auto") {
      const dispSup = batchSupplierVal === "custom" ? (batchSupplierCustom || "Özel") : batchSupplierVal;
      appendBatchLog(`🏢 Tedarikçi Seçimi: TÜM ÜRÜNLER tedarikçi ID ${dispSup} olarak atanacak.`, "info");
    } else {
      appendBatchLog("✨ Tedarikçi Seçimi: Otomatik Algılama devrede (Castello / Arslan Silah = 1, Özler Av = 2).", "info");
    }

    // Eğer kategori manuel seçilmişse istisnasız uygula, değilse liste linkinden veya ürün başlığından otomatik çıkar
    if (batchCategory !== "auto") {
      const isFirearmCat =
        batchCategory.startsWith("tufek") &&
        !batchCategory.startsWith("aksesuar") &&
        batchCategory !== "tufek-aksesuar" &&
        batchCategory !== "tufek-bakim" &&
        !batchCategory.startsWith("havali") &&
        !batchCategory.startsWith("kurusiki");

      rawProducts.forEach((p) => {
        p.category = batchCategory;
        p.requires_license = isFirearmCat;
      });
      appendBatchLog(`🎯 Kullanıcı Seçimi: TÜM ÜRÜNLER istisnasız '${batchCategory}' kategorisine atanıyor. (Ruhsat: ${isFirearmCat ? "Gerektirir" : "Gerekmez"})`, "success");
    } else {
      // Liste linki veya geçerli sekme URL'sinden otomatik kategori tespiti
      const activeUrl = (document.getElementById("fldBatchUrl")?.value || tab?.url || targetTab?.url || "").toLowerCase();
      let autoDetectedCat = null;
      if (
        activeUrl.includes("durbun") ||
        activeUrl.includes("optik") ||
        activeUrl.includes("scope") ||
        activeUrl.includes("red-dot")
      ) {
        autoDetectedCat = "optik";
      }
      else if (
        activeUrl.includes("av-taktik-aksesuar") ||
        activeUrl.includes("taktik-aksesuarlari") ||
        activeUrl.includes("av-aksesuarlari") ||
        activeUrl.includes("k-237") ||
        activeUrl.includes("k-238") ||
        activeUrl.includes("k-239")
      ) {
        autoDetectedCat = "tufek-aksesuar";
      }
      else if (activeUrl.includes("havali-tabanca")) autoDetectedCat = "havali-tabanca";
      else if (activeUrl.includes("havali-tufek")) autoDetectedCat = "havali-tufek";
      else if (activeUrl.includes("kurusiki")) autoDetectedCat = "kurusiki-tabanca";
      else if (activeUrl.includes("havali") || activeUrl.includes("airgun")) autoDetectedCat = "havali-kurusiki";
      else if (activeUrl.includes("bakim") || activeUrl.includes("temizleme") || activeUrl.includes("harbi")) autoDetectedCat = "tufek-bakim";
      else if (activeUrl.includes("cadir-aksesuarlari")) autoDetectedCat = "kamp-cadir-aksesuari";
      else if (activeUrl.includes("cadir-k-") || activeUrl.includes("cadir")) autoDetectedCat = "kamp-cadir";
      else if (activeUrl.includes("uyku-tulumu")) autoDetectedCat = "kamp-uyku-tulumu";
      else if (activeUrl.includes("mat-k-") || activeUrl.includes("mat-")) autoDetectedCat = "kamp-mat";
      else if (activeUrl.includes("giyim") || activeUrl.includes("pantolon") || activeUrl.includes("mont") || activeUrl.includes("yelek") || activeUrl.includes("bot") || activeUrl.includes("ayakkabi")) autoDetectedCat = "giyim";
      else if (activeUrl.includes("bicak") || activeUrl.includes("caki") || activeUrl.includes("balta")) autoDetectedCat = "bicak";
      else if (activeUrl.includes("fisek") || activeUrl.includes("muhimmat")) autoDetectedCat = "muhimmat";
      else if (activeUrl.includes("kamp") || activeUrl.includes("balik")) autoDetectedCat = "kamp";
      else if (activeUrl.includes("yari-otomatik")) autoDetectedCat = "tufek-yari-otomatik";
      else if (activeUrl.includes("pompali")) autoDetectedCat = "tufek-pompali";
      else if (activeUrl.includes("sarjorlu")) autoDetectedCat = "tufek-sarjorlu";
      else if (activeUrl.includes("bullpup")) autoDetectedCat = "tufek-bullpup";
      else if (activeUrl.includes("superpoze")) autoDetectedCat = "tufek-superpoze";
      else if (activeUrl.includes("cifte")) autoDetectedCat = "tufek-cifte";
      else if (activeUrl.includes("tek-kirma")) autoDetectedCat = "tufek-tek-kirma";

      if (autoDetectedCat) {
        rawProducts.forEach((p) => {
          p.category = autoDetectedCat;
          p.requires_license = autoDetectedCat.startsWith("tufek") && autoDetectedCat !== "tufek-aksesuar" && autoDetectedCat !== "tufek-bakim" && !autoDetectedCat.startsWith("havali");
        });
        appendBatchLog(`🤖 Tedarikçi liste linkinden kategori otomatik algılandı: ${autoDetectedCat}`, "info");
      } else {
        // Her ürünün başlığından akıllı kategori tayini (Dürbünler, Aksesuarlar, Giyim ve Kamp tayin edilir)
        rawProducts.forEach((p) => {
          const titleLower = (p.title || "").toLowerCase();

          const isAccessory =
            (p.category && (p.category.startsWith("aksesuar") || p.category === "tufek-aksesuar")) ||
            activeUrl.includes("taktik-aksesuar") ||
            titleLower.includes("aparati") ||
            titleLower.includes("aparatı") ||
            titleLower.includes("montaj rayı") ||
            titleLower.includes("montaj rayi") ||
            titleLower.includes("dönüştürücü ray") ||
            titleLower.includes("donusturucu ray") ||
            titleLower.includes("dürbün ayağı") ||
            titleLower.includes("durbun ayagi") ||
            titleLower.includes("yükseltici") ||
            titleLower.includes("yukseltici") ||
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
            titleLower.includes("kulaklık") ||
            titleLower.includes("kulaklik") ||
            titleLower.includes("picatinny");

          const isBakim =
            (p.category && p.category === "tufek-bakim") ||
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
            titleLower.includes("gun cleaner");

          const isAirgun =
            (p.category && (p.category.startsWith("havali") || p.category.startsWith("kurusiki"))) ||
            titleLower.includes("havalı tabanca") ||
            titleLower.includes("havali tabanca") ||
            titleLower.includes("havalı tüfek") ||
            titleLower.includes("havali tufek") ||
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
            activeUrl.includes("havali") ||
            activeUrl.includes("kurusiki");

          const isOptic =
            !isAccessory &&
            !isBakim &&
            !isAirgun && (
              titleLower.includes("dürbün") ||
              titleLower.includes("durbun") ||
              titleLower.includes("scope") ||
              titleLower.includes("red dot") ||
              titleLower.includes("reddot") ||
              titleLower.includes("red-dot") ||
              titleLower.includes("termal") ||
              titleLower.includes("gece görüş") ||
              titleLower.includes("gece gorus") ||
              titleLower.includes("boresighter") ||
              titleLower.includes("sıfırlama lazeri") ||
              titleLower.includes("sifirlama lazeri") ||
              titleLower.includes("monoküler") ||
              titleLower.includes("monokuler") ||
              activeUrl.includes("durbun") ||
              activeUrl.includes("optik")
            );

          const isClothing =
            !isAccessory && !isBakim && !isAirgun && !isOptic && (
              titleLower.includes("pantolon") ||
              titleLower.includes("mont") ||
              titleLower.includes("yelek") ||
              titleLower.includes("polar") ||
              titleLower.includes("gömlek") ||
              titleLower.includes("gomlek") ||
              titleLower.includes("t-shirt") ||
              titleLower.includes("tişört") ||
              titleLower.includes("tisort") ||
              titleLower.includes("bot") ||
              titleLower.includes("ayakkabı") ||
              titleLower.includes("ayakkabi") ||
              titleLower.includes("çorap") ||
              titleLower.includes("corap") ||
              titleLower.includes("eldiven") ||
              titleLower.includes("şapka") ||
              titleLower.includes("sapka") ||
              titleLower.includes("bere") ||
              titleLower.includes("yağmurluk") ||
              titleLower.includes("yagmurluk") ||
              titleLower.includes("termal") ||
              titleLower.includes("giyim")
            );

          const isCamping =
            !isAccessory && !isBakim && !isAirgun && !isOptic && !isClothing && (
              titleLower.includes("uyku tulumu") ||
              titleLower.includes("tulum") ||
              titleLower.includes("çadır") ||
              titleLower.includes("cadir") ||
              titleLower.includes("mat ") ||
              titleLower.includes("matı") ||
              titleLower.includes("hamak") ||
              titleLower.includes("termos") ||
              titleLower.includes("ocak") ||
              titleLower.includes("kamp") ||
              titleLower.includes("balık") ||
              titleLower.includes("balik")
            );

          const isKnife =
            !isAccessory && !isBakim && !isAirgun && !isOptic && !isClothing && !isCamping && (
              titleLower.includes("bıçak") ||
              titleLower.includes("bicak") ||
              titleLower.includes("çakı") ||
              titleLower.includes("caki") ||
              titleLower.includes("balta") ||
              titleLower.includes("pala") ||
              titleLower.includes("kama")
            );

          if (isAirgun) {
            p.requires_license = false;
            if ((titleLower.includes("tabanca") || titleLower.includes("pistol")) && !titleLower.includes("tüfek") && !titleLower.includes("tufek")) {
              if (titleLower.includes("kurusıkı") || titleLower.includes("kurusiki") || titleLower.includes("ses tabanca")) {
                p.category = "kurusiki-tabanca";
              } else {
                p.category = "havali-tabanca";
              }
            } else if (titleLower.includes("tüfek") || titleLower.includes("tufek") || titleLower.includes("rifle")) {
              p.category = "havali-tufek";
            } else if (titleLower.includes("pellet") || titleLower.includes("saçma") || titleLower.includes("sacma") || titleLower.includes("co2")) {
              p.category = "havali-muhimmat";
            } else {
              p.category = "havali-kurusiki";
            }
          } else if (isOptic) {
            p.requires_license = false;
            p.category = "optik";
          } else if (isBakim) {
            p.requires_license = false;
            p.category = "tufek-bakim";
          } else if (isAccessory) {
            p.requires_license = false;
            p.category = "tufek-aksesuar";
          } else if (isClothing) {
            p.requires_license = false;
            p.category = "giyim";
          } else if (isCamping) {
            p.requires_license = false;
            if (titleLower.includes("uyku tulumu") || titleLower.includes("tulum")) p.category = "kamp-uyku-tulumu";
            else if (titleLower.includes("çadır") || titleLower.includes("cadir")) p.category = "kamp-cadir";
            else if (titleLower.includes("mat")) p.category = "kamp-mat";
            else p.category = "kamp";
          } else if (isKnife) {
            p.requires_license = false;
            p.category = "bicak";
          }
        });
        appendBatchLog("🤖 Kategori her ürünün başlığından otomatik belirlendi.", "info");
      }
    }

    let finalProducts = [];
    if (groupVariants) {
      appendBatchLog("⚡ Varyant Birleştirme AÇIK: Renk ve model varyantları akıllı olarak analiz ediliyor...", "info");
      finalProducts = groupProductsByVariant(rawProducts, { useSupplierDesc });
      appendBatchLog(`✨ Analiz tamamlandı: ${rawProducts.length} linkten ${finalProducts.length} adet tekil/zengin ürün oluşturuldu.`, "success");
    } else {
      appendBatchLog(`📦 Varyant Birleştirme KAPALI: ${rawProducts.length} linkin tamamı (birebir) ayrı ayrı ürün olarak hazırlanıyor...`, "warn");
      finalProducts = rawProducts.map((p) => ({
        ...p,
        name_tr: p.title,
        description_tr: useSupplierDesc && p.description ? p.description : generateStandardDescription(p, p.specs),
        description_en: useSupplierDesc && p.description ? p.description : generateStandardDescription(p, p.specs),
      }));
      appendBatchLog(`✅ Hazır: Toplam ${finalProducts.length} ürünün tamamı ayrı ayrı yüklenecek.`, "success");
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
      let slug = slugify(nameTr) || `product-${Date.now()}-${j}`;
      if (!groupVariants) {
        const prevWithSameSlug = finalProducts.slice(0, j).filter(prev => (slugify(prev.name_tr || prev.title) === slug));
        if (prevWithSameSlug.length > 0) {
          slug = `${slug}-${prevWithSameSlug.length + 1}`;
        }
      }
      const specs = p.specs_tr || p.specs || {};
      const variants = p.variants || [];
      if (variants.length > 0) {
        specs.variants = variants;
      }

      const brandVal = p.brand || (specs && (specs["Marka"] || specs["Brand"])) || "Hunthink";
      const modelVal = p.model || (specs && (specs["Model"] || specs["Ürün Kodu"] || specs["Stok Kodu"])) || "";
      const chosenCat = batchCategory !== "auto" ? batchCategory : (p.category || "tufek-aksesuar");
      const isFirearm = chosenCat.startsWith("tufek") && chosenCat !== "tufek-aksesuar" && chosenCat !== "tufek-bakim" && !chosenCat.startsWith("aksesuar") && !chosenCat.startsWith("havali") && !chosenCat.startsWith("kurusiki");
      const finalRequiresLicense = isFirearm ? true : (batchCategory !== "auto" ? false : (p.requires_license ?? false));
      const priceVal = finalRequiresLicense ? null : parseTurkishPrice(p.price);
      const inStock = p.in_stock !== false;

      // Supplier ID Hesaplama (Seçilen tedarikçi veya otomatik Castello/Arslan Silah = 1, Özler Av = 2)
      let finalSupplierId = 2;
      if (batchSupplierVal === "custom") {
        const parsed = parseInt(batchSupplierCustom, 10);
        finalSupplierId = isNaN(parsed) ? 2 : parsed;
      } else if (batchSupplierVal !== "auto") {
        finalSupplierId = parseInt(batchSupplierVal, 10) || 2;
      } else {
        // Otomatik algıla
        if (p.supplier_id) {
          finalSupplierId = p.supplier_id;
        } else {
          const uLow = (p.url || "").toLowerCase();
          const nLow = ((nameTr || "") + " " + (brandVal || "")).toLowerCase();
          if (uLow.includes("arslansilah") || nLow.includes("castello")) {
            finalSupplierId = 1;
          } else if (uLow.includes("ozlerav")) {
            finalSupplierId = 2;
          } else {
            finalSupplierId = 2;
          }
        }
      }

      const payload = {
        id: slug,
        slug_tr: slug,
        slug_en: slug + "-en",
        category: chosenCat,
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
        requires_license: finalRequiresLicense,
        in_stock: inStock,
        specs_tr: specs,
        specs_en: specs,
        supplier_id: finalSupplierId,
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

// =========================================================================
// AI Site Çözücü Yardımcı Fonksiyonları (Groq & OpenRouter Entegrasyonu)
// =========================================================================

async function callAiSiteAnalyzer({ engine, groqKey, openRouterKey, pageInfo, customPrompt }) {
  const systemPrompt = `Sen evrensel bir Web Scraper, Veri Analisti ve Çevirmen Uzmanısın. Herhangi bir e-ticaret, B2B veya üretici web sitesi (${pageInfo.domain}) için hem CSS seçicilerini çıkar hem de sayfadaki ürünü kusursuz bir şekilde analiz edip Türkçe'ye çevir.

ÖNEMLİ EVRENSEL KURALLAR:
1. CSS Seçicileri (selectors): Sitedeki diğer ürünlerde de çalışacak en temiz kuralları bul.
2. Kusursuz Ürün Verisi (perfect_product_data): HTML içeriğini OKU. Marka ve modeli ürün başlığında, açıklamasında veya özelliklerinde mantıksal olarak ara. 
   - Başlık (title) her zaman [Marka] + [Model] şeklinde birleştirilmiş tam bir isim olmalıdır. (örn: Eğer sitede başlık sadece "MAGIC" ise ve sayfanın başka bir yerinde veya sitenin kendisinde marka "Sarsılmaz" ise başlık "Sarsılmaz Magic" olmalıdır).
   - Özellikler (specs) İSTİSNASIZ TÜRKÇE olmalıdır. İngilizce olan (örn: "Caliber", "Barrel Length", "Semi Auto") tüm anahtarları ve değerleri Türkçe'ye çevir ("Kalibre", "Namlu Uzunluğu", "Yarı Otomatik"). 
   - Tüm gereksiz boşlukları ve HTML taglerini temizle.
   - Bu "perfect_product_data" objesi, kullanıcının o anki ürünü anında forma aktarabilmesi için kusursuz hazırlanmış bir önizlemedir.

SADECE AŞAĞIDAKİ JSON ŞEMASINI DÖNDÜR:
{
  "domain": "${pageInfo.domain}",
  "selectors": {
    "title": "...",
    "price": null,
    "brand": null,
    "images": "...",
    "image_attr": "src",
    "specs_table": "...",
    "specs_row": "...",
    "specs_key": "...",
    "specs_val": "...",
    "description": "...",
    "listing_link": "..."
  },
  "perfect_product_data": {
    "title": "Marka ve Model Birleştirilmiş Tam Başlık",
    "brand": "Sadece Marka",
    "model": "Sadece Model",
    "price": "15000",
    "specs": {
      "Kalibre": "12 GA",
      "Namlu Uzunluğu": "71 cm"
    },
    "description": "..."
  },
  "notes": "Kısa analiz ve çalışma mantığı notu"
}`;

  let endpoint = "";
  let authHeader = "";
  let candidates = [];
  let extraHeaders = {};

  if (engine === "groq") {
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
    authHeader = `Bearer ${groqKey}`;
    candidates = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];
  } else {
    endpoint = "https://openrouter.ai/api/v1/chat/completions";
    authHeader = `Bearer ${openRouterKey}`;
    candidates = ["nvidia/nemotron-3.5-lightning:free", "google/gemma-4-26b-a4b-it:free"];
    extraHeaders = {
      "HTTP-Referer": "https://gunerav.site",
      "X-Title": "Guner AV Scraper",
    };
  }

  let lastError = null;
  let parsed = null;

  // Başlangıçta 5000 karakter, TPM hatası durumunda 2500 karaktere indirilip otomatik tekrarlanır
  const snippetLengths = [5000, 2500];

  for (const snippetLen of snippetLengths) {
    const snippetToUse = (pageInfo.htmlSnippet || "").slice(0, snippetLen);
    let metaRefTxt = "";
    if (pageInfo.referenceMeta) {
      const ref = pageInfo.referenceMeta;
      metaRefTxt = `\nSAYFA REFERANS BİLGİLERİ (Doğrulama ve Eşleştirme İçin):
- Hedef Ürün Başlığı: "${ref.title || ""}"
- Varsa Marka: "${ref.brand || ""}"
- Varsa Ana Görsel: "${ref.image || ""}"
- Varsa Fiyat: "${ref.price !== null && ref.price !== undefined ? ref.price : "Doğrudan Satış Fiyatı Yok / Katalog"}"
${ref.specsSample && ref.specsSample.length ? "- Örnek Özellikler: " + ref.specsSample.join(", ") : ""}
${pageInfo.suggestedHeadingSelector ? `- Başlık Eleman Adayı: "${pageInfo.suggestedHeadingSelector}"` : ""}\n`;
    }
    const userPrompt = `Domain: ${pageInfo.domain}\nURL: ${pageInfo.url}${metaRefTxt}\n${customPrompt ? "Özel İstek: " + customPrompt + "\n" : ""}HTML İÇERİĞİ:\n${snippetToUse}`;

    for (const modelName of candidates) {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
            ...extraHeaders,
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.1,
            max_tokens: 1000,
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          lastError = new Error(`HTTP ${res.status}: ${errBody}`);
          // Eğer token limiti hatasıysa (413 / TPM), daha küçük snippet ile tekrar dene
          if (res.status === 413 || errBody.includes("TPM") || errBody.includes("too large")) {
            break;
          }
          continue;
        }

        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content || "";
        try {
          parsed = JSON.parse(rawContent);
        } catch (e) {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        }

        if (parsed) break;
      } catch (netErr) {
        lastError = netErr;
      }
    }

    if (parsed) break;
  }

  if (!parsed) {
    throw lastError || new Error("Yapay zekâ yanıtı geçerli JSON formatına dönüştürülemedi.");
  }

  return parsed;
}

function renderSavedRulesList(rules) {
  const container = document.getElementById("savedRulesList");
  if (!container) return;
  const domains = Object.keys(rules || {});
  if (domains.length === 0) {
    container.innerHTML = "<em>Henüz özel kural kaydedilmemiş.</em>";
    return;
  }

  container.innerHTML = "";
  domains.forEach((dom) => {
    const rule = rules[dom];
    const item = document.createElement("div");
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.style.alignItems = "center";
    item.style.padding = "4px 0";
    item.style.borderBottom = "1px solid #1e293b";

    const dateStr = rule.updatedAt ? new Date(rule.updatedAt).toLocaleDateString("tr-TR") : "";
    item.innerHTML = `
      <div style="font-size: 11px;">
        <span style="color:#38bdf8; font-weight:700;">🌐 ${dom}</span>
        ${dateStr ? `<span style="color:#64748b; font-size:9.5px; margin-left:4px;">(${dateStr})</span>` : ""}
      </div>
      <button data-del-domain="${dom}" style="background:none; border:none; color:#f87171; font-size:10px; cursor:pointer; font-weight:bold; padding: 2px 4px;">Sil ✖</button>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll("[data-del-domain]").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const delDom = e.target.dataset.delDomain;
      const { customSiteRules = {} } = await chrome.storage.local.get("customSiteRules");
      delete customSiteRules[delDom];
      await chrome.storage.local.set({ customSiteRules });
      renderSavedRulesList(customSiteRules);
      showStatus(`🗑️ '${delDom}' kuralları silindi.`, "info");
    });
  });
}

