#!/usr/bin/env node
// Downscales the LOOKBOOK shoot (any nesting of folders) into public/lookbook,
// one JPEG per unique frame number, and writes lib/lookbook.json with each
// image's path and output dimensions.
//
//   node scripts/import-lookbook.mjs ~/Downloads/LOOKBOOK [--max-width 1600] [--max-height 2000] [--quality 78]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const PHOTO = /\.(jpe?g|png)$/i;
const FRAME = /(\d{4})/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return PHOTO.test(entry.name) ? [full] : [];
  });
}

// One file per frame number; when a frame was exported more than once, keep the largest file.
function uniqueFrames(files) {
  const byFrame = new Map();
  for (const file of files) {
    const match = FRAME.exec(path.basename(file));
    if (!match) continue;
    const frame = match[1];
    const current = byFrame.get(frame);
    if (!current || fs.statSync(file).size > fs.statSync(current).size) byFrame.set(frame, file);
  }
  return [...byFrame.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export async function importLookbook({
  sourceDir,
  publicDir,
  manifestPath,
  maxWidth = 1600,
  maxHeight = 2000,
  quality = 78,
}) {
  const frames = uniqueFrames(walk(sourceDir));

  const outDir = path.join(publicDir, 'lookbook');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const images = [];
  for (const [frame, file] of frames) {
    const name = `${frame}.jpg`;
    const { width, height } = await sharp(file, { limitInputPixels: false })
      .rotate()
      .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toFile(path.join(outDir, name));
    images.push({ src: `/lookbook/${name}`, width, height });
  }

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify({ images }, null, 2)}\n`);
  return images;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'max-width': { type: 'string', default: '1600' },
      'max-height': { type: 'string', default: '2000' },
      quality: { type: 'string', default: '78' },
    },
  });
  const sourceDir = positionals[0];
  if (!sourceDir) {
    console.error('usage: node scripts/import-lookbook.mjs <sourceDir> [--max-width 1600] [--max-height 2000] [--quality 78]');
    process.exit(1);
  }
  const root = path.resolve(fileURLToPath(import.meta.url), '../..');
  const images = await importLookbook({
    sourceDir: path.resolve(sourceDir),
    publicDir: path.join(root, 'public'),
    manifestPath: path.join(root, 'lib', 'lookbook.json'),
    maxWidth: Number(values['max-width']),
    maxHeight: Number(values['max-height']),
    quality: Number(values.quality),
  });
  console.log(`${images.length} lookbook images written`);
}
