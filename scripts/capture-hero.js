const puppeteer = require("puppeteer-core");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = "/Users/qwerty/.gemini/antigravity/brain/fae2fede-a1bb-410a-bc5e-897711e53ed6/scratch";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // 1. English Desktop
  const pageEn = await browser.newPage();
  await pageEn.setViewport({ width: 1440, height: 960 });
  await pageEn.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageEn.goto("http://localhost:3000/en", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageEn.screenshot({
    path: `${OUTPUT_DIR}/desktop-en.png`,
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });
  console.log("Captured desktop-en.png");

  // 2. English Mobile
  const mobileEn = await browser.newPage();
  await mobileEn.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobileEn.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await mobileEn.goto("http://localhost:3000/en", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await mobileEn.screenshot({
    path: `${OUTPUT_DIR}/mobile-en.png`,
  });
  console.log("Captured mobile-en.png");

  // 3. Turkish Desktop
  const pageTr = await browser.newPage();
  await pageTr.setViewport({ width: 1440, height: 960 });
  await pageTr.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageTr.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageTr.screenshot({
    path: `${OUTPUT_DIR}/desktop-tr.png`,
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });
  console.log("Captured desktop-tr.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
