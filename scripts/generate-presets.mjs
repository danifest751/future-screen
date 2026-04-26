#!/usr/bin/env node
// Generate Visual LED preset background images via fal.ai Flux 1.1 Pro Ultra.
//
// Usage:
//   FAL_KEY=... node scripts/generate-presets.mjs                 # all prompts
//   FAL_KEY=... node scripts/generate-presets.mjs concert-stage   # one prompt by slug
//   FAL_KEY=... node scripts/generate-presets.mjs --dry-run       # print prompts, don't call API
//
// Reads scripts/preset-prompts.json, calls fal.ai sync endpoint,
// writes results into public/visual-led-presets/<slug>.jpg.
// Skips files that already exist (re-run is idempotent).

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

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

async function downloadTo(url, path) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  await writeFile(path, Buffer.from(arrayBuffer));
}

const results = [];

for (const item of targets) {
  const outPath = resolve(OUTPUT_DIR, `${item.slug}.jpg`);

  if (await exists(outPath)) {
    console.log(`✓ skip (exists): ${item.slug}`);
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
    await downloadTo(url, outPath);
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
