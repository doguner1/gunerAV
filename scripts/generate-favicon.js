const sharp = require('sharp');
const path = require('path');

const faviconSvg = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#0a0a0a"/>
  <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="#262626" stroke-width="2"/>
  <circle cx="32" cy="32" r="18" stroke="#d4af37" stroke-width="2.5" fill="none"/>
  <circle cx="32" cy="32" r="6" fill="#d4af37"/>
  <line x1="10" y1="32" x2="22" y2="32" stroke="#d4af37" stroke-width="2.5"/>
  <line x1="42" y1="32" x2="54" y2="32" stroke="#d4af37" stroke-width="2.5"/>
  <line x1="32" y1="10" x2="32" y2="22" stroke="#d4af37" stroke-width="2.5"/>
  <line x1="32" y1="42" x2="32" y2="54" stroke="#d4af37" stroke-width="2.5"/>
</svg>
`;

sharp(Buffer.from(faviconSvg))
  .png()
  .toFile(path.join(process.cwd(), 'public/icon.png'))
  .then(() => console.log('Favicon icon.png generated'))
  .catch(console.error);
