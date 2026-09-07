const puppeteer = require("puppeteer-core");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = "/Users/qwerty/.gemini/antigravity/brain/fae2fede-a1bb-410a-bc5e-897711e53ed6/scratch";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // 1. Home Page Hero Spotlight (1440x900)
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await page.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({
    path: `${OUTPUT_DIR}/hero-spotlight-castello.png`,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log("Captured hero-spotlight-castello.png");

  // 2. Scroll to Featured Products / Showcase
  await page.evaluate(() => {
    window.scrollTo(0, 950);
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({
    path: `${OUTPUT_DIR}/showcase-castello.png`,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log("Captured showcase-castello.png");

  // 3. Product Detail Page
  const detailPage = await browser.newPage();
  await detailPage.setViewport({ width: 1440, height: 1000 });
  await detailPage.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await detailPage.goto("http://localhost:3000/tr/products/castello-mod-505-otomatik-av-tufegi", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await detailPage.screenshot({
    path: `${OUTPUT_DIR}/product-detail-castello.png`,
  });
  console.log("Captured product-detail-castello.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
