const puppeteer = require("puppeteer-core");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = "/Users/qwerty/.gemini/antigravity/brain/fae2fede-a1bb-410a-bc5e-897711e53ed6/scratch";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // 1. Desktop Light Mode
  const pageLight = await browser.newPage();
  await pageLight.setViewport({ width: 1440, height: 960 });
  await pageLight.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "light");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageLight.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageLight.screenshot({
    path: `${OUTPUT_DIR}/desktop-light.png`,
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });
  console.log("Captured desktop-light.png");

  // 2. Desktop Dark Mode
  const pageDark = await browser.newPage();
  await pageDark.setViewport({ width: 1440, height: 960 });
  await pageDark.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_theme", "dark");
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await pageDark.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await pageDark.screenshot({
    path: `${OUTPUT_DIR}/desktop-dark.png`,
    clip: { x: 0, y: 0, width: 1440, height: 960 },
  });
  console.log("Captured desktop-dark.png");

  // 3. Mobile Viewport (iPhone 14/15 screen)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.evaluateOnNewDocument(() => {
    localStorage.setItem("gunerav_cookie_consent", "accepted");
  });
  await mobilePage.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await mobilePage.screenshot({
    path: `${OUTPUT_DIR}/mobile-hero.png`,
  });
  console.log("Captured mobile-hero.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
