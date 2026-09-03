const puppeteer = require("puppeteer-core");

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_DIR = "/Users/qwerty/.gemini/antigravity/brain/fae2fede-a1bb-410a-bc5e-897711e53ed6/scratch";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Dark Mode
  await page.goto("http://localhost:3000/tr", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    localStorage.setItem("gunerav_theme", "dark");
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({
    path: `${OUTPUT_DIR}/hero-redesign-dark.png`,
    clip: { x: 0, y: 0, width: 1440, height: 850 },
  });
  console.log("Captured hero-redesign-dark.png");

  // 2. Light Mode
  await page.evaluate(() => {
    localStorage.setItem("gunerav_theme", "light");
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({
    path: `${OUTPUT_DIR}/hero-redesign-light.png`,
    clip: { x: 0, y: 0, width: 1440, height: 850 },
  });
  console.log("Captured hero-redesign-light.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
