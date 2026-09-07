const puppeteer = require("puppeteer-core");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = "/Users/qwerty/.gemini/antigravity/brain/fae2fede-a1bb-410a-bc5e-897711e53ed6/scratch";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // 1. Desktop Mac (1440x900)
  const pageMac = await browser.newPage();
  await pageMac.setViewport({ width: 1440, height: 900 });
  await pageMac.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageMac.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageMac.screenshot({
    path: `${OUTPUT_DIR}/responsive-desktop.png`,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log("Captured responsive-desktop.png");

  // 2. Tablet Portrait (800x1100)
  const pageTablet = await browser.newPage();
  await pageTablet.setViewport({ width: 800, height: 1100 });
  await pageTablet.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageTablet.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageTablet.screenshot({
    path: `${OUTPUT_DIR}/responsive-tablet-portrait.png`,
    clip: { x: 0, y: 0, width: 800, height: 1100 },
  });
  console.log("Captured responsive-tablet-portrait.png");

  // 3. Mobile Phone (375x667 - iPhone 7 / SE)
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 375, height: 667, isMobile: true });
  await pageMobile.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageMobile.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageMobile.screenshot({
    path: `${OUTPUT_DIR}/responsive-mobile-phone.png`,
  });
  console.log("Captured responsive-mobile-phone.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
