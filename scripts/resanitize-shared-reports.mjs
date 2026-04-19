#!/usr/bin/env node
// PR #6: re-sanitize every row in `shared_reports` through DOMPurify.
//
// The previous check was a naive .includes('<script') and shipped nothing
// else — stored XSS payloads could have been persisted. Run this once
// after deploying the DOMPurify fix to neutralise any historical HTML.
//
// Requires env:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/resanitize-shared-reports.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js';
import DOMPurify from 'isomorphic-dompurify';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('ERR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(2);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function sanitize(html) {
  return DOMPurify.sanitize(String(html).trim(), {
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'meta', 'link', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'srcdoc'],
    ALLOW_DATA_ATTR: false,
    WHOLE_DOCUMENT: true,
    RETURN_TRUSTED_TYPE: false,
  });
}

async function main() {
  const pageSize = 100;
  let offset = 0;
  let total = 0;
  let rewritten = 0;

  for (;;) {
    const { data, error } = await admin
      .from('shared_reports')
      .select('slug, html')
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      total += 1;
      const clean = sanitize(row.html || '');
      if (clean === row.html) continue;

      console.log(`${DRY_RUN ? '[dry-run]' : ''} slug=${row.slug}  delta=${row.html.length - clean.length} chars`);
      if (!DRY_RUN) {
        const { error: updateError } = await admin
          .from('shared_reports')
          .update({ html: clean })
          .eq('slug', row.slug);
        if (updateError) {
          console.error(`ERR: slug=${row.slug}: ${updateError.message}`);
          continue;
        }
      }
      rewritten += 1;
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log('');
  console.log(`Total rows:   ${total}`);
  console.log(`Rewritten:    ${rewritten}${DRY_RUN ? ' (dry-run)' : ''}`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
