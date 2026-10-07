// Genera public/og.png (1200x630) para Open Graph / Twitter cards.
// Rasteriza un SVG con sharp. Usa Arial (presente en Windows/libvips) para que
// el texto renderice sin depender de fuentes web.
//
// Correr:  node scripts/make-og.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '..', 'public', 'og.png');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="blob" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#9fb4ff"/>
      <stop offset="55%" stop-color="#2e2bff"/>
      <stop offset="100%" stop-color="#1b18b8"/>
    </radialGradient>
    <linearGradient id="coral" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff5a3c" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ff5a3c" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="#eeeae0"/>

  <!-- organismo decorativo a la derecha -->
  <circle cx="980" cy="300" r="250" fill="url(#blob)"/>
  <circle cx="880" cy="200" r="120" fill="url(#coral)"/>

  <!-- borde inferior de acento -->
  <rect x="0" y="618" width="1200" height="12" fill="#2e2bff"/>

  <g font-family="Arial, Helvetica, sans-serif">
    <text x="80" y="150" font-size="26" font-weight="700" letter-spacing="3"
      fill="#2e2bff">AI ENGINEER &amp; BACKEND DEV</text>

    <text x="76" y="285" font-size="92" font-weight="700" fill="#15140f">Axel Santiago</text>
    <text x="76" y="385" font-size="92" font-weight="700" fill="#15140f">Chávez</text>

    <text x="80" y="470" font-size="34" font-weight="400" fill="#6c685c">Transformo ideas en productos reales.</text>

    <text x="80" y="560" font-size="24" font-weight="700" fill="#15140f">github.com/SSJAxel</text>
  </g>
</svg>
`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log('OG image escrita en', out);
