"use client";

import { useState, useMemo, useEffect } from "react";
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
  Download,
  Trash2,
  FileSpreadsheet,
  FileJson,
  AlertTriangle,
  TrendingUp,
  Smartphone,
  Laptop,
  Tablet,
  AlertCircle,
  Database,
  Calendar,
  Clock,
  Route,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  ChevronLeft,
  ZoomIn,
  Tag,
  SlidersHorizontal,
  Users,
  Radio,
  Share2,
  Target,
  Activity,
} from "lucide-react";

interface AnalyticsEvent {
  id?: string;
  received_at: string;
  client_ip: string;
  user_agent: string;
  event: string;
  params: Record<string, any>;
  device_type?: string;
  path?: string;
}

function formatEventDetail(ev: AnalyticsEvent): { title: string; subtitle?: string } {
  const p = ev.params || {};
  const evName = (ev.event || "").toLowerCase();

  if (evName.includes("whatsapp")) {
    const item = p.item_name ? `"${p.item_name}" için ` : "";
    const srcMap: Record<string, string> = {
      floating_button: "Sağ Alt WhatsApp Butonu",
      home_cta_banner: "Ana Sayfa Alt Bilgi Bandı",
      product_detail_main: "Ürün Detay Sayfası",
      product_card_inquire: "Katalog Ürün Kartı",
      contact_page: "İletişim Sayfası",
    };
    const srcText = srcMap[p.source] || p.source || "Web Sitesi";
    return {
      title: `${item}WhatsApp Sipariş / Bilgi Talebi`,
      subtitle: `Kaynak: ${srcText}`,
    };
  }

  if (evName.includes("call") || evName.includes("phone")) {
    const srcMap: Record<string, string> = {
      header_desktop: "Üst Menü (Masaüstü)",
      header_mobile: "Üst Menü (Mobil)",
      hero_tablet_call: "Hero Alanı (Hemen Ara)",
      home_cta_banner: "Ana Sayfa Arama Bandı",
      footer_phone: "Alt Bilgi (Footer)",
      contact_page: "İletişim Sayfası",
    };
    const srcText = srcMap[p.source] || p.source || "Web Sitesi";
    return {
      title: "Telefonla Doğrudan Arama",
      subtitle: `Kaynak: ${srcText}`,
    };
  }

  if (evName.includes("direction") || evName.includes("map")) {
    const srcMap: Record<string, string> = {
      hero_desktop_maps: "Hero Bölümü (Mağazayı Ziyaret Et)",
      hero_tablet_directions: "Hero Alanı (Yol Tarifi Al)",
      hero_spotlight_google_badge: "Hero 5.0 Google Rozeti",
      home_cta_banner_to_contact: "Ana Sayfa Alt Harita Linki",
      footer_google_business: "Alt Bilgi Google İşletmem",
      footer_google_maps: "Alt Bilgi Harita Linki",
      contact_page_directions: "İletişim Sayfası Yol Tarifi",
    };
    const srcText = srcMap[p.source] || p.source || "Google Haritalar";
    return {
      title: "Mağazaya Yol Tarifi & Harita Açıldı",
      subtitle: `Kaynak: ${srcText}`,
    };
  }

  if (evName === "view_item") {
    return {
      title: p.item_name || "Ürün İnceleme",
      subtitle: p.item_category ? `Kategori: ${p.item_category}${p.price ? ` · Fiyat: ${p.price} ₺` : ""}` : undefined,
    };
  }

  if (evName === "click_product_card") {
    return {
      title: p.item_name || "Ürün Kartı Tıklandı",
      subtitle: p.trigger === "title" ? "Ürün Başlığı Tıklandı" : (p.slug ? `Sayfa: /products/${p.slug}` : undefined),
    };
  }

  if (evName === "click_product_card_details") {
    return {
      title: p.item_name || "Ürün Detayı Tıklandı",
      subtitle: "Kart 'Detaylar' Butonu",
    };
  }

  if (evName === "click_hero_spotlight") {
    return {
      title: `Öne Çıkan Ürün: ${p.item_name || "Haftanın Ekipmanı"}`,
      subtitle: p.trigger === "image" ? "Görsele Tıklanarak Girildi" : "İncele Butonu Tıklandı",
    };
  }

  if (evName === "select_category") {
    return {
      title: `Kategori Görüntülendi: ${p.category_name || p.category_id}`,
      subtitle: `Kategori ID: ${p.category_id}`,
    };
  }

  if (evName === "search") {
    return {
      title: `Ürün Araması: "${p.search_term}"`,
      subtitle: `${p.results_count ?? 0} Sonuç Bulundu`,
    };
  }

  if (evName === "product_zoom") {
    return {
      title: `HD Görsel Büyüteç / Yakınlaştırma`,
      subtitle: `${p.item_name || "Ürün"} (${p.zoom_type || "lens"})`,
    };
  }

  if (evName === "select_variant") {
    return {
      title: `Model / Varyant Seçimi: ${p.variant}`,
      subtitle: p.item_name,
    };
  }

  return {
    title: p.item_name || p.label || ev.event,
    subtitle: typeof p === "object" && Object.keys(p).length > 0 ? JSON.stringify(p) : undefined,
  };
}

function parseUserAgent(ua: string, deviceType?: string): { device: string; browser: string } {
  if (!ua || ua === "unknown") {
    return {
      device: deviceType === "mobile" ? "📱 Mobil" : deviceType === "tablet" ? "📲 Tablet" : "💻 Masaüstü",
      browser: "Tarayıcı",
    };
  }

  let device = "💻 Masaüstü";
  if (/iPhone/i.test(ua)) device = "📱 iPhone";
  else if (/iPad/i.test(ua)) device = "📲 iPad";
  else if (/Android/i.test(ua)) device = /Mobile/i.test(ua) ? "📱 Android" : "📲 Android Tablet";
  else if (/Macintosh/i.test(ua)) device = "💻 macOS";
  else if (/Windows/i.test(ua)) device = "💻 Windows";
  else if (/Linux/i.test(ua)) device = "💻 Linux";

  // iPadOS Safari often sends Macintosh user agent with touch points!
  if (deviceType === "tablet") {
    if (device === "💻 macOS" || device === "💻 Masaüstü") {
      device = "📲 iPad / Tablet";
    }
  } else if (deviceType === "mobile" && (device === "💻 macOS" || device === "💻 Masaüstü")) {
    device = "📱 Mobil";
  }

  let browser = "Tarayıcı";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/OPR|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";

  return { device, browser };
}

function formatSecondsAgo(isoString: string): string {
  try {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (diff < 5) return "Az önce";
    if (diff < 60) return `${diff} sn önce`;
    return `${Math.floor(diff / 60)} dk önce`;
  } catch {
    return "Az önce";
  }
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
  const [deletedProducts, setDeletedProducts] = useState<Set<string>>(new Set());

  const toggleDelete = (id: string) => {
    setDeletedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const [generatedSql, setGeneratedSql] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyModified, setOnlyModified] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [priceFilter, setPriceFilter] = useState<"all" | "with_price" | "no_price">("all");
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewImageIdx, setPreviewImageIdx] = useState(0);

  // Analytics & Dashboard State
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [timeRange, setTimeRange] = useState<"all" | "today" | "7d" | "30d">("all");
  const [analyticsProductFilter, setAnalyticsProductFilter] = useState("");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const [dashboardData, setDashboardData] = useState<{
    dataSource: "supabase" | "fallback_disk";
    range: string;
    supabaseStatus?: {
      connected: boolean;
      isConfigured: boolean;
      missingEnv: string[];
      tableRowCount: number;
      storageType: string;
    };
    summary: {
      totalEvents: number;
      uniqueVisitors: number;
      totalPageViews: number;
      whatsappLeads: number;
      phoneCalls: number;
      locationClicks: number;
      searches: number;
      zooms: number;
      totalCatalogProducts?: number;
    };
    topProducts: Array<{
      productId: string;
      productName: string;
      slug: string;
      views: number;
      zooms: number;
      whatsappClicks: number;
      avgDurationSeconds?: number;
      hasAnomaly?: boolean;
      conversionRate: string;
    }>;
    sessions?: Array<{
      sessionId: string;
      visitorId: string;
      deviceType: string;
      clientIp: string;
      startTime: string;
      endTime: string;
      durationFormatted: string;
      totalDurationSeconds: number;
      hasWhatsAppLead: boolean;
      stepCount: number;
      visitCount?: number;
      steps: Array<{
        time: string;
        timestamp: string;
        eventType: string;
        description: string;
        badge: { text: string; color: "green" | "blue" | "purple" | "amber" | "gray" | "red" };
        isSeparator?: boolean;
      }>;
    }>;
    searchTerms: Array<{
      term: string;
      count: number;
      zeroResultCount: number;
      lastSearched: string;
    }>;
    missedDemand: Array<{
      term: string;
      count: number;
      zeroResultCount: number;
      lastSearched: string;
    }>;
    deviceBreakdown: {
      mobile: { count: number; percent: number };
      tablet: { count: number; percent: number };
      desktop: { count: number; percent: number };
    };
    visitorLoyalty?: {
      newCount: number;
      newPercent: number;
      returningCount: number;
      returningPercent: number;
      totalTracked: number;
    };
    trafficSources?: Array<{
      channel: string;
      visits: number;
      percent: number;
      whatsappLeads: number;
      conversionRate: string;
    }>;
    conversionFunnel?: Array<{
      step: string;
      description: string;
      count: number;
      percent: number;
      dropRate: string;
    }>;
    recentEvents: AnalyticsEvent[];
  } | null>(null);

  // Real-time active visitors state & polling
  const [activeVisitors, setActiveVisitors] = useState<
    Array<{
      visitor_id: string;
      path: string;
      device_type: string;
      product_name?: string;
      last_seen: string;
    }>
  >([]);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [showActiveVisitorsTable, setShowActiveVisitorsTable] = useState<boolean>(false);
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [revalidateMsg, setRevalidateMsg] = useState<string | null>(null);

  // Active visitors live polling (every 6s)
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "analytics") return;

    let isMounted = true;
    const fetchActive = async () => {
      try {
        const headers: Record<string, string> = {};
        if (password) headers["x-admin-key"] = password;
        const res = await fetch("/api/admin/active-visitors", { headers });
        const data = await res.json();
        if (isMounted && data.success) {
          setActiveCount(data.count ?? 0);
          setActiveVisitors(data.activeVisitors || []);
        }
      } catch {}
    };

    fetchActive();
    const interval = setInterval(fetchActive, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, activeTab, password]);

  // Restore admin session if already logged in within the browser session via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (isMounted && data.authenticated) {
          setIsAuthenticated(true);
          fetchProducts();
          fetchAnalytics(undefined, "all");
        }
      } catch {}
    };
    checkSession();
    return () => {
      isMounted = false;
    };
  }, []);

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
        const currentPassword = password;
        setPassword(""); // Şifreyi hemen bellekten temizle
        fetchProducts(currentPassword);
        fetchAnalytics(currentPassword, "all");
      } else {
        setError(data.error || "Hatalı şifre. Lütfen Vercel'deki ANALYTICS_SECRET değerinizi giriniz.");
      }
    } catch {
      setError("Sunucuya bağlanırken bir hata oluştu.");
    }
    setLoading(false);
  };

  // 2. Fetch Products
  const fetchProducts = async (authKey?: string) => {
    try {
      const headers: Record<string, string> = {};
      const key = authKey || password;
      if (key) headers["x-admin-key"] = key;
      const res = await fetch("/api/admin/products", { headers });
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

  // 3. Fetch Analytics & Aggregated Dashboard
  const fetchAnalytics = async (authKey?: string, range: "all" | "today" | "7d" | "30d" = timeRange) => {
    setLoadingEvents(true);
    try {
      const key = authKey || password;
      const headers: Record<string, string> = {};
      if (key) headers["x-admin-key"] = key;
      const res = await fetch(`/api/admin/dashboard?range=${range}`, { headers });
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
        if (Array.isArray(data.sessions) && data.sessions.length > 0) {
          setExpandedSessions((prev) => {
            if (prev.size === 0) {
              return new Set([data.sessions[0].sessionId]);
            }
            return prev;
          });
        }
        if (Array.isArray(data.recentEvents)) {
          setEvents(data.recentEvents);
        }
      } else {
        // Fallback
        const legacyRes = await fetch("/api/analytics", { headers });
        const legacyData = await legacyRes.json();
        if (legacyData.authenticated && Array.isArray(legacyData.events)) {
          setEvents(legacyData.events);
        }
      }
    } catch {
      // ignore
    }
    setLoadingEvents(false);
  };

  // Change time range filter
  const handleRangeChange = (newRange: "all" | "today" | "7d" | "30d") => {
    setTimeRange(newRange);
    fetchAnalytics(password, newRange);
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {}
    setIsAuthenticated(false);
    setPassword("");
    setProducts([]);
    setEditedProducts({});
    setEvents([]);
    setDashboardData(null);
  };

  // On-demand Site & Cache Revalidation
  const handleRevalidateSite = async () => {
    setIsRevalidating(true);
    setRevalidateMsg(null);
    try {
      const res = await fetch("/api/revalidate?secret=gunerav_revalidate_secret_2026");
      const data = await res.json();
      if (data.success) {
        setRevalidateMsg("✓ Site önbelleği başarıyla temizlendi, ürünler anında yayında!");
        setTimeout(() => setRevalidateMsg(null), 5000);
        await fetchProducts(password);
      } else {
        setRevalidateMsg("Hata: " + (data.error || "Önbellek yenilenemedi"));
      }
    } catch {
      setRevalidateMsg("Bağlantı hatası oluştu.");
    } finally {
      setIsRevalidating(false);
    }
  };

  // Export Analytics as Excel/Sheets-compatible CSV (UTF-8 BOM)
  const handleExportCsv = () => {
    if (events.length === 0) return;
    const headers = ["Zaman", "Olay Türü", "Detay", "Cihaz", "Tarayıcı", "IP Adresi", "Sayfa"];
    const rows = events.map((ev) => {
      const detail = formatEventDetail(ev);
      const uaInfo = parseUserAgent(ev.user_agent, ev.device_type);
      return [
        `"${new Date(ev.received_at).toLocaleString("tr-TR").replace(/"/g, '""')}"`,
        `"${ev.event.replace(/"/g, '""')}"`,
        `"${(detail.title + (detail.subtitle ? ` (${detail.subtitle})` : "")).replace(/"/g, '""')}"`,
        `"${uaInfo.device.replace(/"/g, '""')}"`,
        `"${uaInfo.browser.replace(/"/g, '""')}"`,
        `"${(ev.client_ip || "").replace(/"/g, '""')}"`,
        `"${(ev.path || ev.params?.path || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `gunerav-ziyaretci-raporu-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Analytics as JSON Backup
  const handleExportJson = () => {
    if (events.length === 0) return;
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `gunerav-analiz-yedek-${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear Analytics with Confirmation
  const handleClearLogs = async () => {
    const confirmClear = window.confirm(
      "⚠️ DİKKAT: Kayıtlı tüm ziyaretçi hareketleri kalıcı olarak sıfırlanacaktır.\n\nEmin misiniz?"
    );
    if (!confirmClear) return;

    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/analytics?action=clear`, {
        method: "POST",
        headers: { "x-admin-key": password },
      });
      const data = await res.json();
      if (data.success) {
        setEvents([]);
        setDashboardData(null);
      }
    } catch {
      // ignore
    }
    setLoadingEvents(false);
  };

  // Handle Edit Field
  const handleEdit = (id: string, field: keyof Product, value: any) => {
    setEditedProducts((prev) => {
      let nextState = { ...prev };

      // Eğer bir ürün Hero Vitrin (is_hero_spotlight) yapılıyorsa,
      // diğer tüm ürünlerde is_hero_spotlight otomatik olarak kaldırılır (tekil vitrin kuralı)
      if (field === "is_hero_spotlight" && value === true) {
        products.forEach((p) => {
          if (p.id !== id && (p.is_hero_spotlight || nextState[p.id]?.is_hero_spotlight)) {
            nextState[p.id] = { ...(nextState[p.id] || {}), is_hero_spotlight: false };
          }
        });
      }

      const currentMod = nextState[id] || {};
      nextState[id] = { ...currentMod, [field]: value };
      return nextState;
    });
  };

  // Generate SQL
  const generateSql = () => {
    const editIds = Object.keys(editedProducts);
    const deleteIds = Array.from(deletedProducts);
    if (editIds.length === 0 && deleteIds.length === 0) {
      setGeneratedSql("-- Henüz hiçbir üründe değişiklik yapmadınız.");
      return;
    }

    let sql = `-- ==========================================================================\n`;
    sql += `-- GÜNER AV - Otomatik Üretilen Supabase Güncelleme SQL Kodu\n`;
    sql += `-- Tarih: ${new Date().toLocaleString("tr-TR")}\n`;
    sql += `-- Değiştirilen (Güncelleme): ${editIds.length} | Silinecek: ${deleteIds.length}\n`;
    sql += `-- Talimat: Bu kodu kopyalayıp Supabase SQL Editor'e yapıştırın ve RUN tuşuna basın.\n`;
    sql += `-- ==========================================================================\n\n`;

    // 1. Önce silinecek ürünler
    if (deleteIds.length > 0) {
      sql += `-- SİLİNECEK ÜRÜNLER (DELETE)\n`;
      deleteIds.forEach((id) => {
        const prod = products.find((p) => p.id === id);
        sql += `-- [${prod?.name_tr || id}] siliniyor\n`;
        sql += `DELETE FROM public.products WHERE id = '${id}';\n\n`;
      });
    }

    // 2. Sonra güncellenecek ürünler
    if (editIds.length > 0) {
      sql += `-- GÜNCELLENECEK ÜRÜNLER (UPDATE)\n`;
    }
    editIds.forEach((id) => {
      // Eğer hem güncellenip hem silinmişse, sadece silinsin.
      if (deletedProducts.has(id)) return;
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

      if (onlyModified && !editedProducts[p.id] && !deletedProducts.has(p.id)) {
        return false;
      }

      if (onlyInStock && !current.in_stock) {
        return false;
      }

      if (priceFilter === "with_price" && (!current.price || current.price <= 0)) {
        return false;
      }

      if (priceFilter === "no_price" && (current.price && current.price > 0)) {
        return false;
      }

      return true;
    });
  }, [products, editedProducts, searchQuery, categoryFilter, onlyModified, onlyInStock, priceFilter]);

  // Products Quick Stats
  const productsStats = useMemo(() => {
    let inStock = 0;
    let withPrice = 0;
    let withoutPrice = 0;
    let licensed = 0;

    products.forEach((p) => {
      const cur = { ...p, ...(editedProducts[p.id] || {}) };
      if (deletedProducts.has(p.id)) return;
      if (cur.in_stock) inStock++;
      if (cur.price && cur.price > 0) withPrice++;
      else withoutPrice++;
      if (cur.requires_license) licensed++;
    });

    return { inStock, withPrice, withoutPrice, licensed };
  }, [products, editedProducts, deletedProducts]);

  // Analytics Aggregates
  const analyticsSummary = useMemo(() => {
    let whatsappClicks = 0;
    let mapClicks = 0;
    let phoneCalls = 0;
    let productViews = 0;
    let searches = 0;

    events.forEach((ev) => {
      const evName = (ev.event || "").toLowerCase();
      if (evName.includes("whatsapp")) whatsappClicks++;
      else if (evName.includes("direction") || evName.includes("map") || evName.includes("store")) mapClicks++;
      else if (evName.includes("call") || evName.includes("phone")) phoneCalls++;
      else if (evName.includes("search")) searches++;
      else if (evName.includes("product") || evName.includes("view")) productViews++;
    });

    return {
      total: events.length,
      whatsappClicks,
      mapClicks,
      phoneCalls,
      productViews,
      searches,
    };
  }, [events]);

  const modifiedCount = Object.keys(editedProducts).length + deletedProducts.size;

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
              Şifreniz asla saklanmaz. Oturumunuz şifrelenmiş, güvenli ve yalnızca sunucu tarafından okunabilen HttpOnly çerez ile korunur.
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

          {/* On-demand Cache & Site Revalidate Button */}
          <button
            onClick={handleRevalidateSite}
            disabled={isRevalidating}
            title="Supabase'deki ürün değişikliklerini anında yayına alır ve önbelleği temizler"
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-[#d4af37] px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRevalidating ? "animate-spin text-[#d4af37]" : ""}`} />
            <span className="hidden sm:inline">{isRevalidating ? "Yenileniyor..." : "Siteyi Yenile"}</span>
          </button>

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

      {/* Revalidation Toast Notice */}
      {revalidateMsg && (
        <div
          className={`mb-6 p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
            revalidateMsg.startsWith("✓")
              ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-lg"
              : "bg-red-950/70 border-red-500/50 text-red-300 shadow-lg"
          }`}
        >
          <span>{revalidateMsg}</span>
          <button onClick={() => setRevalidateMsg(null)} className="text-white/60 hover:text-white ml-3">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: PRODUCT MANAGEMENT & SQL GENERATOR
      ========================================================================= */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/80 p-3.5 flex items-center justify-between shadow-lg">
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Toplam Ürün</div>
                <div className="text-xl font-heading font-black text-white mt-0.5">{products.length}</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                <Package className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/80 p-3.5 flex items-center justify-between shadow-lg">
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Stokta Olan</div>
                <div className="text-xl font-heading font-black text-emerald-400 mt-0.5">{productsStats.inStock}</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Check className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/80 p-3.5 flex items-center justify-between shadow-lg">
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Fiyatı Olan</div>
                <div className="text-xl font-heading font-black text-amber-400 mt-0.5">{productsStats.withPrice}</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Tag className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/80 p-3.5 flex items-center justify-between shadow-lg">
              <div>
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Fiyatı Belirsiz</div>
                <div className="text-xl font-heading font-black text-neutral-300 mt-0.5">{productsStats.withoutPrice}</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                <PhoneCall className="h-4 w-4" />
              </div>
            </div>

            <div className="rounded-2xl bg-neutral-900/80 border border-neutral-800/80 p-3.5 flex items-center justify-between shadow-lg">
              <div>
                <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Ruhsatlı Tüfek</div>
                <div className="text-xl font-heading font-black text-red-400 mt-0.5">{productsStats.licensed}</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            <div className={`rounded-2xl border p-3.5 flex items-center justify-between shadow-lg transition-all ${modifiedCount > 0 ? 'bg-[#d4af37]/15 border-[#d4af37]/50' : 'bg-neutral-900/80 border-neutral-800/80'}`}>
              <div>
                <div className="text-[10px] uppercase font-bold text-[#d4af37] tracking-wider">Bekleyen İşlem</div>
                <div className="text-xl font-heading font-black text-[#d4af37] mt-0.5">{modifiedCount} işlem</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Action Header & Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 backdrop-blur-xl">
            {/* Search & Category Filters */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search input */}
              <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ürün adı veya model ara..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-black border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:border-[#d4af37] outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category selector */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="py-2 px-3 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:border-[#d4af37] outline-none cursor-pointer"
              >
                <option value="all">Tüm Kategoriler ({products.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Price Filter */}
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value as any)}
                className="py-2 px-3 rounded-xl bg-black border border-neutral-700 text-xs text-white focus:border-[#d4af37] outline-none cursor-pointer"
              >
                <option value="all">Tüm Fiyatlar</option>
                <option value="with_price">💰 Fiyatı Girilenler ({productsStats.withPrice})</option>
                <option value="no_price">📞 Fiyat Sorulanlar ({productsStats.withoutPrice})</option>
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
                <>
                  <span className="text-xs text-[#d4af37] font-bold">
                    {modifiedCount} işlem
                  </span>
                  <button
                    onClick={() => {
                      if(window.confirm("Tüm değişiklikleri sıfırlamak istediğinize emin misiniz?")) {
                        setEditedProducts({});
                        setDeletedProducts(new Set());
                        setGeneratedSql("");
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 text-xs font-bold transition-all"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Sıfırla
                  </button>
                </>
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
                    <th className="px-4 py-3.5 w-36">Fiyat (TL)</th>
                    <th className="px-4 py-3.5 w-24">İndirim (%)</th>
                    <th className="px-4 py-3.5 text-center w-24">Stokta</th>
                    <th className="px-4 py-3.5 text-center w-28">Öne Çıkan</th>
                    <th className="px-4 py-3.5 text-center w-32 text-[#d4af37]">Hero Vitrin</th>
                    <th className="px-4 py-3.5 text-center w-28">Ruhsat Gerekir</th>
                    <th className="px-4 py-3.5 text-center w-16 text-red-500">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {filteredProducts.map((p) => {
                    const isModified = Boolean(editedProducts[p.id]);
                    const isDeleted = deletedProducts.has(p.id);
                    const current = { ...p, ...(editedProducts[p.id] || {}) };
                    const thumbnail = p.images?.[0] || "/images/products/optics-1.webp";

                    let rowClass = "hover:bg-neutral-800/40 transition-colors";
                    if (isDeleted) {
                      rowClass = "bg-red-900/20 border-l-4 border-l-red-500 opacity-60";
                    } else if (isModified) {
                      rowClass = "bg-[#d4af37]/10 border-l-4 border-l-[#d4af37] transition-colors";
                    }

                    return (
                      <tr
                        key={p.id}
                        className={rowClass}
                      >
                        {/* Product Title & Thumbnail */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* Clickable HD Image Zoom Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewProduct(p);
                                setPreviewImageIdx(0);
                              }}
                              title="Resmi ve özellikleri incelemek için tıklayın"
                              className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-white border border-neutral-700 hover:border-[#d4af37] transition-all group shadow-sm hover:scale-105 active:scale-95 focus:outline-none"
                            >
                              <Image
                                src={thumbnail}
                                alt={p.name_tr}
                                fill
                                unoptimized
                                className="object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="h-4 w-4 text-[#d4af37] drop-shadow" />
                              </div>
                            </button>
                            <div className="min-w-0">
                              <div className="font-bold text-white text-xs truncate max-w-sm select-text">
                                {p.name_tr}
                              </div>
                              <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                                <span className="uppercase font-mono text-[#d4af37] font-semibold">{p.category}</span>
                                <span>&bull;</span>
                                <span className="font-mono text-neutral-500 truncate">{p.id}</span>
                                {p.supplier_id ? (
                                  <>
                                    <span>&bull;</span>
                                    <a
                                      href={p.supplier_id === 1 ? "https://arslansilah.com/" : "https://ozlerav.com/"}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="font-mono text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 bg-neutral-800 text-blue-400 hover:text-blue-300 hover:bg-neutral-700 transition-colors"
                                      title="Tedarikçi Sitesine Git"
                                    >
                                      {p.supplier_id === 1 ? "arslansilah" : "ozlerav"}
                                    </a>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price Input */}
                        <td className="px-4 py-3">
                          <div className="relative">
                            <input
                              type="number"
                              disabled={isDeleted}
                              value={current.price ?? ""}
                              placeholder="Sorun (₺ Yok)"
                              onChange={(e) =>
                                handleEdit(
                                  p.id,
                                  "price",
                                  e.target.value === "" ? null : parseFloat(e.target.value) || 0
                                )
                              }
                              className={`w-full bg-black border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#d4af37] outline-none ${isDeleted ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                              value={current.discount_percent ?? ""} disabled={isDeleted}
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
                            checked={Boolean(current.in_stock)} disabled={isDeleted}
                            onChange={(e) => handleEdit(p.id, "in_stock", e.target.checked)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Featured */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(current.featured)} disabled={isDeleted}
                            onChange={(e) => handleEdit(p.id, "featured", e.target.checked)}
                            className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                          />
                        </td>

                        {/* Hero Spotlight */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(current.is_hero_spotlight)} disabled={isDeleted}
                            onChange={(e) => handleEdit(p.id, "is_hero_spotlight", e.target.checked)}
                            className="w-4 h-4 accent-amber-400 cursor-pointer"
                          />
                        </td>

                        {/* Requires License */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={Boolean(current.requires_license)} disabled={isDeleted}
                            onChange={(e) => handleEdit(p.id, "requires_license", e.target.checked)}
                            className="w-4 h-4 accent-red-500 cursor-pointer disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleDelete(p.id)}
                            title={isDeleted ? "Silmeyi İptal Et" : "Ürünü Sil"}
                            className={`p-2 rounded-lg transition-colors ${isDeleted ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-red-500/20 hover:text-red-500'}`}
                          >
                            {isDeleted ? <RefreshCw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          </button>
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
          TAB 2: LIVE VISITOR & EVENT ANALYTICS (DASHBOARD)
      ========================================================================= */}
      {activeTab === "analytics" && (() => {
        const summary = dashboardData?.summary || {
          totalEvents: events.length,
          uniqueVisitors: events.length > 0 ? new Set(events.map(e => e.params?.visitor_id || e.client_ip)).size : 0,
          totalPageViews: analyticsSummary.productViews,
          whatsappLeads: analyticsSummary.whatsappClicks,
          phoneCalls: analyticsSummary.phoneCalls,
          locationClicks: analyticsSummary.mapClicks,
          searches: analyticsSummary.searches,
          zooms: 0,
        };
        const topProducts = dashboardData?.topProducts || [];
        const displayedTopProducts = analyticsProductFilter.trim()
          ? topProducts.filter(
              (p) =>
                (p.productName || "").toLowerCase().includes(analyticsProductFilter.toLowerCase()) ||
                (p.slug || "").toLowerCase().includes(analyticsProductFilter.toLowerCase())
            )
          : topProducts;
        const searchTerms = dashboardData?.searchTerms || [];
        const missedDemand = dashboardData?.missedDemand || [];
        const deviceBreakdown = dashboardData?.deviceBreakdown || {
          mobile: { count: 0, percent: 55 },
          tablet: { count: 0, percent: 15 },
          desktop: { count: 0, percent: 30 },
        };
        const visitorLoyalty = dashboardData?.visitorLoyalty || {
          newCount: 0,
          newPercent: 100,
          returningCount: 0,
          returningPercent: 0,
          totalTracked: 0,
        };
        const trafficSources = dashboardData?.trafficSources || [];
        const conversionFunnel = dashboardData?.conversionFunnel || [
          { step: "1. Site Ziyareti", description: "Siteye giriş yapan tüm ziyaret oturumları", count: summary.uniqueVisitors, percent: 100, dropRate: "0%" },
          { step: "2. Ürün İnceleme", description: "Katalogda en az bir ürün detayına girenler", count: summary.totalPageViews, percent: 0, dropRate: "0%" },
          { step: "3. Derin İnceleme (HD Zoom / 30sn+)", description: "Görseli büyüten veya 30sn+ inceleyenler", count: summary.zooms, percent: 0, dropRate: "0%" },
          { step: "4. WhatsApp Satış Görüşmesi", description: "WhatsApp sipariş butonuna tıklayıp bayiye ulaşanlar", count: summary.whatsappLeads, percent: 0, dropRate: "0%" },
        ];
        const isSupabaseSource = dashboardData?.dataSource === "supabase";

        return (
          <div className="space-y-6">
            {/* Top Toolbar: Date Range Filters & DB Source Status */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 backdrop-blur-xl">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-black font-heading uppercase text-white tracking-wide flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#d4af37]" />
                    <span>Ziyaretçi & Satış Hareketi Analizi</span>
                  </h2>
                  {isSupabaseSource ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                      <Database className="h-3 w-3" />
                      Supabase Kalıcı DB
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                      <Database className="h-3 w-3" />
                      Yerel Disk Yedekleme
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Müşterilerin en çok ilgi gösterdiği ürünler, aramalar ve iletişim dönüşümleri.
                </p>
              </div>

              {/* Controls Toolbar: Date Range + Refresh/Export */}
              <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                {/* Date Range Selector */}
                <div className="flex items-center gap-1.5 bg-black/80 p-1 rounded-xl border border-neutral-800">
                  <Calendar className="h-3.5 w-3.5 text-neutral-400 ml-2 mr-1 hidden sm:inline" />
                  <button
                    type="button"
                    onClick={() => handleRangeChange("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timeRange === "all" ? "bg-[#d4af37] text-black shadow-md font-black" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Tüm Zamanlar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRangeChange("today")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timeRange === "today" ? "bg-[#d4af37] text-black shadow-md font-black" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Bugün
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRangeChange("7d")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timeRange === "7d" ? "bg-[#d4af37] text-black shadow-md font-black" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Son 7 Gün
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRangeChange("30d")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timeRange === "30d" ? "bg-[#d4af37] text-black shadow-md font-black" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Son 30 Gün
                  </button>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fetchAnalytics(password, timeRange)}
                    disabled={loadingEvents}
                    className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 border border-neutral-700 px-3.5 py-2 text-xs font-bold text-neutral-200 transition-colors active:scale-95 shadow-sm cursor-pointer"
                    title="Analiz Verilerini Yenile"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingEvents ? "animate-spin text-[#d4af37]" : "text-[#d4af37]"}`} />
                    <span>Yenile</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    disabled={events.length === 0}
                    className="flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 px-3 py-2 text-xs font-bold text-white transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    title="Excel ve Google E-Tablolar uyumlu CSV formatında indir"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Excel / CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    disabled={events.length === 0}
                    className="flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 px-3 py-2 text-xs font-bold text-white transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    title="Ham JSON formatında tam yedek al"
                  >
                    <FileJson className="h-3.5 w-3.5 text-blue-400" />
                    <span className="hidden sm:inline">JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearLogs}
                    disabled={events.length === 0 || loadingEvents}
                    className="flex items-center gap-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 px-3 py-2 text-xs font-bold text-red-300 transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    title="Tüm logları sıfırla"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    <span className="hidden sm:inline">Sıfırla</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Supabase Diagnostic & Persistence Status Banner */}
            {!isSupabaseSource ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-300">
                      Supabase Kalıcı Veritabanı Henüz Bağlı Değil (Geçici Yerel Disk Modu Aktif)
                    </p>
                    <p className="text-[11px] text-amber-200/80 mt-0.5">
                      Vercel sunucusu yeniden başladığında verilerin sıfırlanmaması için Vercel Dashboard &gt; Settings &gt; Environment Variables bölümüne{" "}
                      <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> ve{" "}
                      <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono">SUPABASE_SERVICE_ROLE_KEY</code> değerlerini ekleyiniz.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2.5">
                <Database className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-bold">Supabase Kalıcı Veritabanı Aktif:</span>
                <span className="text-neutral-300">Tüm ziyaretçi ve ürün hareketleri bulutta kalıcı olarak saklanıyor ({summary.totalEvents} olay).</span>
              </div>
            )}

            {/* Real-time Presence & Live Event Ticker (Şu An Sitede) */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-neutral-900/90 to-black/80 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Active Visitors Count */}
                <div className="flex items-center gap-3">
                  <div className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                        Şu An Sitede (Canlı Ziyaretçi)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                        20sn Heartbeat
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-black font-heading text-white">
                        {activeCount}
                      </span>
                      <span className="text-xs font-semibold text-neutral-300">
                        ziyaretçi şu an web sitenizde geziniyor
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Live Ticker & Toggle Table */}
                <div className="flex flex-wrap items-center gap-3">
                  {events[0] && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-neutral-800 text-xs">
                      <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0" />
                      <span className="text-neutral-400 text-[11px]">Son Canlı Olay:</span>
                      <span className="text-white font-medium truncate max-w-[220px]">
                        {formatEventDetail(events[0]).title}
                      </span>
                      <span className="text-neutral-500 font-mono text-[10px]">
                        ({formatSecondsAgo(events[0].received_at)})
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowActiveVisitorsTable(!showActiveVisitorsTable)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all"
                  >
                    <Radio className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{showActiveVisitorsTable ? "Listeyi Kapat" : `Canlı Ziyaretçileri Gör (${activeVisitors.length})`}</span>
                    {showActiveVisitorsTable ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expandable Active Visitors Table */}
              {showActiveVisitorsTable && (
                <div className="mt-4 pt-4 border-t border-emerald-500/20">
                  <div className="overflow-x-auto max-h-[260px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black/60 sticky top-0 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                        <tr>
                          <th className="px-3 py-2">Ziyaretçi Kimliği</th>
                          <th className="px-3 py-2">Cihaz</th>
                          <th className="px-3 py-2">Bulunduğu Sayfa / İncelediği Ürün</th>
                          <th className="px-3 py-2 text-right">Son Sinyal (Heartbeat)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 font-mono">
                        {activeVisitors.map((v, idx) => (
                          <tr key={v.visitor_id || idx} className="hover:bg-neutral-800/30">
                            <td className="px-3 py-2 font-sans font-medium text-white flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0"></span>
                              <span className="font-mono text-[11px] text-neutral-300">
                                {v.visitor_id ? `${v.visitor_id.slice(0, 10)}...` : "anonim"}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-sans text-neutral-300 text-[11px] capitalize">
                              {v.device_type === "mobile" ? "📱 Mobil" : v.device_type === "tablet" ? "📲 Tablet" : "💻 Masaüstü"}
                            </td>
                            <td className="px-3 py-2 text-neutral-200 truncate max-w-[260px]">
                              {v.product_name ? (
                                <span className="font-bold text-[#d4af37] font-sans">
                                  {v.product_name}
                                </span>
                              ) : (
                                <span className="font-mono text-neutral-400">{v.path || "/"}</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right text-emerald-400 font-mono text-[11px]">
                              {formatSecondsAgo(v.last_seen)}
                            </td>
                          </tr>
                        ))}
                        {activeVisitors.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-6 text-center text-neutral-500 font-sans text-xs">
                              Son 35 saniyede aktif bir ziyaretçi sinyali bulunmuyor. Siteye biri girdiğinde burada anlık görünecektir.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Summary Metric Cards (6 Cards Grid) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. WhatsApp */}
              <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-lg hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">WhatsApp</span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-heading text-white mt-2">
                  {summary.whatsappLeads}
                </div>
                <p className="text-[10px] text-emerald-400/80 mt-1 font-medium">Sipariş & Bilgi Talebi</p>
              </div>

              {/* 2. Directions / Maps */}
              <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-lg hover:border-[#d4af37]/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Harita & Yol</span>
                  <div className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#d4af37]">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-heading text-white mt-2">
                  {summary.locationClicks}
                </div>
                <p className="text-[10px] text-amber-300/80 mt-1 font-medium">Mağaza Ziyareti</p>
              </div>

              {/* 3. Phone Calls */}
              <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-lg hover:border-amber-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Telefon</span>
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <PhoneCall className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-heading text-white mt-2">
                  {summary.phoneCalls}
                </div>
                <p className="text-[10px] text-amber-400/80 mt-1 font-medium">Doğrudan Arama</p>
              </div>

              {/* 4. Product Views */}
              <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-lg hover:border-purple-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Ürün İnceleme</span>
                  <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-heading text-white mt-2">
                  {summary.totalPageViews}
                </div>
                <p className="text-[10px] text-purple-400/80 mt-1 font-medium">Sayfa Görüntüleme</p>
              </div>

              {/* 5. Searches */}
              <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-lg hover:border-blue-500/40 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Aramalar</span>
                  <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                    <Search className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-heading text-white mt-2">
                  {summary.searches}
                </div>
                <p className="text-[10px] text-blue-400/80 mt-1 font-medium">Site İçi Arama</p>
              </div>

              {/* 6. Unique Visitors */}
              <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-lg hover:border-[#d4af37]/60 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Tekil Ziyaretçi</span>
                  <div className="p-1.5 rounded-lg bg-[#d4af37]/20 text-[#d4af37]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-heading text-[#d4af37] mt-2">
                  {summary.uniqueVisitors}
                </div>
                <p className="text-[10px] text-[#d4af37]/80 mt-1 font-medium">Farklı Cihaz / Kullanıcı</p>
              </div>
            </div>

            {/* Device Distribution Bar */}
            <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Cihaz Dağılımı</span>
                </span>
                <div className="flex items-center gap-4 text-xs font-medium text-neutral-400">
                  <span className="flex items-center gap-1.5 text-white">
                    <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Mobil %{deviceBreakdown.mobile.percent} ({deviceBreakdown.mobile.count})</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-white">
                    <Tablet className="h-3.5 w-3.5 text-[#d4af37]" />
                    <span>Tablet %{deviceBreakdown.tablet.percent} ({deviceBreakdown.tablet.count})</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-white">
                    <Laptop className="h-3.5 w-3.5 text-blue-400" />
                    <span>Masaüstü %{deviceBreakdown.desktop.percent} ({deviceBreakdown.desktop.count})</span>
                  </span>
                </div>
              </div>
              {/* Visual Progress Bar */}
              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden flex">
                <div
                  style={{ width: `${deviceBreakdown.mobile.percent}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Mobil: %${deviceBreakdown.mobile.percent}`}
                />
                <div
                  style={{ width: `${deviceBreakdown.tablet.percent}%` }}
                  className="bg-[#d4af37] h-full transition-all"
                  title={`Tablet: %${deviceBreakdown.tablet.percent}`}
                />
                <div
                  style={{ width: `${deviceBreakdown.desktop.percent}%` }}
                  className="bg-blue-500 h-full transition-all"
                  title={`Masaüstü: %${deviceBreakdown.desktop.percent}`}
                />
              </div>
            </div>

            {/* Conversion Funnel & Marketing Attribution Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 1. Conversion Funnel (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-neutral-800">
                  <div>
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Target className="h-4 w-4 text-[#d4af37]" />
                      <span>Dönüşüm Hunisi (Ziyaretten Satışa)</span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Siteye girişten WhatsApp sipariş butonuna kadar her aşamadaki ziyaretçi kaybı ve başarı oranı.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 font-bold self-start sm:self-auto">
                    {conversionFunnel[3]?.percent ?? 0}% Tam Dönüşüm
                  </span>
                </div>

                <div className="space-y-4">
                  {conversionFunnel.map((step, idx) => {
                    const stepColors = [
                      "from-blue-600 to-blue-400 text-blue-400 border-blue-500/30",
                      "from-purple-600 to-purple-400 text-purple-400 border-purple-500/30",
                      "from-amber-600 to-[#d4af37] text-amber-300 border-amber-500/30",
                      "from-emerald-600 to-emerald-400 text-emerald-400 border-emerald-500/30",
                    ];
                    const colorClass = stepColors[idx] || stepColors[0];

                    return (
                      <div key={idx} className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-neutral-800/80">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{step.step}</span>
                            <span className="text-[10px] text-neutral-400 hidden sm:inline">
                              · {step.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="font-bold text-white">{step.count} Oturum</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-white/10 text-white">
                              %{step.percent}
                            </span>
                            {idx < 3 && (
                              <span className="text-[10px] text-red-400 font-sans font-medium">
                                ({step.dropRate})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Funnel Progress Bar */}
                        <div className="h-2.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            style={{ width: `${Math.max(4, step.percent)}%` }}
                            className={`h-full bg-gradient-to-r ${colorClass.split(" ")[0]} ${colorClass.split(" ")[1]} transition-all duration-500`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Right Side: Visitor Loyalty & Traffic Sources (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* 2.a Visitor Loyalty (Yeni vs Geri Dönen) */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-xl p-5">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
                    <div>
                      <h3 className="text-xs font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#d4af37]" />
                        <span>Yeni vs Geri Dönen Ziyaretçi</span>
                      </h3>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        Kalıcı cihaz kimliğiyle sadık müşteri takibi
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* New Visitors */}
                    <div className="bg-black/60 border border-blue-900/40 rounded-xl p-3">
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                        Yeni Ziyaretçi
                      </div>
                      <div className="text-xl font-black font-heading text-white mt-1">
                        {visitorLoyalty.newCount}
                        <span className="text-xs text-blue-300 font-mono ml-1.5">
                          (%{visitorLoyalty.newPercent})
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-400 mt-0.5">Siteye ilk defa girenler</p>
                    </div>

                    {/* Returning Visitors */}
                    <div className="bg-black/60 border border-[#d4af37]/40 rounded-xl p-3">
                      <div className="text-[10px] font-bold text-[#d4af37] uppercase tracking-wider">
                        Geri Dönen (Sadık)
                      </div>
                      <div className="text-xl font-black font-heading text-white mt-1">
                        {visitorLoyalty.returningCount}
                        <span className="text-xs text-amber-300 font-mono ml-1.5">
                          (%{visitorLoyalty.returningPercent})
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-400 mt-0.5">Tekrar siteyi ziyaret edenler</p>
                    </div>
                  </div>

                  {/* Loyalty Bar */}
                  <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden flex">
                    <div
                      style={{ width: `${visitorLoyalty.newPercent}%` }}
                      className="bg-blue-500 h-full transition-all"
                      title={`Yeni: %${visitorLoyalty.newPercent}`}
                    />
                    <div
                      style={{ width: `${visitorLoyalty.returningPercent}%` }}
                      className="bg-[#d4af37] h-full transition-all"
                      title={`Geri Dönen: %${visitorLoyalty.returningPercent}`}
                    />
                  </div>
                </div>

                {/* 2.b Traffic Sources (Sosyal Medya & UTM) */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-xl p-5 flex-1">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
                    <h3 className="text-xs font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-emerald-400" />
                      <span>Trafik Kaynakları (Pazarlama & Sosyal Medya)</span>
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {trafficSources.length} Kaynak
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {trafficSources.map((source, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-black/60 border border-neutral-800/80 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-200">{source.channel}</span>
                          <span className="text-[10px] font-mono text-neutral-400">
                            %{source.percent}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-300 font-mono text-[11px]">
                            {source.visits} Ziyaret
                          </span>
                          {source.whatsappLeads > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                              💬 {source.whatsappLeads} Satış
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {trafficSources.length === 0 && (
                      <div className="text-center py-4 text-[11px] text-neutral-500">
                        Henüz trafik kaynağı verisi kaydedilmedi.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Analytics Widgets: Top Products & Search/Demand */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Top Products & Conversion Table (7 cols) */}
              <div className="lg:col-span-7 rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-neutral-800">
                  <div>
                    <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#d4af37]" />
                      <span>Tüm Ürünlerin İlgi & Dönüşüm Tablosu</span>
                      <span className="rounded-md bg-neutral-800 text-neutral-300 text-[10px] px-2 py-0.5 font-bold font-mono">
                        {topProducts.length} Ürün
                      </span>
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Görüntülenme, HD büyüteç zoom, ortalama sayfada kalma ve WhatsApp sipariş oranı
                    </p>
                  </div>
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Ürün filtrele..."
                      value={analyticsProductFilter}
                      onChange={(e) => setAnalyticsProductFilter(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-black/80 border border-neutral-700 text-white placeholder-neutral-500 focus:border-[#d4af37] outline-none font-sans"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[360px]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/80 sticky top-0 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800 z-10">
                      <tr>
                        <th className="px-3 py-2.5">Ürün Adı</th>
                        <th className="px-3 py-2.5 text-center">İnceleme</th>
                        <th className="px-3 py-2.5 text-center">Zoom</th>
                        <th className="px-3 py-2.5 text-center">Ort. Süre</th>
                        <th className="px-3 py-2.5 text-center">WhatsApp</th>
                        <th className="px-3 py-2.5 text-right">Dönüşüm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80 font-mono">
                      {displayedTopProducts.map((tp, idx) => (
                        <tr key={tp.productId || idx} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="px-3 py-2.5 font-sans font-medium text-white truncate max-w-[200px]" title={tp.productName}>
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{tp.productName}</span>
                              {tp.hasAnomaly && (
                                <span
                                  className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-sans font-bold whitespace-nowrap"
                                  title="Anomali: İnceleme (view) kaydı olmadan Zoom yapılmış!"
                                >
                                  ⚠️ Anomali
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center text-purple-300 font-bold">
                            {tp.views}
                          </td>
                          <td className="px-3 py-2.5 text-center text-blue-300">
                            {tp.zooms}
                          </td>
                          <td className="px-3 py-2.5 text-center text-amber-300 font-mono">
                            {tp.avgDurationSeconds && tp.avgDurationSeconds > 0 ? `${tp.avgDurationSeconds} sn` : "-"}
                          </td>
                          <td className="px-3 py-2.5 text-center text-emerald-400 font-bold">
                            {tp.whatsappClicks}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="inline-block px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/30 text-[#d4af37] text-[10px] font-bold">
                              {tp.conversionRate}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {displayedTopProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-neutral-500 font-sans text-xs">
                            Aramanıza uygun ürün bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Search Terms & Missed Demand (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {/* 1. Missed Demand (0 results) */}
                <div className="rounded-2xl border border-red-900/60 bg-red-950/20 shadow-xl p-5">
                  <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-red-900/40">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <div>
                      <h3 className="text-xs font-heading font-black text-red-300 uppercase tracking-wider">
                        Kaçırılan Talepler (Stokta Olmayan Aramalar)
                      </h3>
                      <p className="text-[10px] text-red-400/80">
                        Ziyaretçilerin aradığı fakat sitede sonuç bulamadığı kelimeler
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {missedDemand.map((md, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-black/60 border border-red-900/30 px-3 py-1.5 text-xs"
                      >
                        <span className="font-bold text-red-200 truncate">{md.term}</span>
                        <span className="rounded bg-red-500/20 text-red-400 text-[10px] font-mono px-2 py-0.5 font-bold">
                          {md.zeroResultCount} Kez Arandı
                        </span>
                      </div>
                    ))}
                    {missedDemand.length === 0 && (
                      <div className="text-center py-4 text-[11px] text-neutral-500">
                        Henüz 0 sonuç veren kaçırılan bir arama bulunmuyor.
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Top Searched Words */}
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-xl p-5 flex-1">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-neutral-800">
                    <h3 className="text-xs font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-blue-400" />
                      <span>En Çok Aranan Terimler</span>
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {searchTerms.length} Farklı Terim
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {searchTerms.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-black/60 border border-neutral-800 px-3 py-1.5 text-xs"
                      >
                        <span className="text-neutral-200 truncate">{st.term}</span>
                        <span className="rounded bg-blue-500/20 text-blue-400 text-[10px] font-mono px-2 py-0.5 font-bold">
                          {st.count} Arama
                        </span>
                      </div>
                    ))}
                    {searchTerms.length === 0 && (
                      <div className="text-center py-4 text-[11px] text-neutral-500">
                        Henüz site içi arama kaydı yok.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* VISITOR JOURNEYS & CUSTOMER JOURNEY TIMELINE (YENİ ÖZELLİK 2) */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 shadow-2xl p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 mb-4 border-b border-neutral-800">
                <div>
                  <h3 className="text-sm font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Route className="h-4 w-4 text-[#d4af37]" />
                    <span>Ziyaretçi Oturumları & Müşteri Yolculuğu</span>
                    <span className="rounded-md bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 text-[10px] px-2 py-0.5 font-bold">
                      {(dashboardData?.sessions || []).length} Oturum
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Müşterilerin sitede gezinme, ürün inceleme, HD büyüteç zoom ve WhatsApp sipariş adımlarının kronolojik dökümü.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(dashboardData?.sessions || []).map((session) => {
                  const isExpanded = expandedSessions.has(session.sessionId);
                  return (
                    <div
                      key={session.sessionId}
                      className="rounded-xl border border-neutral-800 bg-black/60 overflow-hidden transition-colors hover:border-neutral-700"
                    >
                      {/* Session Header Card */}
                      <button
                        type="button"
                        onClick={() => toggleSession(session.sessionId)}
                        className="w-full px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-left hover:bg-neutral-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded flex items-center gap-2">
                            <span className="text-[#d4af37]" title="Kalıcı Cihaz / Çerez Kimliği">Cihaz: {session.visitorId?.slice(0, 10)}</span>
                            {session.visitCount && session.visitCount > 1 ? (
                              <>
                                <span className="text-neutral-600">·</span>
                                <span className="text-amber-400 font-sans text-[10px] font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  {session.visitCount} Ziyaret
                                </span>
                              </>
                            ) : null}
                          </span>
                          <span className="text-xs text-neutral-400 flex items-center gap-1">
                            {session.deviceType === "mobile" ? (
                              <Smartphone className="h-3.5 w-3.5 text-blue-400" />
                            ) : session.deviceType === "tablet" ? (
                              <Tablet className="h-3.5 w-3.5 text-purple-400" />
                            ) : (
                              <Laptop className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                            <span className="capitalize">{session.deviceType}</span>
                          </span>
                          <span className="text-[11px] text-neutral-500 font-mono" title="Son Etkileşim Zamanı">
                            {new Date(session.endTime || session.startTime).toLocaleString("tr-TR")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {session.hasWhatsAppLead && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              WhatsApp Siparişi
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-mono">
                            <Clock className="h-3 w-3 inline mr-1 text-[#d4af37]" />
                            {session.durationFormatted} ({session.stepCount} Adım)
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-neutral-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-neutral-400" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Timeline Steps */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-neutral-800/60 bg-neutral-950/40">
                          <div className="relative pl-6 space-y-3 pt-3 before:absolute before:left-2.5 before:top-4 before:bottom-2 before:w-0.5 before:bg-neutral-800">
                            {session.steps.map((step, sIdx) => {
                              if (step.isSeparator) {
                                return (
                                  <div
                                    key={sIdx}
                                    className="relative -ml-6 my-3.5 py-2.5 border-y border-amber-500/25 bg-amber-500/10 px-4 rounded-xl flex items-center justify-between gap-3 shadow-inner"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                                      <span className="text-xs font-bold text-amber-200">
                                        {step.description}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 whitespace-nowrap">
                                      30+ Dk Ayraç
                                    </span>
                                  </div>
                                );
                              }

                              const badgeBg =
                                step.badge.color === "green"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  : step.badge.color === "purple"
                                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                  : step.badge.color === "blue"
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                  : step.badge.color === "amber"
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                  : step.badge.color === "red"
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-neutral-800 text-neutral-400 border-neutral-700";

                              const dotBg =
                                step.badge.color === "green"
                                  ? "bg-emerald-400"
                                  : step.badge.color === "purple"
                                  ? "bg-purple-400"
                                  : step.badge.color === "blue"
                                  ? "bg-blue-400"
                                  : step.badge.color === "amber"
                                  ? "bg-amber-400"
                                  : step.badge.color === "red"
                                  ? "bg-red-400"
                                  : "bg-neutral-500";

                              return (
                                <div key={sIdx} className="relative flex items-start gap-3">
                                  {/* Timeline bullet dot */}
                                  <div
                                    className={`absolute -left-6 top-1.5 h-2 w-2 rounded-full ${dotBg} ring-4 ring-black`}
                                  />
                                  <div className="flex-1 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-mono text-neutral-400">
                                        {step.time}
                                      </span>
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeBg}`}>
                                        {step.badge.text}
                                      </span>
                                      <span className="text-xs font-medium text-neutral-200">
                                        {step.description}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!dashboardData?.sessions || dashboardData.sessions.length === 0) && (
                  <div className="text-center py-6 text-neutral-500 text-xs">
                    Henüz kayıtlı ziyaretçi oturumu bulunmuyor.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* PRODUCT IMAGE PREVIEW MODAL */}
      {previewProduct && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewProduct(null)}
        >
          <div 
            className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl max-w-2xl w-full flex flex-col relative shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewProduct(null)} 
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white pr-10 mb-2 truncate">
              {previewProduct.name_tr}
            </h3>
            <div className="flex items-center gap-2 mb-4 text-xs">
              <span className="text-[#d4af37] uppercase font-mono font-bold tracking-wider">{previewProduct.category}</span>
              <span className="text-neutral-600">&bull;</span>
              <span className="text-neutral-400 font-mono">ID: {previewProduct.id}</span>
            </div>
            
            <div className="relative aspect-square md:aspect-video w-full bg-black rounded-xl overflow-hidden border border-neutral-800">
              {previewProduct.images && previewProduct.images.length > 0 ? (
                <Image
                  src={previewProduct.images[previewImageIdx] || previewProduct.images[0]}
                  alt={previewProduct.name_tr}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-neutral-600 font-mono">
                  Görsel Yok
                </div>
              )}
              
              {/* Image Navigation */}
              {previewProduct.images && previewProduct.images.length > 1 && (
                <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
                  {previewProduct.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewImageIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === previewImageIdx ? "bg-[#d4af37] w-4" : "bg-white/40 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
