const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dirs = [
  'public/images',
  'public/images/categories',
  'public/images/products',
];

dirs.forEach((d) => {
  const full = path.join(process.cwd(), d);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
});

function createSvg({ title, subtitle, badge, iconType, width = 800, height = 600, theme = 'dark' }) {
  const isLicensed = badge && badge.includes('RUHSAT');
  const badgeColor = isLicensed ? '#ef4444' : '#d4af37';
  const badgeBg = isLicensed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(212, 175, 55, 0.15)';
  const badgeBorder = isLicensed ? '#ef4444' : '#d4af37';

  // Crosshair / reticle vector or tactical lines
  let iconMarkup = '';
  if (iconType === 'optics') {
    iconMarkup = `
      <circle cx="400" cy="280" r="110" stroke="#333" stroke-width="2" fill="none" />
      <circle cx="400" cy="280" r="80" stroke="#444" stroke-width="2" fill="none" />
      <circle cx="400" cy="280" r="30" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="4 3" fill="none" />
      <line x1="260" y1="280" x2="540" y2="280" stroke="#555" stroke-width="1.5" />
      <line x1="400" y1="140" x2="400" y2="420" stroke="#555" stroke-width="1.5" />
      <circle cx="400" cy="280" r="3" fill="#ef4444" />
    `;
  } else if (iconType === 'firearms') {
    iconMarkup = `
      <rect x="250" y="270" width="300" height="12" rx="4" fill="#2a2a2a" stroke="#444" stroke-width="1.5"/>
      <rect x="360" y="258" width="80" height="16" rx="2" fill="#1f1f1f" stroke="#555" stroke-width="1"/>
      <path d="M 280 282 L 270 340 L 310 335 L 315 282 Z" fill="#181818" stroke="#333" stroke-width="1.5"/>
      <circle cx="400" cy="276" r="35" stroke="#ef4444" stroke-width="1" stroke-dasharray="3 3" fill="none"/>
    `;
  } else if (iconType === 'knives') {
    iconMarkup = `
      <path d="M 280 320 Q 400 290 520 230 Q 470 270 380 310 Z" fill="#2d2d2d" stroke="#666" stroke-width="2"/>
      <rect x="230" y="320" width="90" height="24" rx="4" transform="rotate(15 230 320)" fill="#1c1917" stroke="#444" stroke-width="1.5"/>
      <circle cx="260" cy="335" r="3" fill="#d4af37"/>
      <circle cx="290" cy="343" r="3" fill="#d4af37"/>
    `;
  } else if (iconType === 'apparel') {
    iconMarkup = `
      <path d="M 330 200 L 470 200 L 520 260 L 480 280 L 450 250 L 450 370 L 350 370 L 350 250 L 320 280 L 280 260 Z" fill="#1e211e" stroke="#3d443d" stroke-width="2"/>
      <line x1="400" y1="200" x2="400" y2="370" stroke="#2b302b" stroke-width="2" stroke-dasharray="6 4"/>
    `;
  } else if (iconType === 'camping') {
    iconMarkup = `
      <polygon points="400,190 490,360 310,360" fill="#171917" stroke="#384238" stroke-width="2"/>
      <polygon points="400,240 450,360 350,360" fill="#0f110f" stroke="#4d5b4d" stroke-width="1.5"/>
      <circle cx="400" cy="160" r="16" fill="none" stroke="#d4af37" stroke-width="2"/>
    `;
  } else {
    iconMarkup = `
      <circle cx="400" cy="270" r="70" stroke="#333" stroke-width="2" fill="none" />
      <polygon points="400,220 440,300 360,300" stroke="#d4af37" stroke-width="1.5" fill="none" />
    `;
  }

  return `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="grad" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#1c1c1c" />
        <stop offset="60%" stop-color="#0e0e0e" />
        <stop offset="100%" stop-color="#050505" />
      </radialGradient>
      <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#181818" stroke-width="0.8"/>
        <circle cx="0" cy="0" r="1" fill="#262626"/>
      </pattern>
    </defs>

    <rect width="${width}" height="${height}" fill="url(#grad)"/>
    <rect width="${width}" height="${height}" fill="url(#tacticalGrid)"/>

    <!-- Perimeter Corner Crosses -->
    <path d="M 30 50 L 50 50 M 40 40 L 40 60" stroke="#333" stroke-width="1.5"/>
    <path d="M 750 50 L 770 50 M 760 40 L 760 60" stroke="#333" stroke-width="1.5"/>
    <path d="M 30 550 L 50 550 M 40 540 L 40 560" stroke="#333" stroke-width="1.5"/>
    <path d="M 750 550 L 770 550 M 760 540 L 760 560" stroke="#333" stroke-width="1.5"/>

    <!-- Subtle framing -->
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="#1a1a1a" stroke-width="1"/>

    <!-- Brand Header -->
    <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="#737373">GÜNER AV // TACTICAL &amp; OUTDOOR</text>

    ${badge ? `
      <g transform="translate(${width - 240}, 40)">
        <rect width="190" height="26" rx="4" fill="${badgeBg}" stroke="${badgeBorder}" stroke-width="1"/>
        <text x="95" y="17" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="700" letter-spacing="1.5" fill="${badgeColor}" text-anchor="middle">${badge}</text>
      </g>
    ` : ''}

    <!-- Icon Illustration Graphic -->
    <g>
      ${iconMarkup}
    </g>

    <!-- Bottom Typography Block -->
    <g transform="translate(50, ${height - 120})">
      <text x="0" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#f5f5f5" letter-spacing="0.5">${title}</text>
      <text x="0" y="32" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="400" fill="#a3a3a3">${subtitle}</text>
      <line x1="0" y1="52" x2="${width - 100}" y2="52" stroke="#222" stroke-width="1"/>
      <text x="${width - 100}" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#525252" text-anchor="end">MALATYA AV GÜNER BAYİİ</text>
    </g>
  </svg>
  `;
}

async function renderAsset(svgContent, targetPath, isJpeg = false) {
  const fullPath = path.join(process.cwd(), targetPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const buffer = Buffer.from(svgContent);
  if (isJpeg) {
    await sharp(buffer).jpeg({ quality: 90 }).toFile(fullPath);
  } else {
    await sharp(buffer).webp({ quality: 90 }).toFile(fullPath);
  }
  console.log('Generated:', targetPath);
}

async function main() {
  // Category cards
  const categories = [
    { file: 'public/images/categories/optics.webp', title: 'OPTIK &amp; DURBUN', sub: 'Taktik Dürbünler &amp; Termal Sistemler', icon: 'optics' },
    { file: 'public/images/categories/apparel.webp', title: 'AV &amp; DOGA GIYIMI', sub: 'GORE-TEX Membran Mont &amp; Botlar', icon: 'apparel' },
    { file: 'public/images/categories/camping.webp', title: 'KAMP &amp; TAKTIK', sub: 'Sırt Çantaları &amp; Çadır Ekipmanları', icon: 'camping' },
    { file: 'public/images/categories/knives.webp', title: 'BICAK &amp; AKSESUAR', sub: 'El Yapımı Çelik Bıçaklar &amp; Multi-Tools', icon: 'knives' },
    { file: 'public/images/categories/firearms.webp', title: 'TUFEK &amp; MUHIMMAT', sub: 'Yivsiz Av Tüfekleri &amp; Orijinal Fişekler', icon: 'firearms', badge: 'RESMI RUHSATLI' },
  ];

  for (const c of categories) {
    const svg = createSvg({
      title: c.title,
      subtitle: c.sub,
      iconType: c.icon,
      badge: c.badge || 'ORIJINAL GARANTI',
      width: 800,
      height: 600,
    });
    await renderAsset(svg, c.file);
  }

  // Products
  const products = [
    { file: 'public/images/products/optics-1.webp', title: 'STEINER RANGER 8', sub: '3-24x56 Taktik Av Dürbünü', icon: 'optics', badge: 'PREMIUM SERI' },
    { file: 'public/images/products/optics-1-detail.webp', title: 'STEINER OPTIK RETIKUL', sub: '4A-I Aydınlatmalı Hedef Noktası', icon: 'optics', badge: 'DETAY GORUNUM' },
    { file: 'public/images/products/optics-2.webp', title: 'PULSAR AXION XM30F', sub: 'Kompakt Termal El Dürbünü (1300m)', icon: 'optics', badge: 'TERMAL SISTEM' },
    { file: 'public/images/products/apparel-1.webp', title: 'HARKILA PRO HUNTER', sub: 'AirTech GORE-TEX Ağır Doğa Montu', icon: 'apparel', badge: '5 YIL GARANTI' },
    { file: 'public/images/products/apparel-2.webp', title: 'CRISPI HUNTER GTX', sub: 'Vibram Tabanlı Su Geçirmez Av Botu', icon: 'apparel', badge: 'VIBRAM SOLE' },
    { file: 'public/images/products/camping-1.webp', title: 'TASMANIAN TIGER 52L', sub: 'CORDURA 700den Taktik Sırt Çantası', icon: 'camping', badge: 'MIL-SPEC' },
    { file: 'public/images/products/camping-2.webp', title: 'FENIX TK20R V2.0', sub: '3000 Lümen Taktik Şarjlı Fener', icon: 'camping', badge: 'IP68 WATERPROOF' },
    { file: 'public/images/products/knives-1.webp', title: 'BOKER ARBOLITO', sub: 'Böhler N695 Çelik Geyik Boynuzu Bıçak', icon: 'knives', badge: 'EL ISCILIGI' },
    { file: 'public/images/products/knives-2.webp', title: 'LEATHERMAN SURGE', sub: '21 Fonksiyonlu Taktik Çok Amaçlı Pense', icon: 'knives', badge: '25 YIL GARANTI' },
    { file: 'public/images/products/firearms-1.webp', title: 'ATA ARMS NEO12', sub: 'Kinetik Yarı Otomatik Yivsiz Av Tüfeği', icon: 'firearms', badge: 'YASAL RUHSAT GEREKTIRIR' },
    { file: 'public/images/products/firearms-2.webp', title: 'HUGLU RENOVA', sub: 'Sentetik Kinetik 12 Kalibre Av Tüfeği', icon: 'firearms', badge: 'YASAL RUHSAT GEREKTIRIR' },
    { file: 'public/images/products/firearms-3.webp', title: 'GAMO CFX PRO 5.5MM', sub: 'Sabit Namlu Hassas Hedef Havalı Tüfek', icon: 'firearms', badge: 'HEDEF ATICILIGI' },
    { file: 'public/images/products/ammo-1.webp', title: 'STERLING 12 CAL 34GR', sub: 'İtalyan Barutlu Exclusive Av Fişeği', icon: 'firearms', badge: 'YASAL RUHSAT GEREKTIRIR' },
  ];

  for (const p of products) {
    const svg = createSvg({
      title: p.title,
      subtitle: p.sub,
      iconType: p.icon,
      badge: p.badge,
      width: 800,
      height: 600,
    });
    await renderAsset(svg, p.file);
  }

  // Hero background
  const heroSvg = `
  <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="heroGrad" cx="60%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#1f221f" />
        <stop offset="40%" stop-color="#121312" />
        <stop offset="80%" stop-color="#090a09" />
        <stop offset="100%" stop-color="#020302" />
      </radialGradient>
      <linearGradient id="topo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2a302a" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#heroGrad)"/>
    
    <!-- Topographic contour style lines -->
    <path d="M 0 300 Q 400 150 800 350 T 1600 250 T 2000 400" fill="none" stroke="#1f261f" stroke-width="2"/>
    <path d="M 0 450 Q 500 300 1000 500 T 1700 380 T 2000 550" fill="none" stroke="#182018" stroke-width="2"/>
    <path d="M 0 600 Q 600 420 1100 650 T 1800 500 T 2000 700" fill="none" stroke="#141a14" stroke-width="2"/>
    <path d="M 0 750 Q 450 600 950 800 T 1650 680 T 2000 850" fill="none" stroke="#111611" stroke-width="2"/>

    <!-- Subtle Crosshair Overlay in Background -->
    <circle cx="1280" cy="540" r="320" stroke="#1c241c" stroke-width="1.5" stroke-dasharray="8 6" fill="none"/>
    <circle cx="1280" cy="540" r="180" stroke="#243024" stroke-width="1.5" fill="none"/>
    <line x1="880" y1="540" x2="1680" y2="540" stroke="#243024" stroke-width="1"/>
    <line x1="1280" y1="140" x2="1280" y2="940" stroke="#243024" stroke-width="1"/>
  </svg>
  `;
  await renderAsset(heroSvg, 'public/images/hero-bg.webp');

  // Store facade image
  const storeSvg = `
  <svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="800" fill="#0d0e0d"/>
    <rect x="100" y="100" width="1000" height="600" rx="12" fill="#141614" stroke="#2a302a" stroke-width="2"/>
    <text x="600" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="900" fill="#ffffff" letter-spacing="4" text-anchor="middle">MALATYA AV GÜNER AV BAYİİ</text>
    <text x="600" y="290" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#d4af37" letter-spacing="2" text-anchor="middle">★ ★ ★ ★ ★  GOOGLE 5.0 PUAN</text>
    <text x="600" y="360" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="400" fill="#888888" text-anchor="middle">Şeyh Bayram, 6. Sk., Yeşilyurt / Malatya</text>
    <rect x="400" y="440" width="400" height="180" rx="8" fill="#1a1c1a" stroke="#333" stroke-width="1.5"/>
    <text x="600" y="520" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">GÜNER AV SHOWROOM</text>
    <text x="600" y="555" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="500" fill="#999" text-anchor="middle">Açık · Kapanış Saati: 20:00</text>
  </svg>
  `;
  await renderAsset(storeSvg, 'public/images/store-facade.webp');

  // OpenGraph Image
  const ogSvg = `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#0a0a0a"/>
    <circle cx="950" cy="315" r="240" stroke="#222" stroke-width="2" fill="none"/>
    <circle cx="950" cy="315" r="140" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="6 4" fill="none"/>
    <line x1="650" y1="315" x2="1250" y2="315" stroke="#333" stroke-width="1"/>
    <line x1="950" y1="15" x2="950" y2="615" stroke="#333" stroke-width="1"/>
    
    <text x="80" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" letter-spacing="4" fill="#d4af37">MALATYA // 5.0 PUANLI RESMİ AV BAYİİ</text>
    <text x="80" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="62" font-weight="900" fill="#ffffff" letter-spacing="1">GÜNER AV</text>
    <text x="80" y="300" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#a3a3a3">Av Malzemeleri, Taktik Optik &amp; Doğa Sporları</text>
    <rect x="80" y="360" width="380" height="48" rx="6" fill="#181818" stroke="#333" stroke-width="1"/>
    <text x="105" y="390" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="#f5f5f5">📍 Yeşilyurt, Malatya · 📞 0545 876 87 99</text>
  </svg>
  `;
  await renderAsset(ogSvg, 'public/images/og-image.jpg', true);
}

main().catch(console.error);
