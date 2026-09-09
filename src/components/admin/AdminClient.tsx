"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Product } from "@/types/product";
import {
  Package,
  BarChart3,
  Search,
  Filter,
  Check,
  Copy,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  PhoneCall,
  MessageCircle,
  MapPin,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";

interface AnalyticsEvent {
  received_at: string;
  client_ip: string;
  user_agent: string;
  event: string;
  params: Record<string, any>;
}

export default function AdminClient() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Tabs: 'products' | 'analytics'
  const [activeTab, setActiveTab] = useState<"products" | "analytics">("products");

  // Product Management State
  const [products, setProducts] = useState<Product[]>([]);
  const [editedProducts, setEditedProducts] = useState<Record<string, Partial<Product>>>({});
  const [generatedSql, setGeneratedSql] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyModified, setOnlyModified] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Analytics State
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // 1. Login Handler
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
        fetchProducts(password);
        fetchAnalytics(password);
      } else {
        setError(data.error || "Hatalı şifre. Lütfen Vercel'deki ANALYTICS_SECRET değerinizi giriniz.");
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu.");
    }
    setLoading(false);
  };

  // 2. Fetch Products
  const fetchProducts = async (authKey: string) => {
    try {
      const res = await fetch("/api/admin/products", {
        headers: { "x-admin-key": authKey },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setError(data.error || "Ürün listesi yüklenemedi.");
      }
    } catch {
      setError("Ürünler getirilirken bağlantı hatası oluştu.");
    }
  };

  // 3. Fetch Analytics
  const fetchAnalytics = async (authKey: string) => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/analytics?key=${encodeURIComponent(authKey)}`);
      const data = await res.json();
      if (data.authenticated && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch {
      // ignore
    }
    setLoadingEvents(false);
  };

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
    setProducts([]);
    setEditedProducts({});
    setEvents([]);
  };

  // Handle Edit Field
  const handleEdit = (id: string, field: keyof Product, value: any) => {
    setEditedProducts((prev) => {
      const currentMod = prev[id] || {};
      const nextMod = { ...currentMod, [field]: value };
      return {
        ...prev,
        [id]: nextMod,
      };
    });
  };

  // Generate SQL
  const generateSql = () => {
    const ids = Object.keys(editedProducts);
    if (ids.length === 0) {
      setGeneratedSql("-- Henüz hiçbir üründe değişiklik yapmadınız.");
      return;
    }

    let sql = `-- ==========================================================================\n`;
    sql += `-- GÜNER AV - Otomatik Üretilen Supabase Güncelleme SQL Kodu\n`;
    sql += `-- Tarih: ${new Date().toLocaleString("tr-TR")}\n`;
    sql += `-- Değiştirilen Ürün Sayısı: ${ids.length}\n`;
    sql += `-- Talimat: Bu kodu kopyalayıp Supabase SQL Editor'e yapıştırın ve RUN tuşuna basın.\n`;
    sql += `-- ==========================================================================\n\n`;

    ids.forEach((id) => {
      const changes = editedProducts[id];
      const prod = products.find((p) => p.id === id);
      const name = prod?.name_tr || id;

      const setClauses: string[] = [];
      if (changes.price !== undefined) {
        setClauses.push(`price = ${changes.price === null || changes.price === 0 ? "NULL" : changes.price}`);
      }
      if (changes.discount_percent !== undefined) {
        setClauses.push(`discount_percent = ${changes.discount_percent === null || changes.discount_percent === 0 ? "NULL" : changes.discount_percent}`);
      }
      if (changes.in_stock !== undefined) {
        setClauses.push(`in_stock = ${Boolean(changes.in_stock)}`);
      }
      if (changes.featured !== undefined) {
        setClauses.push(`featured = ${Boolean(changes.featured)}`);
      }
      if (changes.is_hero_spotlight !== undefined) {
        setClauses.push(`is_hero_spotlight = ${Boolean(changes.is_hero_spotlight)}`);
      }
      if (changes.requires_license !== undefined) {
        setClauses.push(`requires_license = ${Boolean(changes.requires_license)}`);
      }

      if (setClauses.length > 0) {
        sql += `-- [${name}]\n`;
        sql += `UPDATE public.products\nSET ${setClauses.join(", ")}\nWHERE id = '${id}';\n\n`;
      }
    });

    setGeneratedSql(sql);
  };

  const handleCopySql = async () => {
    if (!generatedSql) return;
    try {
      await navigator.clipboard.writeText(generatedSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // fallback
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const current = { ...p, ...(editedProducts[p.id] || {}) };
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name_tr || "").toLowerCase().includes(q);
        const matchId = (p.id || "").toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }

      if (categoryFilter !== "all" && p.category !== categoryFilter) {
        return false;
      }

      if (onlyModified && !editedProducts[p.id]) {
        return false;
      }

      if (onlyInStock && !current.in_stock) {
        return false;
      }

      return true;
    });
  }, [products, editedProducts, searchQuery, categoryFilter, onlyModified, onlyInStock]);

  // Analytics Aggregates
  const analyticsSummary = useMemo(() => {
    let whatsappClicks = 0;
    let mapClicks = 0;
    let phoneCalls = 0;
    let productViews = 0;

    events.forEach((ev) => {
      const evName = (ev.event || "").toLowerCase();
      if (evName.includes("whatsapp")) whatsappClicks++;
      else if (evName.includes("direction") || evName.includes("map") || evName.includes("store")) mapClicks++;
      else if (evName.includes("call") || evName.includes("phone")) phoneCalls++;
      else if (evName.includes("product") || evName.includes("view")) productViews++;
    });

    return {
      total: events.length,
      whatsappClicks,
      mapClicks,
      phoneCalls,
      productViews,
    };
  }, [events]);

  const modifiedCount = Object.keys(editedProducts).length;

  // =========================================================================
  // 1. LOGIN SCREEN
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-neutral-900/90 border border-neutral-800 p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] mb-3">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black font-heading tracking-tight text-white">
              GÜNER AV <span className="text-[#d4af37]">PANEL</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1.5">
              Yönetim Paneli & Analiz Merkezi
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                Yönetici Şifresi (ANALYTICS_SECRET)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Vercel şifrenizi giriniz..."
                  autoFocus
                  className="w-full rounded-xl bg-black/80 border border-neutral-700 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#d4af37] focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-heading font-black py-3 px-4 text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? "Giriş Yapılıyor..." : "Güvenli Giriş Yap"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-800/80 text-[11px] text-neutral-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Maksimum Güvenlik Garantisi</span>
            </div>
            <p className="text-neutral-400 text-[10.5px] leading-relaxed">
              Şifreniz tarayıcı önbelleğine (cache), localStorage veya çerezlere ASLA kaydedilmez. Oturum yalnızca bu sayfada RAM belleğinde çalışır.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-6 text-white">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black font-heading uppercase text-white tracking-tight">
              Yönetim Paneli <span className="text-[#d4af37]">& Analiz</span>
            </h1>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Aktif
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Ürün fiyatları, stok, vitrin durumlarını yönetin ve ziyaretçi etkileşimlerini canlı izleyin.
          </p>
        </div>

        {/* Tab Switcher & Logout */}
        <div className="flex items-center gap-3">
          <div className="inline-flex p-1 rounded-xl bg-neutral-900 border border-neutral-800">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "products"
                  ? "bg-[#d4af37] text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Ürünler ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "analytics"
                  ? "bg-[#d4af37] text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Canlı Analiz ({events.length})</span>
            </button>
          </div>

          <button
            onClick={handleLogout}
            title="Güvenli Çıkış"
            className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-red-950/40 hover:border-red-800 text-neutral-300 hover:text-red-400 px-3.5 py-2 text-xs font-bold transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PRODUCT MANAGEMENT & SQL GENERATOR
      ========================================================================= */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Action Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 backdrop-blur-xl">
            {/* Search & Category Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün adı ara..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] outline-none"
                />
              </div>

              {/* Category selector */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:border-[#d4af37] outline-none"
              >
                <option value="all">Tüm Kategoriler ({products.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Toggle Modified Only */}
              <button
                type="button"
                onClick={() => setOnlyModified(!onlyModified)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  onlyModified
                    ? "bg-[#d4af37]/20 border-[#d4af37] text-[#d4af37]"
                    : "bg-black border-neutral-700 text-neutral-400 hover:text-white"
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Sadece Değiştirilenler ({modifiedCount})</span>
              </button>

              {/* Toggle In Stock Only */}
              <button
                type="button"
                onClick={() => setOnlyInStock(!onlyInStock)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                  onlyInStock
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : "bg-black border-neutral-700 text-neutral-400 hover:text-white"
                }`}
              >
                <span>Sadece Stoktakiler</span>
              </button>
            </div>

            {/* SQL Generation CTA Button */}
            <div className="flex items-center gap-3 shrink-0">
              {modifiedCount > 0 && (
                <span className="text-xs text-[#d4af37] font-bold">
                  {modifiedCount} ürün güncellendi
                </span>
              )}
              <button
                onClick={generateSql}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-heading font-black py-2.5 px-6 text-xs uppercase tracking-wider shadow-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                <Sparkles className="h-4 w-4" />
                <span>SQL Kodu Üret (Kaydet)</span>
              </button>
            </div>
          </div>

          {/* Generated SQL Output Container */}
          {generatedSql && (
            <div className="rounded-2xl bg-neutral-900 border border-emerald-500/40 p-5 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-heading font-black text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Supabase İçin Üretilen SQL Kodu
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Bu kodu kopyalayıp <strong>Supabase Dashboard &gt; SQL Editor</strong> alanına yapıştırın ve <strong>RUN</strong> tuşuna basın.
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] hover:bg-amber-400 text-black font-black px-4 py-2 text-xs uppercase tracking-wider shadow-md transition-all self-start sm:self-auto"
                >
                  {copiedSql ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedSql ? "Kopyalandı!" : "📋 SQL Kodunu Kopyala"}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={generatedSql}
                className="w-full h-48 bg-black/90 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-neutral-800 focus:outline-none select-all leading-relaxed"
              />
            </div>
          )}

          {/* Products Table */}
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto max-h-[700px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/80 sticky top-0 z-20 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-3.5">Ürün</th>
                    <th className="px-4 py-3.5 w-32">Fiyat (TL)</th>
                    <th className="px-4 py-3.5 w-24">İndirim (%)</th>
                    <th className="px-4 py-3.5 text-center w-24">Stokta</th>
                    <th className="px-4 py-3.5 text-center w-28">Öne Çıkan</th>
                    <th className="px-4 py-3.5 text-center w-32 text-[#d4af37]">Hero Vitrin</th>
                    <th className="px-4 py-3.5 text-center w-28">Ruhsat Gerekir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredProducts.map((p) => {
                    const isModified = Boolean(editedProducts[p.id]);
                    const current = { ...p, ...(editedProducts[p.id] || {}) };
                    const thumbnail = p.images?.[0] || "/images/products/optics-1.webp";

                    return (
                      <tr
                        key={p.id}
                        className={`transition-colors ${
                          isModified ? "bg-[#d4af37]/10 border-l-4 border-l-[#d4af37]" : "hover:bg-neutral-800/40"
                        }`}
                      >
                        {/* Product Title & Thumbnail */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white border border-neutral-700">
                              <Image
                                src={thumbnail}
                                alt={p.name_tr}
                                fill
                                unoptimized
                                className="object-contain p-1"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate max-w-sm">
                                {p.name_tr}
                              </div>
                              <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                                <span className="uppercase font-mono text-[#d4af37]">{p.category}</span>
                                <span>&bull;</span>
                                <span className="font-mono text-neutral-500 truncate">{p.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price Input */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            <input
                              type="number"
                              value={current.price ?? ""}
                              placeholder="Fiyat Sorun"
                              onChange={(e) =>
                                handleEdit(
                                  p.id,
                                  "price",
                                  e.target.value === "" ? null : parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full bg-black border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#d4af37] outline-none"
                            />
                          </div>
                        </td>

                        {/* Discount Percent Input */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={current.discount_percent ?? ""}
                              placeholder="Yok"
                              onChange={(e) =>
                                handleEdit(
                                  p.id,
                                  "discount_percent",
                                  e.target.value === "" ? null : parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full bg-black border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:border-[#d4af37] outline-none"
                            />
                          </div>
                        </td>

                        {/* In Stock */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(current.in_stock)}
                            onChange={(e) => handleEdit(p.id, "in_stock", e.target.checked)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Featured */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(current.featured)}
                            onChange={(e) => handleEdit(p.id, "featured", e.target.checked)}
                            className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                          />
                        </td>

                        {/* Hero Spotlight */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(current.is_hero_spotlight)}
                            onChange={(e) => handleEdit(p.id, "is_hero_spotlight", e.target.checked)}
                            className="w-4 h-4 accent-amber-400 cursor-pointer"
                          />
                        </td>

                        {/* Requires License */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(current.requires_license)}
                            onChange={(e) => handleEdit(p.id, "requires_license", e.target.checked)}
                            className="w-4 h-4 accent-red-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="p-8 text-center text-neutral-400 text-xs">
                Aramanıza uygun ürün bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: LIVE VISITOR & EVENT ANALYTICS
      ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* WhatsApp */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase">WhatsApp Etkileşimi</span>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-heading text-white mt-3">
                {analyticsSummary.whatsappClicks}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Sipariş & Bilgi Talepleri</p>
            </div>

            {/* Directions / Maps */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase">Harita & Yol Tarifi</span>
                <div className="p-2 rounded-xl bg-[#d4af37]/20 text-[#d4af37]">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-heading text-white mt-3">
                {analyticsSummary.mapClicks}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Mağazaya Yol Tarifi Tıklamaları</p>
            </div>

            {/* Phone Calls */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase">Telefon Aramaları</span>
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <PhoneCall className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-heading text-white mt-3">
                {analyticsSummary.phoneCalls}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Doğrudan Arama Butonu</p>
            </div>

            {/* Product Views */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-400 uppercase">Ürün Görüntülemeleri</span>
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                  <Eye className="h-5 w-5" />
                </div>
              </div>
              <div className="text-3xl font-black font-heading text-white mt-3">
                {analyticsSummary.productViews}
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">Katalog & Detay Sayfa Tıklamaları</p>
            </div>
          </div>

          {/* Events Log Table */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-2xl p-5">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
              <div>
                <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider">
                  Son Kaydedilen Ziyaretçi Hareketleri (En Son {events.length} Olay)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Sitenizdeki tıklamalar ve etkileşimler anlık olarak listelenmektedir.
                </p>
              </div>

              <button
                onClick={() => fetchAnalytics(password)}
                disabled={loadingEvents}
                className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 border border-neutral-700 px-3.5 py-2 text-xs font-bold text-neutral-300 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingEvents ? "animate-spin" : ""}`} />
                <span>Yenile</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 sticky top-0 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="px-4 py-3">Zaman</th>
                    <th className="px-4 py-3">Olay Türü</th>
                    <th className="px-4 py-3">Detaylar</th>
                    <th className="px-4 py-3">Cihaz / Tarayıcı</th>
                    <th className="px-4 py-3">IP Adresi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {events.map((ev, idx) => {
                    const isWa = ev.event.includes("whatsapp");
                    const isCall = ev.event.includes("call");
                    const isMap = ev.event.includes("direction") || ev.event.includes("map");

                    return (
                      <tr key={idx} className="hover:bg-neutral-800/40 transition-colors font-mono">
                        {/* Time */}
                        <td className="px-4 py-3 text-neutral-400 text-[11px] whitespace-nowrap">
                          {new Date(ev.received_at).toLocaleString("tr-TR")}
                        </td>

                        {/* Event Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isWa
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : isCall
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                : isMap
                                ? "bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40"
                                : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                            }`}
                          >
                            {ev.event}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="px-4 py-3 text-white font-sans text-xs">
                          {ev.params?.item_name ? (
                            <span className="font-bold text-[#d4af37]">{ev.params.item_name}</span>
                          ) : ev.params?.label ? (
                            <span>{ev.params.label}</span>
                          ) : (
                            <span className="text-neutral-500 font-mono text-[11px]">
                              {JSON.stringify(ev.params)}
                            </span>
                          )}
                        </td>

                        {/* User Agent */}
                        <td className="px-4 py-3 text-neutral-400 text-[10.5px] truncate max-w-xs font-sans">
                          {ev.user_agent.includes("Mobile") ? "📱 Mobil" : "💻 Masaüstü / PC"}
                          <span className="text-neutral-500 ml-1.5 truncate">({ev.user_agent.slice(0, 40)}...)</span>
                        </td>

                        {/* IP */}
                        <td className="px-4 py-3 text-neutral-400 text-[11px] whitespace-nowrap">
                          {ev.client_ip}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {events.length === 0 && (
                <div className="p-8 text-center text-neutral-400 text-xs">
                  Henüz kaydedilmiş ziyaretçi hareketi bulunmuyor. Ziyaretçiler siteye girip butonlara tıkladıkça burası otomatik dolacaktır.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
