#!/usr/bin/env node
// HTTP smoke checks on a deployment URL.
// Usage: node scripts/smoke-http.mjs <url>
//
// Expands with each phase; update CHECKS after merging each PR.

import { argv, env, exit } from 'node:process';

const base = argv[2];
if (!base) {
  console.error('usage: smoke-http.mjs <url>');
  exit(2);
}

// See assert-headers.mjs — same bypass mechanism for Vercel protection.
const BYPASS = env.VERCEL_PROTECTION_BYPASS || env.VERCEL_AUTOMATION_BYPASS_SECRET;
const bypassHeaders = BYPASS
  ? {
      'x-vercel-protection-bypass': BYPASS,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : {};

const CHECKS = [
  {
    name: 'GET / returns 200 HTML',
    path: '/',
    method: 'GET',
    expectStatus: [200],
    expectContentType: /text\/html/,
  },
  {
    // Preflight from a known-allowed Origin (prod domain). Previously we
    // sent `Origin: <preview-url>` which is NOT in ALLOWED_ORIGINS, so
    // after PR #8 hardened the empty-Origin bypass the preflight itself
    // was rejected with 403. That was correct behavior, not a bug — we
    // just need to test the positive path with a real allowed origin.
    name: 'OPTIONS /api/send from allowed origin returns 204/200',
    path: '/api/send',
    method: 'OPTIONS',
    headers: { Origin: 'https://future-screen.ru', 'Access-Control-Request-Method': 'POST' },
    expectStatus: [200, 204],
    followRedirects: false,
  },
  {
    // Negative CORS check: preflight from a bogus origin must be rejected.
    // This guards against accidentally loosening isOriginAllowed.
    name: 'OPTIONS /api/send from unknown origin is 403',
    path: '/api/send',
    method: 'OPTIONS',
    headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
    expectStatus: [403],
    followRedirects: false,
  },
  {
    name: 'GET /api/send returns 405 (POST-only)',
    path: '/api/send',
    method: 'GET',
    expectStatus: [405, 404],
  },
  // После PR #2 активируется:
  // {
  //   name: 'GET /api/telegram-webhook?action=getWebhookInfo without auth returns 401',
  //   path: '/api/telegram-webhook?action=getWebhookInfo',
  //   method: 'GET',
  //   expectStatus: [401, 403],
  // },
  {
    name: 'GET /admin without session returns HTML (SPA serves, redirect happens client-side)',
    path: '/admin',
    method: 'GET',
    expectStatus: [200, 302, 307],
  },
  {
    name: 'GET /non-existent-page returns SPA shell (not 404)',
    path: '/some-page-that-does-not-exist',
    method: 'GET',
    expectStatus: [200],
    expectContentType: /text\/html/,
  },
];

// Shared cookie jar for the whole smoke run. Vercel's Protection Bypass
// 307s to self and expects the bypass cookie back. One jar per process
// also means downstream checks reuse the bypass cookie, avoiding another
// round of set-cookie redirects.
const jar = new Map();

function collectCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? [res.headers.get('set-cookie')].filter(Boolean);
  for (const entry of raw) {
    const [pair] = entry.split(';');
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

function cookieHeader() {
  if (jar.size === 0) return undefined;
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

async function fetchFollowing(startUrl, init, maxHops = 5) {
  let current = startUrl;
  for (let hop = 0; hop <= maxHops; hop += 1) {
    const cookie = cookieHeader();
    const headers = cookie ? { ...(init.headers || {}), cookie } : init.headers;
    const res = await fetch(current, { ...init, headers, redirect: 'manual' });
    collectCookies(res);
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

async function runCheck(check) {
  const url = base.replace(/\/$/, '') + check.path;
  const init = {
    method: check.method,
    headers: { ...bypassHeaders, ...(check.headers || {}) },
  };
  // Some checks (OPTIONS preflight, explicit status probes) must NOT follow
  // redirects because the redirect itself is what we're asserting.
  const res = check.followRedirects === false
    ? await fetch(url, { ...init, redirect: 'manual' })
    : await fetchFollowing(url, init);
  const ct = res.headers.get('content-type') || '';

  if (res.status === 401 && /vercel/i.test(res.headers.get('server') || '')) {
    return {
      ok: false,
      msg: `${check.name} — Vercel auth wall (set VERCEL_PROTECTION_BYPASS secret)`,
    };
  }

  if (!check.expectStatus.includes(res.status)) {
    return { ok: false, msg: `${check.name} — got ${res.status}, expected ${check.expectStatus.join('/')}` };
  }
  if (check.expectContentType && !check.expectContentType.test(ct)) {
    return { ok: false, msg: `${check.name} — content-type "${ct}" does not match ${check.expectContentType}` };
  }
  return { ok: true, msg: `${check.name} [${res.status}]` };
}

async function main() {
  let failed = 0;
  for (const check of CHECKS) {
    try {
      const r = await runCheck(check);
      if (r.ok) console.log(`OK: ${r.msg}`);
      else {
        console.error(`FAIL: ${r.msg}`);
        failed++;
      }
    } catch (err) {
      console.error(`ERR: ${check.name} — ${err.message}`);
      failed++;
    }
  }
  if (failed > 0) {
    console.error(`\n${failed} smoke check(s) failed`);
    exit(1);
  }
  console.log('\nAll smoke checks passed');
}

main().catch((err) => {
  console.error('unexpected error:', err);
  exit(2);
});
