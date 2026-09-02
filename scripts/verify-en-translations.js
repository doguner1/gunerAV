const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = "/Users/qwerty/.gemini/antigravity/brain/fae2fede-a1bb-410a-bc5e-897711e53ed6/scratch";

// Typical Turkish words that shouldn't appear on English pages (except proper nouns like Malatya or Yeşilyurt)
const FORBIDDEN_TR_WORDS = [
  "çerez",
  "bildirimi",
  "ürün",
  "ürünler",
  "katalog",
  "kataloğu",
  "hakkımızda",
  "iletişim",
  "gizlilik",
  "detayları",
  "incele",
  "kapat",
  "kabul et",
  "tavsiye",
  "hafta içi",
  "açık",
  "kapanış",
  "fırsatlar",
  "seçelim",
  "ruhsatlı",
  "satın alma",
  "fiyat",
  "stokta",
  "sıfırla",
  "teşhir",
  "yasal mevzuat",
  "tüm hakları",
  "hızlı bağlantılar"
];

const urlsToTest = [
  { name: "home-en", url: "http://localhost:3000/en", checkCookie: true },
  { name: "products-en", url: "http://localhost:3000/en/products" },
  { name: "about-en", url: "http://localhost:3000/en/about" },
  { name: "contact-en", url: "http://localhost:3000/en/contact" },
  { name: "privacy-en", url: "http://localhost:3000/en/privacy" },
  { name: "detail-en", url: "http://localhost:3000/en/products/steiner-ranger-8-3-24x56-rifle-scope" }
];

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  console.log("Starting English Translation Verification Audit...");
  let totalIssues = 0;

  for (const item of urlsToTest) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Clear cookies & localStorage so cookie banner appears if checkCookie is true
    if (!item.checkCookie) {
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem("gunerav_cookie_consent", "accepted");
      });
    }

    console.log(`\nNavigating to: ${item.url}`);
    await page.goto(item.url, { waitUntil: "networkidle2" });

    // Wait for cookie banner if checking home
    if (item.checkCookie) {
      try {
        await page.waitForSelector("aside[aria-label]", { timeout: 3000 });
        console.log("Found Cookie Banner!");
      } catch (e) {
        console.log("Cookie banner not found or delayed.");
      }
    }

    // Take full screenshot
    const screenshotPath = path.join(OUTPUT_DIR, `${item.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot to ${screenshotPath}`);

    // Extract all visible text
    const textSnippets = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const results = [];
      let node;
      while ((node = walker.nextNode())) {
        const txt = node.textContent?.trim();
        if (txt && txt.length > 1) {
          results.push({
            text: txt,
            tag: node.parentElement?.tagName || ""
          });
        }
      }
      return results;
    });

    // Check for forbidden Turkish words
    const pageIssues = [];
    for (const snippet of textSnippets) {
      // Don't flag scripts or style tags
      if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(snippet.tag)) continue;

      const lower = snippet.text.toLowerCase();
      for (const word of FORBIDDEN_TR_WORDS) {
        // Regex word boundary match
        const regex = new RegExp(`\\b${word}\\b`, "i");
        if (regex.test(lower)) {
          // Special exception for Turkish language switcher pill "TR"
          if (word === "tr" && snippet.text === "TR") continue;
          pageIssues.push({ word, text: snippet.text, tag: snippet.tag });
        }
      }
    }

    if (pageIssues.length > 0) {
      console.error(`❌ [${item.name}] Found ${pageIssues.length} Turkish word leaks:`);
      pageIssues.forEach((issue) => {
        console.error(`   - Found "${issue.word}" in [${issue.tag}]: "${issue.text}"`);
      });
      totalIssues += pageIssues.length;
    } else {
      console.log(`✅ [${item.name}] PASSED! Zero untranslated Turkish words found.`);
    }

    await page.close();
  }

  await browser.close();

  console.log(`\n================================`);
  console.log(`TOTAL LEAKS FOUND: ${totalIssues}`);
  console.log(`================================`);
  process.exit(totalIssues === 0 ? 0 : 1);
}

run().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
