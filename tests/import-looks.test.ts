import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { importLooks } from '../scripts/import-looks.mjs';

let tmp: string;
let sourceDir: string;
let publicDir: string;
let manifestPath: string;

async function writeJpeg(file: string, width: number, height: number) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await sharp({ create: { width, height, channels: 3, background: '#888' } })
    .jpeg()
    .toFile(file);
}

beforeEach(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'haitch-looks-'));
  sourceDir = path.join(tmp, 'src');
  publicDir = path.join(tmp, 'public');
  manifestPath = path.join(tmp, 'looks.json');

  // Look 1: two shots, deliberately created out of filename order and with
  // different aspect ratios so ordering is observable in the output.
  await writeJpeg(path.join(sourceDir, 'Look 1', 'HAITCH_Look 1_0009.jpg'), 200, 400);
  await writeJpeg(path.join(sourceDir, 'Look 1', 'HAITCH_Look 1_0002.jpg'), 300, 400);
  // Look 2: one shot that is already smaller than the target width.
  await writeJpeg(path.join(sourceDir, 'Look 2', 'HAITCH_Look 2_0100.jpg'), 60, 80);
  // Look 10 sorts before "Look 2" as a string; the manifest must sort numerically.
  await writeJpeg(path.join(sourceDir, 'Look 10', 'HAITCH_Look 10_0001.jpg'), 60, 80);
  // A sibling folder that is not a look must be ignored.
  await writeJpeg(path.join(sourceDir, 'Behind the scenes', 'HAITCH_BTS_0001.jpg'), 60, 80);
  // macOS clutter that must be ignored.
  fs.writeFileSync(path.join(sourceDir, '._Look 1'), 'junk');
  fs.writeFileSync(path.join(sourceDir, '.DS_Store'), 'junk');
  fs.writeFileSync(path.join(sourceDir, 'Look 1', '.DS_Store'), 'junk');
  // A stale output from a previous run that must not survive.
  await writeJpeg(path.join(publicDir, 'looks', 'look-1', '99.jpg'), 10, 10);
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('import-looks script', () => {
  test('writes one resized, sequentially numbered jpeg per source photo in filename order', async () => {
    await importLooks({ sourceDir, publicDir, manifestPath, width: 100, quality: 80 });

    const look1 = fs.readdirSync(path.join(publicDir, 'looks', 'look-1')).sort();
    expect(look1).toEqual(['01.jpg', '02.jpg']);

    // 01 comes from _0002 (300x400 → 100x133), 02 from _0009 (200x400 → 100x200).
    const first = await sharp(path.join(publicDir, 'looks', 'look-1', '01.jpg')).metadata();
    const second = await sharp(path.join(publicDir, 'looks', 'look-1', '02.jpg')).metadata();
    expect(first.width).toBe(100);
    expect(first.height).toBe(133);
    expect(second.width).toBe(100);
    expect(second.height).toBe(200);
  });

  test('never enlarges a photo that is already smaller than the target width', async () => {
    await importLooks({ sourceDir, publicDir, manifestPath, width: 100, quality: 80 });
    const meta = await sharp(path.join(publicDir, 'looks', 'look-2', '01.jpg')).metadata();
    expect(meta.width).toBe(60);
    expect(meta.height).toBe(80);
  });

  test('only imports folders named "Look N"', async () => {
    await importLooks({ sourceDir, publicDir, manifestPath, width: 100, quality: 80 });
    expect(fs.readdirSync(path.join(publicDir, 'looks')).sort()).toEqual(['look-1', 'look-10', 'look-2']);
  });

  test('leaves the existing output untouched when the source folder does not exist', async () => {
    await expect(
      importLooks({ sourceDir: path.join(tmp, 'nope'), publicDir, manifestPath, width: 100, quality: 80 })
    ).rejects.toThrow();
    expect(fs.existsSync(path.join(publicDir, 'looks', 'look-1', '99.jpg'))).toBe(true);
    expect(fs.existsSync(manifestPath)).toBe(false);
  });

  test('removes stale files from a previous import', async () => {
    await importLooks({ sourceDir, publicDir, manifestPath, width: 100, quality: 80 });
    expect(fs.existsSync(path.join(publicDir, 'looks', 'look-1', '99.jpg'))).toBe(false);
  });

  test('writes a manifest of site-relative image paths per look, in look order', async () => {
    await importLooks({ sourceDir, publicDir, manifestPath, width: 100, quality: 80 });
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest).toEqual({
      looks: [
        { look: 1, images: ['/looks/look-1/01.jpg', '/looks/look-1/02.jpg'] },
        { look: 2, images: ['/looks/look-2/01.jpg'] },
        { look: 10, images: ['/looks/look-10/01.jpg'] },
      ],
    });
    for (const look of manifest.looks) {
      for (const img of look.images) {
        expect(fs.existsSync(path.join(publicDir, img))).toBe(true);
      }
    }
  });
});
