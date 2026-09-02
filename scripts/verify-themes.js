const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = "/Users/qwerty/.gemini/antigravity/brain/fae2fede-a1bb-410a-bc5e-897711e53ed6/scratch";

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  console.log("1. Testing Home Dark...");
  await page.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "home-dark.png") });

  console.log("2. Switching to Light Mode via theme toggle...");
  // Click the theme toggle button
  const toggleBtn = await page.$('button[title="Açık Tema"]');
  if (toggleBtn) {
    await toggleBtn.click();
  } else {
    await page.evaluate(() => {
      localStorage.setItem("gunerav_theme", "light");
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
  }

  await new Promise((r) => setTimeout(r, 600));

  console.log("3. Testing Home Light...");
  await page.screenshot({ path: path.join(OUTPUT_DIR, "home-light.png") });

  // Scroll down and capture products & trust
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "home-light-categories.png") });

  await page.evaluate(() => window.scrollBy(0, 900));
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "home-light-products.png") });

  console.log("4. Testing Catalog Light...");
  await page.goto("http://localhost:3000/tr/products", { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "catalog-light.png") });

  console.log("5. Testing Product Detail Light...");
  await page.goto("http://localhost:3000/tr/products/ata-arms-neo12-kinetik-yivsiz-av-tufegi", {
    waitUntil: "networkidle0",
  });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "detail-light.png") });

  console.log("6. Testing Contact Light...");
  await page.goto("http://localhost:3000/tr/contact", { waitUntil: "networkidle0" });
  await page.screenshot({ path: path.join(OUTPUT_DIR, "contact-light.png") });

  // Contrast check script
  const contrastReport = await page.evaluate(() => {
    const textEls = Array.from(document.querySelectorAll("h1, h2, h3, p, span, a, label, button"));
    let issues = 0;
    const sample = [];

    for (const el of textEls) {
      const style = window.getComputedStyle(el);
      const color = style.color;
      if (color.includes("255, 255, 255") && style.backgroundColor.includes("255, 255, 255")) {
        issues++;
        sample.push({ text: el.innerText.slice(0, 30), color, bg: style.backgroundColor });
      }
    }
    return { issues, total: textEls.length, sample };
  });

  console.log("Contrast Report:", JSON.stringify(contrastReport, null, 2));

  await browser.close();
  console.log("Verification finished successfully!");
}

run().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
