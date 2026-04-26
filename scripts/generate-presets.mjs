#!/usr/bin/env node
// Generate Visual LED preset background images via fal.ai Flux 1.1 Pro Ultra,
// then composite a small "≈ 1.75 м рост" badge in the bottom-right corner so
// the user immediately sees the in-frame human is the scale reference.
//
// Manual calibration in the visualizer is done against the in-frame
// human reference. The badge intentionally has NO ruler bar — having two
// scale references that disagree confused users.
//
// Usage:
//   FAL_KEY=... node scripts/generate-presets.mjs                 # all (skip existing)
//   FAL_KEY=... node scripts/generate-presets.mjs concert-stage   # one preset by slug
//   FAL_KEY=... node scripts/generate-presets.mjs --dry-run       # print prompts only
//   FAL_KEY=... node scripts/generate-presets.mjs --force         # overwrite existing
//   node scripts/generate-presets.mjs --composite-only            # repaint badges only
//   node scripts/generate-presets.mjs --composite-only flagship-arena  # one badge
//
// `--composite-only` skips the fal.ai call entirely — useful when only
// the badge SVG changed and you want to repaint without spending API $$.
// The new badge background is opaque enough to fully cover any old badge
// underneath.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

loadEnv({ path: resolve(ROOT, '.env.local') });
loadEnv({ path: resolve(ROOT, '.env') });

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const FORCE = argv.includes('--force');
const COMPOSITE_ONLY = argv.includes('--composite-only');
const onlySlug = argv.find((a) => !a.startsWith('--'));

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY && !COMPOSITE_ONLY && !DRY_RUN) {
  console.error('FAL_KEY is missing. Put it in .env.local as FAL_KEY=<id>:<secret>.');
  process.exit(1);
}

const FAL_ENDPOINT = 'https://fal.run/fal-ai/flux-pro/v1.1-ultra';
const OUTPUT_DIR = resolve(ROOT, 'public/visual-led-presets');
const PROMPTS_FILE = resolve(ROOT, 'scripts/preset-prompts.json');

const promptConfig = JSON.parse(await readFile(PROMPTS_FILE, 'utf8'));
const prompts = promptConfig.prompts;
const sharedNegative = promptConfig._meta?.shared_negative?.trim();
const targets = onlySlug
  ? prompts.filter((p) => p.slug === onlySlug)
  : prompts;

if (targets.length === 0) {
  console.error(`No prompt matches "${onlySlug}". Available:\n  ${prompts.map((p) => p.slug).join('\n  ')}`);
  process.exit(1);
}

await mkdir(OUTPUT_DIR, { recursive: true });

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function callFal(prompt) {
  // fal.ai accepts both "Key <id>:<secret>" (legacy) and "Bearer <token>"
  // (new). Our key has a colon — try Key first.
  const body = {
    prompt,
    aspect_ratio: '16:9',
    num_images: 1,
    output_format: 'jpeg',
    enable_safety_checker: true,
    raw: false,
  };

  const tryAuth = async (authHeader) => {
    const res = await fetch(FAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });
    return res;
  };

  let res = await tryAuth(`Key ${FAL_KEY}`);
  if (res.status === 401 || res.status === 403) {
    res = await tryAuth(`Bearer ${FAL_KEY}`);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

function buildPrompt(item) {
  if (!sharedNegative) return item.prompt;
  return `${item.prompt}. Negative constraints: ${sharedNegative}.`;
}

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Bottom-right badge — opaque dark pill with a tiny human silhouette and
 * a "≈ 1.75 м рост" label. No ruler bar, by design: the only authoritative
 * scale reference for the visualizer is the AI human INSIDE the scene.
 * Having two competing scales (badge bar vs in-frame human) misled users
 * who saw them disagree.
 *
 * Background alpha is 0.92 so this badge fully covers any earlier badge
 * underneath when re-composited via --composite-only.
 */
function buildBadgeSvg(imageWidth) {
  const badgeW = Math.max(220, Math.min(360, Math.round(imageWidth * 0.22)));
  // 0.42 height ratio is intentional — fully covers the previous badge
  // shape so --composite-only never bleeds the old one through.
  const badgeH = Math.round(badgeW * 0.42);
  const personH = Math.round(badgeH * 0.55);
  const personX = Math.round(badgeW * 0.16);
  const personY = Math.round(badgeH * 0.86);
  const headR = Math.round(personH * 0.13);
  const bodyTop = personY - personH + headR * 2;
  const bodyW = Math.round(personH * 0.24);

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${badgeW}" height="${badgeH}" viewBox="0 0 ${badgeW} ${badgeH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${badgeW}" height="${badgeH}" rx="10" fill="rgb(8,12,20)"/>
  <circle cx="${personX}" cy="${personY - personH + headR}" r="${headR}" fill="white"/>
  <rect x="${personX - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${personY - bodyTop}" rx="${bodyW * 0.4}" fill="white"/>
  <text x="${personX + personH * 0.5}" y="${badgeH * 0.45}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(badgeH * 0.2)}" font-weight="700" fill="white">≈ 1.75 м</text>
  <text x="${personX + personH * 0.5}" y="${badgeH * 0.7}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(badgeH * 0.12)}" fill="rgba(255,255,255,0.75)">рост человека в кадре</text>
  <text x="${badgeW - 12}" y="${badgeH * 0.94}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(badgeH * 0.1)}" fill="rgba(255,255,255,0.55)" text-anchor="end">визуальный ориентир</text>
</svg>`);
}

async function compositeBadge(srcBuffer) {
  const img = sharp(srcBuffer);
  const meta = await img.metadata();
  const w = meta.width ?? 1408;
  const h = meta.height ?? 792;
  const overlay = buildBadgeSvg(w);
  const overlayMeta = await sharp(overlay).metadata();
  const overlayW = overlayMeta.width ?? 280;
  const overlayH = overlayMeta.height ?? 90;
  const margin = Math.round(Math.min(w, h) * 0.025);
  const left = w - overlayW - margin;
  const top = h - overlayH - margin;
  return img
    .composite([{ input: overlay, left, top }])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

async function downloadAndComposite(url, path) {
  const buf = await downloadBuffer(url);
  const composed = await compositeBadge(buf);
  await writeFile(path, composed);
}

async function recompositeExisting(path) {
  const src = await readFile(path);
  const composed = await compositeBadge(src);
  await writeFile(path, composed);
}

const results = [];

for (const item of targets) {
  const outPath = resolve(OUTPUT_DIR, `${item.slug}.jpg`);

  if (COMPOSITE_ONLY) {
    if (!(await exists(outPath))) {
      console.log(`✗ ${item.slug}: no image at ${outPath} — generate it first without --composite-only`);
      results.push({ slug: item.slug, status: 'missing', path: outPath });
      continue;
    }
    try {
      await recompositeExisting(outPath);
      console.log(`  ✓ repainted ${item.slug}`);
      results.push({ slug: item.slug, status: 'repainted', path: outPath });
    } catch (err) {
      console.error(`  ✗ ${item.slug}: ${err.message}`);
      results.push({ slug: item.slug, status: 'error', error: err.message });
    }
    continue;
  }

  if (!FORCE && (await exists(outPath))) {
    console.log(`✓ skip (exists): ${item.slug}  (pass --force to overwrite)`);
    results.push({ slug: item.slug, status: 'skipped', path: outPath });
    continue;
  }

  console.log(`→ ${item.slug}: ${item.title}`);
  if (DRY_RUN) {
    console.log(`  prompt: ${buildPrompt(item).slice(0, 120)}…`);
    results.push({ slug: item.slug, status: 'dry-run' });
    continue;
  }

  try {
    const t0 = Date.now();
    const result = await callFal(buildPrompt(item));
    const url = result?.images?.[0]?.url;
    if (!url) throw new Error(`no image URL in response: ${JSON.stringify(result).slice(0, 200)}`);
    await downloadAndComposite(url, outPath);
    const seconds = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`  ✓ saved ${outPath} (${seconds}s)`);
    results.push({ slug: item.slug, status: 'ok', path: outPath, seed: result?.seed });
  } catch (err) {
    console.error(`  ✗ ${item.slug}: ${err.message}`);
    results.push({ slug: item.slug, status: 'error', error: err.message });
  }
}

console.log('\nSummary:');
for (const r of results) {
  console.log(`  ${r.status.padEnd(10)} ${r.slug}${r.path ? '  →  ' + r.path : ''}`);
}
const failed = results.filter((r) => r.status === 'error').length;
process.exit(failed > 0 ? 1 : 0);
