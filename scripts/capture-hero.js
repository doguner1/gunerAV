const puppeteer = require("puppeteer-core");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = "/Users/qwerty/.gemini/antigravity/brain/fae2fede-a1bb-410a-bc5e-897711e53ed6/scratch";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // 1. Fullscreen Mac (1440x900)
  const pageMac = await browser.newPage();
  await pageMac.setViewport({ width: 1440, height: 900 });
  await pageMac.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageMac.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageMac.screenshot({
    path: `${OUTPUT_DIR}/fullscreen-mac.png`,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log("Captured fullscreen-mac.png");

  // 2. Fullscreen 1080p (1920x1080)
  const page1080 = await browser.newPage();
  await page1080.setViewport({ width: 1920, height: 1080 });
  await page1080.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await page1080.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await page1080.screenshot({
    path: `${OUTPUT_DIR}/fullscreen-1080p.png`,
    clip: { x: 0, y: 0, width: 1920, height: 1080 },
  });
  console.log("Captured fullscreen-1080p.png");

  // 3. Fullscreen Light Mode (1440x900 - to prove ZERO white fog)
  const pageLight = await browser.newPage();
  await pageLight.setViewport({ width: 1440, height: 900 });
  await pageLight.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "light");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageLight.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageLight.screenshot({
    path: `${OUTPUT_DIR}/fullscreen-light.png`,
    clip: { x: 0, y: 0, width: 1440, height: 900 },
  });
  console.log("Captured fullscreen-light.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
