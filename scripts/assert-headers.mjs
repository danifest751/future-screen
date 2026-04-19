#!/usr/bin/env node
// Assert HTTP security headers on a deployment URL.
// Usage: node scripts/assert-headers.mjs <url>
//
// Rules evolve with the rollout plan — update EXPECTED below after each phase.

import { argv, exit } from 'node:process';

const url = argv[2];
if (!url) {
  console.error('usage: assert-headers.mjs <url>');
  exit(2);
}

const EXPECTED = {
  // Phase 1 баseline — эти директивы ДОЛЖНЫ появиться после PR #1.
  // Пока PR #1 не замержен в preview — отмечены как optional:true,
  // workflow не будет падать, но будет предупреждать.
  'content-security-policy': {
    required: true,
    contains: ["default-src 'self'", "frame-ancestors"],
    // после PR #1:
    shouldContainAfterPhase1: ["base-uri 'self'", "form-action 'self'", "object-src 'none'"],
  },
  'strict-transport-security': {
    required: false, // станет required после PR #1
    contains: ['max-age='],
  },
  'x-content-type-options': {
    required: true,
    equals: 'nosniff',
  },
  'x-frame-options': {
    required: true,
    anyOf: ['DENY', 'SAMEORIGIN'],
  },
  'referrer-policy': {
    required: false,
  },
};

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`OK: ${msg}`);
}

async function main() {
  const res = await fetch(url, { redirect: 'manual' });
  console.log(`Fetched ${url} -> ${res.status}`);
  const headers = Object.fromEntries(
    [...res.headers.entries()].map(([k, v]) => [k.toLowerCase(), v]),
  );

  // HTML-level check: no <meta CSP>
  if ((headers['content-type'] || '').includes('text/html')) {
    const body = await res.text();
    const metaCsp = /<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(body);
    if (metaCsp) {
      fail('index.html contains <meta CSP> — should be removed after PR #1');
    } else {
      pass('no <meta CSP> in HTML');
    }
  }

  for (const [name, rule] of Object.entries(EXPECTED)) {
    const value = headers[name];
    if (!value) {
      if (rule.required) fail(`header "${name}" is missing`);
      else console.log(`WARN: header "${name}" not set (optional)`);
      continue;
    }
    if (rule.equals && value !== rule.equals) {
      fail(`header "${name}" = "${value}", expected "${rule.equals}"`);
      continue;
    }
    if (rule.anyOf && !rule.anyOf.includes(value)) {
      fail(`header "${name}" = "${value}", expected one of ${rule.anyOf.join(', ')}`);
      continue;
    }
    if (rule.contains) {
      for (const sub of rule.contains) {
        if (!value.includes(sub)) {
          fail(`header "${name}" missing "${sub}" (got: ${value.slice(0, 120)}...)`);
          continue;
        }
      }
    }
    if (rule.shouldContainAfterPhase1) {
      for (const sub of rule.shouldContainAfterPhase1) {
        if (!value.includes(sub)) {
          console.log(`WARN: header "${name}" missing "${sub}" (expected after PR #1)`);
        }
      }
    }
    pass(`header "${name}" OK`);
  }

  if (process.exitCode === 1) {
    console.error('\nHeaders assertion FAILED');
    exit(1);
  }
  console.log('\nAll header checks passed');
}

main().catch((err) => {
  console.error('unexpected error:', err);
  exit(2);
});
