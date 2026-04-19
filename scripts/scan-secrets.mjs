#!/usr/bin/env node
// PR #7b: CODE_REVIEW H16 — pre-commit secret scanner.
//
// Inspired by gitleaks rules but implemented in pure Node so contributors
// do not need to install a binary. Runs in two modes:
//
//   node scripts/scan-secrets.mjs            # scan every tracked file
//   node scripts/scan-secrets.mjs --staged   # scan only files staged
//                                            # for the current commit
//
// Exit code is non-zero on any match. Intentionally short ruleset; the
// goal is to catch obvious mistakes (pasted service-role key, AWS access
// key, .env file committed) rather than replace a dedicated scanner.

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';

const STAGED = process.argv.includes('--staged');

// Each rule: { name, pattern, allowFiles? }
// allowFiles: optional regex of paths where this pattern is NOT a secret
// (e.g. docs/CODE_REVIEW.md quotes these patterns as examples).
const RULES = [
  {
    name: 'Supabase service_role JWT',
    pattern: /eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
    // Only flag if context also mentions service_role — anon JWTs are
    // legitimately present in VITE_* env lines.
    contextRequired: /service[_\s-]*role/i,
  },
  {
    name: 'AWS access key',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    name: 'AWS secret key (40-char high-entropy)',
    pattern: /\baws(.{0,20})?['"][0-9a-zA-Z/+]{40}['"]/i,
  },
  {
    name: 'Stripe live secret',
    pattern: /\bsk_live_[0-9a-zA-Z]{24,}\b/,
  },
  {
    name: 'Stripe restricted key',
    pattern: /\brk_live_[0-9a-zA-Z]{24,}\b/,
  },
  {
    name: 'GitHub personal access token',
    pattern: /\bghp_[A-Za-z0-9]{36}\b/,
  },
  {
    name: 'GitHub OAuth token',
    pattern: /\bgho_[A-Za-z0-9]{36}\b/,
  },
  {
    name: 'Slack bot token',
    pattern: /\bxox[baprs]-[0-9]{10,}-[0-9]{10,}-[A-Za-z0-9]{20,}\b/,
  },
  {
    name: 'Google API key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    name: 'Private key block',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/,
  },
  {
    name: 'Telegram bot token',
    pattern: /\b[0-9]{8,10}:[A-Za-z0-9_-]{35}\b/,
  },
];

// Paths that are allowed to contain example secrets (docs quoting patterns).
const ALLOW_PATHS = [
  /^docs\/CODE_REVIEW\.md$/,
  /^AUDIT_[0-9-]+\.md$/,
  /^scripts\/scan-secrets\.mjs$/, // the rules themselves
  /^\.gitleaks\.toml$/,
];

// Never scan — large binaries, lockfiles (they contain lots of hex that
// is not secret), build output.
const SKIP_PATHS = [
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /^pnpm-lock\.yaml$/,
  /^dist\//,
  /^build\//,
  /^node_modules\//,
  /^\.next\//,
  /^coverage\//,
  /^playwright-report\//,
  /\.(png|jpg|jpeg|gif|webp|ico|pdf|woff2?|ttf|eot|mp4|webm|zip|gz)$/i,
];

function getFiles() {
  try {
    if (STAGED) {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', {
        encoding: 'utf8',
      });
      return out.split('\n').map((s) => s.trim()).filter(Boolean);
    }
    const out = execSync('git ls-files', { encoding: 'utf8' });
    return out.split('\n').map((s) => s.trim()).filter(Boolean);
  } catch (err) {
    console.error('scan-secrets: failed to list files from git:', err.message);
    process.exit(2);
  }
}

function shouldSkip(file) {
  return SKIP_PATHS.some((re) => re.test(file));
}

function isAllowed(file) {
  return ALLOW_PATHS.some((re) => re.test(file));
}

function scanContent(file, content) {
  const hits = [];
  const lowerContext = content.toLowerCase();
  for (const rule of RULES) {
    const match = content.match(rule.pattern);
    if (!match) continue;
    if (rule.contextRequired && !rule.contextRequired.test(lowerContext)) continue;
    hits.push({
      rule: rule.name,
      snippet: match[0].slice(0, 40) + (match[0].length > 40 ? '…' : ''),
      file,
    });
  }
  return hits;
}

function main() {
  const files = getFiles();
  if (files.length === 0) {
    if (STAGED) return; // nothing staged — nothing to scan
  }

  const findings = [];
  for (const file of files) {
    if (shouldSkip(file)) continue;
    if (isAllowed(file)) continue;
    if (!existsSync(file)) continue;
    try {
      const st = statSync(file);
      if (!st.isFile()) continue;
      if (st.size > 2 * 1024 * 1024) continue; // skip >2MB
    } catch {
      continue;
    }
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue; // binary/unreadable
    }
    findings.push(...scanContent(file, content));
  }

  if (findings.length === 0) {
    if (!STAGED) console.log('scan-secrets: OK (no matches)');
    return;
  }

  console.error('');
  console.error('scan-secrets: possible secret(s) detected — aborting commit.');
  console.error('');
  for (const f of findings) {
    console.error(`  [${f.rule}] ${f.file}`);
    console.error(`      ↳ ${f.snippet}`);
  }
  console.error('');
  console.error('If this is a false positive, move the example to docs/CODE_REVIEW.md');
  console.error('or add an allow-path in scripts/scan-secrets.mjs.');
  process.exit(1);
}

main();
