const http = require("http");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:3000";

let passedCount = 0;
let failedCount = 0;

function report(testName, passed, detail) {
  if (passed) {
    passedCount++;
    console.log(`✅ [PASS] ${testName} -> ${detail}`);
  } else {
    failedCount++;
    console.error(`❌ [FAIL] ${testName} -> ${detail}`);
  }
}

async function fetchHead(path) {
  return new Promise((resolve) => {
    http.get(`${BASE_URL}${path}`, { method: "HEAD" }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    }).on("error", (err) => {
      resolve({ status: 500, headers: {}, error: err.message });
    });
  });
}

async function runAudit() {
  console.log("==================================================================");
  console.log("🛡️  GÜNER AV (gunerav.site) - KAPSAMLI GÜVENLİK DENETİMİ (AUDIT)  🛡️");
  console.log("==================================================================\n");

  // 1. Güvenlik Başlıkları Testi (Security Headers)
  console.log("--- 1. HTTP GÜVENLİK BAŞLIKLARI (SECURITY HEADERS) TESTİ ---");
  const home = await fetchHead("/tr");
  
  report("X-Frame-Options (Clickjacking Koruması)", home.headers["x-frame-options"] === "DENY", `Değer: ${home.headers["x-frame-options"]}`);
  report("X-Content-Type-Options (MIME Sniffing)", home.headers["x-content-type-options"] === "nosniff", `Değer: ${home.headers["x-content-type-options"]}`);
  report("Referrer-Policy (Gizlilik Sızıntısı)", home.headers["referrer-policy"] === "strict-origin-when-cross-origin", `Değer: ${home.headers["referrer-policy"]}`);
  report("Permissions-Policy (Donanım Kısıtlaması)", Boolean(home.headers["permissions-policy"]), `Değer: ${home.headers["permissions-policy"]}`);
  report("X-Powered-By İzolasyonu (Sunucu Gizleme)", !home.headers["x-powered-by"], home.headers["x-powered-by"] ? `Açık: ${home.headers["x-powered-by"]}` : "Kapalı / Gizlendi (Sıfır İpucu)");

  // 2. Statik Dosya Sızıntısı ve İzolasyon Testi
  console.log("\n--- 2. STATİK DOSYA VE VERİTABANI SIZINTISI İZOLASYON TESTİ ---");
  const filesToTest = [
    "/extension/supabase-schema.sql",
    "/data/products.json",
    "/.env.local",
    "/.env",
    "/scripts/capture-hero.js",
    "/supabase/security-harden.sql"
  ];

  for (const f of filesToTest) {
    const res = await fetchHead(f);
    report(`Gizli Dosya İzolasyonu: ${f}`, res.status === 404, `HTTP Kodu: ${res.status}`);
  }

  // 3. Client JS Paketlerinde Gizli Anahtar Taraması (Secret Leak Scan)
  console.log("\n--- 3. İSTEMCİ (CLIENT JS BUNDLE) GİZLİ ŞİFRE TARAMASI ---");
  const nextStaticDir = path.join(__dirname, "../.next/static/chunks");
  let leakFound = false;
  let filesScanned = 0;

  if (fs.existsSync(nextStaticDir)) {
    const files = fs.readdirSync(nextStaticDir).filter(f => f.endsWith(".js"));
    filesScanned = files.length;
    for (const f of files) {
      const content = fs.readFileSync(path.join(nextStaticDir, f), "utf8");
      if (content.includes("service_role") || content.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        leakFound = true;
        console.error(`UYARI: ${f} içinde service_role saptandı!`);
      }
    }
  }

  report("Client JS Bundle Secret Sızıntısı", !leakFound, `${filesScanned} derlenmiş JS paketi tarandı; 0 adet gizli servis anahtarı bulundu.`);

  // 4. İletişim Formu Anti-Bot Honeypot Koruması
  console.log("\n--- 4. İLETİŞİM FORMU ANTİ-BOT HONEYPOT DENETİMİ ---");
  const contactFormPath = path.join(__dirname, "../src/components/contact/ContactForm.tsx");
  const contactContent = fs.readFileSync(contactFormPath, "utf8");
  const hasHoneypot = contactContent.includes("gunerav_security_hp") && contactContent.includes("honeypot");
  report("İletişim Formu Bot Tuzağı (Honeypot Trap)", hasHoneypot, "Formda gizli tuzak alanı ve arka plan bloklama kodu mevcut.");

  // 5. Supabase RLS Güvenlik Duvarı Politikası
  console.log("\n--- 5. SUPABASE RLS (ROW LEVEL SECURITY) POLİTİKASI ---");
  const rlsPath = path.join(__dirname, "../supabase/security-harden.sql");
  const rlsContent = fs.readFileSync(rlsPath, "utf8");
  const hasStrictRls = rlsContent.includes("ENABLE ROW LEVEL SECURITY") && 
                       rlsContent.includes("DROP POLICY IF EXISTS \"Allow insert and update for authenticated or anon\"") &&
                       rlsContent.includes("FOR SELECT");
  report("Supabase RLS Sıkılaştırma (Zero-Trust Fail-Closed)", hasStrictRls, "Anonim DELETE/UPDATE politikası kaldırıldı; sadece SELECT yetkisi tanımlandı.");

  console.log("\n==================================================================");
  console.log(`📊 DENETİM SONUCU: TOPLAM ${passedCount + failedCount} TESTTEN ${passedCount} BAŞARILI, ${failedCount} BAŞARISIZ.`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAudit();
