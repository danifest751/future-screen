#!/usr/bin/env node
// PR #4b: backfill user_metadata.role -> app_metadata.role
//
// Safe to run repeatedly. Only writes app_metadata.role if it is currently
// null/absent and user_metadata.role has a valid value.
//
// Requires env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (service role — do NOT commit this key)
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-app-metadata-role.mjs [--dry-run]

import { setDefaultResultOrder } from 'node:dns';
import { createClient } from '@supabase/supabase-js';

// Windows default is 'verbatim' (IPv6 first when returned by DNS); when
// IPv6 is not truly routable the 10s connect timeout fires before Node
// falls back to IPv4. Force v4-first so fetch hits Supabase/Cloudflare
// over the IPv4 address straight away.
setDefaultResultOrder('ipv4first');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('ERR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(2);
}

const VALID_ROLES = new Set(['admin', 'editor', 'viewer']);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function parseRole(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return VALID_ROLES.has(normalized) ? normalized : null;
}

async function* iterateUsers() {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    for (const u of data.users) yield u;
    if (data.users.length < perPage) return;
    page += 1;
  }
}

async function main() {
  let total = 0;
  let updated = 0;
  let skipped = 0;
  let alreadyOk = 0;

  for await (const user of iterateUsers()) {
    total += 1;
    const userRole = parseRole(user.user_metadata?.role);
    const appRole = parseRole(user.app_metadata?.role);

    if (appRole) {
      alreadyOk += 1;
      continue;
    }
    if (!userRole) {
      skipped += 1;
      continue;
    }

    console.log(`${DRY_RUN ? '[dry-run]' : ''} ${user.email || user.id}: user_metadata.role=${userRole} -> app_metadata.role`);

    if (!DRY_RUN) {
      const { error } = await admin.auth.admin.updateUserById(user.id, {
        app_metadata: { ...user.app_metadata, role: userRole },
      });
      if (error) {
        console.error(`ERR: ${user.id}: ${error.message}`);
        continue;
      }
    }
    updated += 1;
  }

  console.log('');
  console.log(`Total:        ${total}`);
  console.log(`Already OK:   ${alreadyOk}`);
  console.log(`Backfilled:   ${updated}${DRY_RUN ? ' (dry-run, nothing written)' : ''}`);
  console.log(`Skipped:      ${skipped} (no role in any metadata)`);
  console.log('');

  if (DRY_RUN) console.log('Re-run without --dry-run to apply.');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
