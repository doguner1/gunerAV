"use client";

import { useState } from "react";

export default function ImportOzlerAvClient() {
  const [missingUrls, setMissingUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [importCategory, setImportCategory] = useState("diger");

  const scanSitemap = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/import-ozlerav/scan-sitemap");
      const data = await res.json();
      if (data.success) {
        setMissingUrls(data.missingUrls);
        alert(`${data.missingCount} yeni ürün bulundu!`);
      } else {
        alert(data.error || "Tarama başarısız");
      }
    } catch (e: any) {
      alert("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const toggleUrl = (url: string) => {
    const newSet = new Set(selectedUrls);
    if (newSet.has(url)) newSet.delete(url);
    else newSet.add(url);
    setSelectedUrls(newSet);
  };

  const toggleAll = () => {
    if (selectedUrls.size === missingUrls.length) setSelectedUrls(newSet => new Set());
    else setSelectedUrls(new Set(missingUrls));
  };

  const importSelected = async () => {
    if (selectedUrls.size === 0) return;
    setImporting(true);
    let successCount = 0;
    const urls = Array.from(selectedUrls);

    for (const url of urls) {
      try {
        const res = await fetch("/api/admin/import-ozlerav/import-product", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, category: importCategory })
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
          setMissingUrls(prev => prev.filter(u => u !== url));
          setSelectedUrls(prev => {
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        }
      } catch (e) {
        console.error("Failed to import", url);
      }
    }

    setImporting(false);
    alert(`${successCount} ürün başarıyla eklendi!`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">1. Ürünleri Tara (Sitemap)</h2>
        <button
          onClick={scanSitemap}
          disabled={loading || importing}
          className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Taranıyor..." : "Özler Av'ı Tara (Yeni Ürünleri Bul)"}
        </button>
      </div>

      {missingUrls.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">2. Eklenecek Ürünleri Seç</h2>
            <div className="flex gap-4 items-center">
              <select
                value={importCategory}
                onChange={(e) => setImportCategory(e.target.value)}
                className="bg-neutral-800 border-none rounded-lg px-4 py-2 text-white"
              >
                <option value="diger">Kategori: Diğer</option>
                <option value="fisek-av">Fişek - Av</option>
                <option value="fisek-spor">Fişek - Spor</option>
                <option value="tufek-yari-otomatik">Tüfek - Yarı Otomatik</option>
                <option value="tufek-pompali">Tüfek - Pompalı</option>
                <option value="tufek-sarjorlu">Tüfek - Şarjörlü</option>
                <option value="havali-tabanca">Havalı Tabanca</option>
              </select>
              <button
                onClick={importSelected}
                disabled={importing || selectedUrls.size === 0}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {importing ? "Ekleniyor..." : `Seçilenleri Ekle (${selectedUrls.size})`}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <input 
              type="checkbox" 
              checked={selectedUrls.size === missingUrls.length}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-800"
            />
            <span className="text-sm text-neutral-400">Tümünü Seç ({missingUrls.length} ürün)</span>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {missingUrls.map(url => (
              <label key={url} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 cursor-pointer border border-neutral-800 transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedUrls.has(url)}
                  onChange={() => toggleUrl(url)}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-brand-500"
                />
                <span className="text-sm text-neutral-300 truncate" title={url}>
                  {url.replace('https://www.ozlerav.com.tr/', '')}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
