import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const out = process.argv[3];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
const COLS = 6, CELL = 220, PAD = 4, LABEL = 18;
const perSheet = COLS * 5; // 30 par planche

for (let s = 0; s * perSheet < files.length; s++) {
  const batch = files.slice(s * perSheet, (s + 1) * perSheet);
  const rows = Math.ceil(batch.length / COLS);
  const W = COLS * (CELL + PAD) + PAD;
  const H = rows * (CELL + LABEL + PAD) + PAD;
  const composites = [];
  for (let i = 0; i < batch.length; i++) {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = PAD + col * (CELL + PAD);
    const y = PAD + row * (CELL + LABEL + PAD);
    const buf = await sharp(path.join(dir, batch[i]))
      .resize(CELL, CELL, { fit: 'contain', background: '#fff' }).toBuffer();
    composites.push({ input: buf, left: x, top: y });
    const num = batch[i].replace('.jpg', '');
    const svg = `<svg width="${CELL}" height="${LABEL}"><rect width="100%" height="100%" fill="#fff"/><text x="${CELL/2}" y="13" font-family="Helvetica" font-size="13" font-weight="bold" fill="#111" text-anchor="middle">${num}</text></svg>`;
    composites.push({ input: Buffer.from(svg), left: x, top: y + CELL });
  }
  const file = out.replace('.jpg', `-${s + 1}.jpg`);
  await sharp({ create: { width: W, height: H, channels: 3, background: '#e9e9e9' } })
    .composite(composites).jpeg({ quality: 78 }).toFile(file);
  console.log(file, W + 'x' + H, batch.length + ' vignettes');
}
