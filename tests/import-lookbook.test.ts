import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { importLookbook } from '../scripts/import-lookbook.mjs';

let tmp: string;
let sourceDir: string;
let publicDir: string;
let manifestPath: string;

async function writeImage(file: string, width: number, height: number) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const img = sharp({ create: { width, height, channels: 3, background: '#888' } });
  await (file.endsWith('.png') ? img.png() : img.jpeg()).toFile(file);
}

beforeEach(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'haitch-lookbook-'));
  sourceDir = path.join(tmp, 'LOOKBOOK');
  publicDir = path.join(tmp, 'public');
  manifestPath = path.join(tmp, 'lookbook.json');

  // Portrait jpg at the root, landscape png in a subfolder.
  await writeImage(path.join(sourceDir, 'LookBook__1200.jpg'), 400, 500);
  // The very next frame of the same set: visually identical, so it stacks with 1200.
  await writeImage(path.join(sourceDir, 'LookBook__1201.jpg'), 400, 500);
  await writeImage(path.join(sourceDir, 'BOOKLET SELECTS', 'Copy of LookBook__0900.png'), 500, 400);
  // The same frame twice: a small root copy and a larger select. The larger wins.
  await writeImage(path.join(sourceDir, 'Copy of LookBook__1345X.jpg'), 100, 125);
  await writeImage(path.join(sourceDir, 'BOOKLET SELECTS', 'Copy of LookBook__1345 1 X.jpg'), 400, 500);
  // Clutter that must be ignored.
  fs.writeFileSync(path.join(sourceDir, '.DS_Store'), 'junk');
  fs.writeFileSync(path.join(sourceDir, '._LookBook__1200.jpg'), 'junk');
  // Stale output from a previous run.
  await writeImage(path.join(publicDir, 'lookbook', '0001.jpg'), 10, 10);
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('import-lookbook script', () => {
  test('writes one jpeg per unique frame, named by frame number, with stale output removed', async () => {
    await importLookbook({ sourceDir, publicDir, manifestPath, maxWidth: 200, maxHeight: 250, quality: 80 });
    expect(fs.readdirSync(path.join(publicDir, 'lookbook')).sort()).toEqual([
      '0900.jpg',
      '1200.jpg',
      '1201.jpg',
      '1345.jpg',
    ]);
  });

  test('keeps the largest file when a frame appears more than once', async () => {
    await importLookbook({ sourceDir, publicDir, manifestPath, maxWidth: 200, maxHeight: 250, quality: 80 });
    const meta = await sharp(path.join(publicDir, 'lookbook', '1345.jpg')).metadata();
    // The 400x500 select scales to fit 200x250; the 100x125 copy would have stayed 100x125.
    expect([meta.width, meta.height]).toEqual([200, 250]);
  });

  test('fits both orientations inside the box without enlarging', async () => {
    await importLookbook({ sourceDir, publicDir, manifestPath, maxWidth: 200, maxHeight: 250, quality: 80 });
    const portrait = await sharp(path.join(publicDir, 'lookbook', '1200.jpg')).metadata();
    const landscape = await sharp(path.join(publicDir, 'lookbook', '0900.jpg')).metadata();
    expect([portrait.width, portrait.height]).toEqual([200, 250]);
    expect([landscape.width, landscape.height]).toEqual([200, 160]);
  });

  test('writes a manifest in frame order with the real output dimensions and a stack group', async () => {
    await importLookbook({ sourceDir, publicDir, manifestPath, maxWidth: 200, maxHeight: 250, quality: 80 });
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(manifest).toEqual({
      images: [
        { src: '/lookbook/0900.jpg', width: 200, height: 160, group: 1 },
        { src: '/lookbook/1200.jpg', width: 200, height: 250, group: 2 },
        { src: '/lookbook/1201.jpg', width: 200, height: 250, group: 2 },
        { src: '/lookbook/1345.jpg', width: 200, height: 250, group: 3 },
      ],
    });
  });

  test('starts a new stack when frames are far apart, look different, or change orientation', async () => {
    // Same set, adjacent frame numbers, but a visibly different picture.
    await writeImage(path.join(sourceDir, 'LookBook__1202.jpg'), 400, 500);
    await sharp({ create: { width: 400, height: 500, channels: 3, background: '#fff' } })
      .composite([{ input: { create: { width: 400, height: 250, channels: 3, background: '#000' } }, top: 0, left: 0 }])
      .jpeg()
      .toFile(path.join(sourceDir, 'LookBook__1202.jpg'));
    await importLookbook({ sourceDir, publicDir, manifestPath, maxWidth: 200, maxHeight: 250, quality: 80 });
    const { images } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const group = (frame: string) => images.find((i: { src: string }) => i.src.includes(frame)).group;
    expect(group('1200')).toBe(group('1201'));
    expect(group('1202')).not.toBe(group('1201'));
    expect(group('1345')).not.toBe(group('1202'));
    expect(group('0900')).not.toBe(group('1200'));
  });
});
