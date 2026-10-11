// Generates the PWA and browser icons from an inline SVG (white water drop on
// the brand blue). Run with `npm run icons` from apps/web, then commit the
// output files. Re-run whenever the artwork below changes, and bump VERSION in
// public/sw.js so installed apps pick up the new icons.
//
// Note: this file is linted with the shared config, which only provides
// service-worker globals, so it avoids the Node `process` global and imports
// Buffer explicitly.

import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const BRAND_BLUE = "#0a3d91";
const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Drop drawn in a 24x24 box: pointed tip at (12,2), round base centred at (12,15).
// The box's visual centre is (12,12), which is what we centre on the canvas.
const DROP_PATH = "M12 2C12 2 5 9.5 5 15a7 7 0 0 0 14 0C19 9.5 12 2 12 2Z";
const DROP_SHINE = "M8.6 15.4a3.6 3.6 0 0 0 3.1 3.4";

// Builds a 512x512 SVG. `scale` sizes the drop (24-unit box -> 24*scale px).
// `rounded` gives a rounded-square tile with transparent corners; otherwise the
// blue fills the whole square (for maskable and Apple icons, which the OS crops).
function iconSvg({ scale, rounded }) {
  const offset = 256 - 12 * scale;
  const background = rounded
    ? `<rect width="512" height="512" rx="112" fill="${BRAND_BLUE}"/>`
    : `<rect width="512" height="512" fill="${BRAND_BLUE}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${background}
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${DROP_PATH}" fill="#ffffff"/>
    <path d="${DROP_SHINE}" fill="none" stroke="${BRAND_BLUE}" stroke-width="1.3" stroke-linecap="round"/>
  </g>
</svg>`;
}

// Standard icon: drop height is 55% of the tile.
const standardSvg = iconSvg({ scale: 14, rounded: true });
// Maskable: full bleed, drop stays inside the central 80% safe circle.
const maskableSvg = iconSvg({ scale: 13, rounded: false });
// Apple touch icon: iOS applies its own rounded corners, so fill the square.
const appleSvg = iconSvg({ scale: 14, rounded: false });
// Favicon: bigger drop so it stays legible at 16px.
const faviconSvg = iconSvg({ scale: 17, rounded: true });

function renderPng(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
}

// Minimal .ico writer: modern browsers accept PNG data inside ICO entries.
function buildIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = headerSize + entrySize * images.length;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette colours
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((image) => image.data)]);
}

async function write(relativePath, data) {
  const target = join(appRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, data);
  console.log(`wrote ${relativePath} (${data.length} bytes)`);
}

await write("public/icons/icon-192.png", await renderPng(standardSvg, 192));
await write("public/icons/icon-512.png", await renderPng(standardSvg, 512));
await write("public/icons/maskable-512.png", await renderPng(maskableSvg, 512));
await write("app/apple-icon.png", await renderPng(appleSvg, 180));

const faviconImages = [];
for (const size of [16, 32, 48]) {
  faviconImages.push({ size, data: await renderPng(faviconSvg, size) });
}
await write("app/favicon.ico", buildIco(faviconImages));
