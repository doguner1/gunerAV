"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types/product";

export default function AdminClient() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [editedProducts, setEditedProducts] = useState<Record<string, Partial<Product>>>({});
  const [generatedSql, setGeneratedSql] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: password }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        fetchProducts();
      } else {
        setError(data.error || "Giriş başarısız.");
      }
    } catch (err) {
      setError("Bir hata oluştu.");
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setError("Supabase çevre değişkenleri eksik.");
        return;
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.desc`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        setError("Ürünler çekilemedi.");
      }
    } catch (err) {
      setError("Bağlantı hatası.");
    }
  };

  const handleEdit = (id: string, field: keyof Product, value: any) => {
    setEditedProducts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const generateSql = () => {
    let sql = `-- GÜNER AV - Ürün Güncelleme SQL Kodu\n-- Bu kodu kopyalayıp Supabase SQL Editor'e yapıştırın ve RUN tuşuna basın.\n\n`;
    
    Object.keys(editedProducts).forEach((id) => {
      const changes = editedProducts[id];
      if (Object.keys(changes).length === 0) return;
      
      let setClauses: string[] = [];
      if (changes.price !== undefined) setClauses.push(`price = ${changes.price || 'NULL'}`);
      if (changes.featured !== undefined) setClauses.push(`featured = ${changes.featured}`);
      if (changes.is_hero_spotlight !== undefined) setClauses.push(`is_hero_spotlight = ${changes.is_hero_spotlight}`);
      if (changes.in_stock !== undefined) setClauses.push(`in_stock = ${changes.in_stock}`);
      if (changes.requires_license !== undefined) setClauses.push(`requires_license = ${changes.requires_license}`);
      
      if (setClauses.length > 0) {
        sql += `UPDATE public.products SET ${setClauses.join(", ")} WHERE id = '${id}';\n`;
      }
    });

    if (sql.split("\\n").length <= 4) {
      setGeneratedSql("-- Hiçbir değişiklik yapmadınız.");
    } else {
      setGeneratedSql(sql);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md rounded-2xl bg-neutral-900 p-8 shadow-2xl border border-neutral-800">
          <h1 className="text-2xl font-bold text-white mb-6 text-center text-[#d4af37]">Yönetim Paneli</h1>
          <p className="text-sm text-neutral-400 mb-6 text-center">Analiz (ANALYTICS_SECRET) şifrenizi giriniz.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-black border border-neutral-700 px-4 py-3 text-white focus:border-[#d4af37] focus:outline-none mb-4"
            placeholder="Şifre..."
          />
          {error && <div className="text-red-400 text-sm mb-4 text-center">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#d4af37] px-4 py-3 font-bold text-black hover:bg-[#e5be42] transition-colors"
          >
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-[#d4af37]">Yönetim Paneli & Analiz Merkezi</h1>
        <button onClick={generateSql} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg">
          SQL Kodu Üret (Kaydet)
        </button>
      </div>

      {generatedSql && (
        <div className="mb-8 bg-neutral-900 border border-emerald-500/30 rounded-xl p-4">
          <h3 className="text-emerald-400 font-bold mb-2 flex justify-between">
            <span>Aşağıdaki kodu kopyalayıp Supabase SQL Editor'de çalıştırın:</span>
            <button onClick={() => navigator.clipboard.writeText(generatedSql)} className="text-xs bg-emerald-500/20 px-3 py-1 rounded">Kopyala</button>
          </h3>
          <textarea
            readOnly
            value={generatedSql}
            className="w-full h-40 bg-black text-emerald-300 font-mono text-sm p-4 rounded border border-neutral-800"
          />
        </div>
      )}

      <div className="overflow-x-auto bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/50 text-neutral-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Ürün (TR)</th>
              <th className="px-4 py-3 w-32">Fiyat (TL)</th>
              <th className="px-4 py-3">Stokta</th>
              <th className="px-4 py-3">Öne Çıkan (Vitrin)</th>
              <th className="px-4 py-3 text-[#d4af37]">Amiral Gemisi (Hero)</th>
              <th className="px-4 py-3">Ruhsat Gerekir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {products.map((p) => {
              const current = { ...p, ...(editedProducts[p.id] || {}) };
              return (
                <tr key={p.id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{p.name_tr}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={current.price || ""}
                      onChange={(e) => handleEdit(p.id, "price", parseFloat(e.target.value) || 0)}
                      className="w-full bg-black border border-neutral-700 rounded px-2 py-1 text-white focus:border-[#d4af37] outline-none"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={current.in_stock} onChange={(e) => handleEdit(p.id, "in_stock", e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={current.featured} onChange={(e) => handleEdit(p.id, "featured", e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={current.is_hero_spotlight} onChange={(e) => handleEdit(p.id, "is_hero_spotlight", e.target.checked)} className="w-4 h-4 accent-amber-500" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={current.requires_license} onChange={(e) => handleEdit(p.id, "requires_license", e.target.checked)} className="w-4 h-4 accent-[#d4af37]" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
