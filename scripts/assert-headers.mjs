#!/usr/bin/env node
// Assert HTTP security headers on a deployment URL.
// Usage: node scripts/assert-headers.mjs <url>
//
// Rules evolve with the rollout plan — update EXPECTED below after each phase.

import { argv, env, exit } from 'node:process';

const url = argv[2];
if (!url) {
  console.error('usage: assert-headers.mjs <url>');
  exit(2);
}

// Vercel Deployment Protection returns 401 with an auth wall HTML instead
// of routing to our app. Forward the bypass token from a GH secret so CI
// can see our real headers. In the Vercel dashboard:
//   Settings → Deployment Protection → Protection Bypass for Automation
// and add the same value as `VERCEL_PROTECTION_BYPASS` repo secret.
const BYPASS = env.VERCEL_PROTECTION_BYPASS || env.VERCEL_AUTOMATION_BYPASS_SECRET;
const bypassHeaders = BYPASS
  ? {
      'x-vercel-protection-bypass': BYPASS,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : {};

const EXPECTED = {
  'content-security-policy': {
    required: true,
    contains: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      'frame-ancestors',
    ],
  },
  'strict-transport-security': {
    required: true,
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
    required: true,
  },
  'permissions-policy': {
    required: true,
    contains: ['camera=()'],
  },
};

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`OK: ${msg}`);
}

// Vercel's Protection Bypass flow on the first request sets a bypass
// cookie and 307-redirects to the same URL. Without a cookie jar the
// redirect loops. Parse Set-Cookie and echo it back on each hop.
function collectCookies(res, jar) {
  const raw = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie')].filter(Boolean);
  for (const entry of raw) {
    const [pair] = entry.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

function cookieHeader(jar) {
  if (jar.size === 0) return undefined;
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function fetchFollowing(startUrl, maxHops = 5) {
  let current = startUrl;
  const jar = new Map();
  for (let hop = 0; hop <= maxHops; hop += 1) {
    const cookie = cookieHeader(jar);
    const headers = cookie ? { ...bypassHeaders, cookie } : { ...bypassHeaders };
    const res = await fetch(current, { redirect: 'manual', headers });
    console.log(`Fetched ${current} -> ${res.status}`);
    collectCookies(res, jar);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return res;
      current = new URL(loc, current).toString();
      continue;
    }
    return res;
  }
  throw new Error(`too many redirects starting at ${startUrl}`);
}

async function main() {
  const res = await fetchFollowing(url);

  if (res.status === 401 || res.status === 403) {
    const serverHeader = res.headers.get('server') || '';
    const vercelAuth = res.headers.get('x-vercel-protection-bypass-expected');
    if (/vercel/i.test(serverHeader) || vercelAuth) {
      console.error('');
      console.error('FAIL: hit Vercel Deployment Protection auth wall.');
      console.error('  The preview is private; our app headers are not reachable.');
      console.error('  Fix: add Protection Bypass for Automation in Vercel, then');
      console.error('  set the same value as repo secret VERCEL_PROTECTION_BYPASS');
      console.error('  and expose it to this step in verify-deploy.yml.');
      exit(1);
    }
  }

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
