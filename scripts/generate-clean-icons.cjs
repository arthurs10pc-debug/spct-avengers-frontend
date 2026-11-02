const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  const toCheck = Buffer.concat([typeBuf, data]);
  crc.writeUInt32BE(crc32(toCheck), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function generateShadowIconPNG(size, outputPath) {
  const width = size;
  const height = size;
  const bytesPerPixel = 4;
  const stride = 1 + width * bytesPerPixel;
  const rawData = Buffer.alloc(height * stride);

  const cx = width / 2;
  const cy = height / 2;

  // We want a stealth executive Shadow Icon:
  // Sleek dark obsidian rounded rect background (#07090e -> #000000)
  // Subtle metallic titanium shield border
  // Stylized silver / platinum 'S' emblem with stealth shadow facets
  // ZERO blue balls, zero glowing cyan orbs!

  const cornerRadius = size * 0.22;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * bytesPerPixel;
      const dx = x - cx;
      const dy = y - cy;
      const nx = x / width;
      const ny = y / height;

      // Rounded rect mask
      let inBounds = true;
      const qx = Math.max(0, Math.abs(dx) - (width / 2 - cornerRadius));
      const qy = Math.max(0, Math.abs(dy) - (height / 2 - cornerRadius));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);
      if (cornerDist > cornerRadius) {
        inBounds = false;
      }

      if (!inBounds) {
        // Transparent outside rounded corners
        rawData[px] = 0;
        rawData[px + 1] = 0;
        rawData[px + 2] = 0;
        rawData[px + 3] = 0;
        continue;
      }

      // Base Obsidian / Charcoal gradient
      const grad = Math.min(1, Math.max(0, (ny + 0.2)));
      let r = Math.floor(18 * (1 - grad * 0.7));
      let g = Math.floor(20 * (1 - grad * 0.7));
      let b = Math.floor(26 * (1 - grad * 0.7));
      let a = 255;

      // Subtle outer metallic border
      const edgeDist = Math.min(
        Math.min(x, width - 1 - x),
        Math.min(y, height - 1 - y)
      );
      if (edgeDist < Math.max(2, size * 0.025)) {
        r = 55;
        g = 65;
        b = 80;
      }

      // Geometric stylized "S" emblem:
      // Normalized coordinates centered at 0, 0: sx, sy in [-1, 1]
      const sx = (x - cx) / (width * 0.32);
      const sy = (y - cy) / (height * 0.34);

      // Stylized angular stealth "S" composed of 3 horizontal bars and 2 vertical links
      const barH = 0.22;
      const thick = 0.20;

      const inTopBar = sy >= -0.85 && sy <= -0.85 + barH && sx >= -0.7 && sx <= 0.7;
      const inMidBar = sy >= -0.11 && sy <= -0.11 + barH && sx >= -0.65 && sx <= 0.65;
      const inBotBar = sy >= 0.63 && sy <= 0.63 + barH && sx >= -0.7 && sx <= 0.7;
      const inTopLeft = sx >= -0.7 && sx <= -0.7 + thick && sy >= -0.85 && sy <= -0.11 + barH;
      const inBotRight = sx >= 0.7 - thick && sx <= 0.7 && sy >= -0.11 && sy <= 0.63 + barH;

      // Diagonal stealth cuts for high-tech aesthetic
      const cut1 = (sx + sy) > 1.25;
      const cut2 = (-sx - sy) > 1.25;

      if ((inTopBar || inMidBar || inBotBar || inTopLeft || inBotRight) && !cut1 && !cut2) {
        // Metallic Silver & Platinum Gradient for the Shadow 'S'
        const metalGrad = (sx + sy + 2) / 4;
        const brightness = Math.min(255, Math.floor(190 + 65 * Math.sin(metalGrad * Math.PI)));
        r = brightness;
        g = Math.floor(brightness * 0.96);
        b = Math.floor(brightness * 0.98);
        a = 255;
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  // Deflate IDAT data
  const deflated = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const png = Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', deflated),
    makeChunk('IEND', Buffer.alloc(0))
  ]);

  fs.writeFileSync(outputPath, png);
  console.log(`Generated: ${outputPath} (${png.length} bytes, ${size}x${size})`);
}

// Generate all required icons
const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');

const targets = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 48, name: 'favicon.png' },
  { size: 512, name: 'logo.png' },
  { size: 512, name: 'shadow-logo.png' },
];

for (const t of targets) {
  generateShadowIconPNG(t.size, path.join(publicDir, t.name));
  if (fs.existsSync(distDir)) {
    generateShadowIconPNG(t.size, path.join(distDir, t.name));
  }
}
