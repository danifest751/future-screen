#!/usr/bin/env node
// Generate Visual LED preset background images via fal.ai Flux 1.1 Pro Ultra,
// then composite a "≈ 2 м" scale-bar overlay into the bottom-right corner
// so the user has a built-in size reference when picking a preset.
//
// Usage:
//   FAL_KEY=... node scripts/generate-presets.mjs                 # all prompts (skip existing)
//   FAL_KEY=... node scripts/generate-presets.mjs concert-stage   # one prompt by slug
//   FAL_KEY=... node scripts/generate-presets.mjs --dry-run       # print prompts, don't call API
//   FAL_KEY=... node scripts/generate-presets.mjs --force         # overwrite existing files
//
// Reads scripts/preset-prompts.json, calls fal.ai sync endpoint,
// writes results into public/visual-led-presets/<slug>.jpg.

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');

loadEnv({ path: resolve(ROOT, '.env.local') });
loadEnv({ path: resolve(ROOT, '.env') });

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  console.error('FAL_KEY is missing. Put it in .env.local as FAL_KEY=<id>:<secret>.');
  process.exit(1);
}

const FAL_ENDPOINT = 'https://fal.run/fal-ai/flux-pro/v1.1-ultra';
const OUTPUT_DIR = resolve(ROOT, 'public/visual-led-presets');
const PROMPTS_FILE = resolve(ROOT, 'scripts/preset-prompts.json');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const FORCE = argv.includes('--force');
const onlySlug = argv.find((a) => !a.startsWith('--'));

const prompts = JSON.parse(await readFile(PROMPTS_FILE, 'utf8')).prompts;
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

async function downloadBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Build the SVG that gets composited into the bottom-right corner.
 *
 * Two visual references in one badge:
 *   1. Horizontal scale bar labeled "≈ N м" — drives auto-calibration
 *      (the bar pixel length is deterministic, see `BADGE_BAR_PX_AT_2752W`
 *      below; presets read this and seed `scaleCalib` on apply).
 *   2. Tiny human icon labeled "1.75 м" — purely decorative UI hint.
 *      Real perspective-aware scale comes from the AI-generated person
 *      inside the scene; this icon just reinforces "this badge is about
 *      physical size".
 *
 * Calibration in the visualizer therefore needs ZERO clicks for preset
 * users — the manual scale tool stays available for fine-tuning or for
 * users who switched to "Свой вариант".
 */
function buildScaleBarSvg(imageWidth, imageHeight, meters) {
  // Badge takes ~22% of width; clamp so it doesn't get tiny or huge.
  const badgeW = Math.max(220, Math.min(360, Math.round(imageWidth * 0.22)));
  const badgeH = Math.round(badgeW * 0.42);
  const barInset = Math.round(badgeW * 0.1);
  const barX1 = barInset;
  const barX2 = badgeW - barInset;
  const barY = Math.round(badgeH * 0.5);
  const tickH = Math.round(badgeH * 0.14);
  // Tiny human silhouette in the lower band — purely visual cue.
  const personH = Math.round(badgeH * 0.22);
  const personX = Math.round(badgeW * 0.18);
  const personY = Math.round(badgeH * 0.78);
  const headR = Math.round(personH * 0.12);
  const bodyTop = personY - personH + headR * 2;
  const bodyW = Math.round(personH * 0.22);

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${badgeW}" height="${badgeH}" viewBox="0 0 ${badgeW} ${badgeH}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${badgeW}" height="${badgeH}" rx="10" fill="rgba(0,0,0,0.6)"/>
  <text x="${badgeW / 2}" y="${badgeH * 0.24}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(badgeH * 0.18)}" font-weight="700" fill="white" text-anchor="middle">≈ ${meters} м</text>
  <line x1="${barX1}" y1="${barY}" x2="${barX2}" y2="${barY}" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <line x1="${barX1}" y1="${barY - tickH / 2}" x2="${barX1}" y2="${barY + tickH / 2}" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <line x1="${barX2}" y1="${barY - tickH / 2}" x2="${barX2}" y2="${barY + tickH / 2}" stroke="white" stroke-width="3" stroke-linecap="round"/>
  <line x1="${badgeW / 2}" y1="${barY - tickH / 3}" x2="${badgeW / 2}" y2="${barY + tickH / 3}" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <circle cx="${personX}" cy="${personY - personH + headR}" r="${headR}" fill="rgba(255,255,255,0.85)"/>
  <rect x="${personX - bodyW / 2}" y="${bodyTop}" width="${bodyW}" height="${personY - bodyTop}" rx="${bodyW * 0.4}" fill="rgba(255,255,255,0.85)"/>
  <text x="${personX + personH * 0.45}" y="${personY - personH * 0.15}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(badgeH * 0.13)}" fill="rgba(255,255,255,0.85)">≈ 1.75 м рост</text>
  <text x="${badgeW - barInset}" y="${badgeH * 0.94}" font-family="Inter, system-ui, sans-serif" font-size="${Math.round(badgeH * 0.1)}" fill="rgba(255,255,255,0.55)" text-anchor="end">визуальный ориентир</text>
</svg>`);
}

async function compositeScaleBar(srcBuffer, meters) {
  const img = sharp(srcBuffer);
  const meta = await img.metadata();
  const w = meta.width ?? 1408;
  const h = meta.height ?? 792;
  const overlay = buildScaleBarSvg(w, h, meters);
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

async function downloadTo(url, path, meters) {
  const buf = await downloadBuffer(url);
  const composed = await compositeScaleBar(buf, meters);
  await writeFile(path, composed);
}

const results = [];

for (const item of targets) {
  const outPath = resolve(OUTPUT_DIR, `${item.slug}.jpg`);

  if (!FORCE && (await exists(outPath))) {
    console.log(`✓ skip (exists): ${item.slug}  (pass --force to overwrite)`);
    results.push({ slug: item.slug, status: 'skipped', path: outPath });
    continue;
  }

  console.log(`→ ${item.slug}: ${item.title}`);
  if (DRY_RUN) {
    console.log(`  prompt: ${item.prompt.slice(0, 120)}…`);
    results.push({ slug: item.slug, status: 'dry-run' });
    continue;
  }

  try {
    const t0 = Date.now();
    const result = await callFal(item.prompt);
    const url = result?.images?.[0]?.url;
    if (!url) throw new Error(`no image URL in response: ${JSON.stringify(result).slice(0, 200)}`);
    const meters = item.referenceScaleMeters ?? 2;
    await downloadTo(url, outPath, meters);
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
  console.log(`  ${r.status.padEnd(8)} ${r.slug}${r.path ? '  →  ' + r.path : ''}`);
}
const failed = results.filter((r) => r.status === 'error').length;
process.exit(failed > 0 ? 1 : 0);
