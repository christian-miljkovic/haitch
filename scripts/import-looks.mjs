#!/usr/bin/env node
// Downscales a folder of "Look N" photo directories into public/looks and
// writes lib/looks.json listing the site-relative image paths per look.
//
//   node scripts/import-looks.mjs ~/Downloads/High-res-Ecom [--width 2000] [--quality 80]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const LOOK_DIR = /^Look (\d+)$/;
const PHOTO = /\.jpe?g$/i;

export async function importLooks({ sourceDir, publicDir, manifestPath, width = 2000, quality = 80 }) {
  const lookDirs = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && LOOK_DIR.test(entry.name))
    .map((entry) => ({ look: Number(LOOK_DIR.exec(entry.name)[1]), dir: path.join(sourceDir, entry.name) }))
    .sort((a, b) => a.look - b.look);

  const looksOut = path.join(publicDir, 'looks');
  fs.rmSync(looksOut, { recursive: true, force: true });

  const looks = [];
  for (const { look, dir } of lookDirs) {
    const files = fs
      .readdirSync(dir)
      .filter((file) => PHOTO.test(file) && !file.startsWith('.'))
      .sort();
    const outDir = path.join(looksOut, `look-${look}`);
    fs.mkdirSync(outDir, { recursive: true });

    const images = [];
    for (const [index, file] of files.entries()) {
      const name = `${String(index + 1).padStart(2, '0')}.jpg`;
      await sharp(path.join(dir, file), { limitInputPixels: false })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toFile(path.join(outDir, name));
      images.push(`/looks/look-${look}/${name}`);
    }
    looks.push({ look, images });
  }

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify({ looks }, null, 2)}\n`);
  return looks;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      width: { type: 'string', default: '2000' },
      quality: { type: 'string', default: '80' },
    },
  });
  const sourceDir = positionals[0];
  if (!sourceDir) {
    console.error('usage: node scripts/import-looks.mjs <sourceDir> [--width 2000] [--quality 80]');
    process.exit(1);
  }
  const root = path.resolve(fileURLToPath(import.meta.url), '../..');
  const looks = await importLooks({
    sourceDir: path.resolve(sourceDir),
    publicDir: path.join(root, 'public'),
    manifestPath: path.join(root, 'lib', 'looks.json'),
    width: Number(values.width),
    quality: Number(values.quality),
  });
  for (const { look, images } of looks) console.log(`Look ${look}: ${images.length} photos`);
}
