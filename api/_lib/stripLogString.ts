// Strip control characters that break log aggregation:
//   - newline-stuffing fakes extra log entries in jq/Vercel viewers,
//   - CR rolls back the cursor in some terminals,
//   - other C0 controls (BEL, BS, ESC) confuse pipelines.
//
// We keep TAB (\x09) for readability; collapse CR/LF runs to a single
// space; drop the rest. Caps the result at `max` characters so a
// malicious client can't blow up log size.

const NEWLINES_RE = /[\r\n]+/g;
// All C0 controls except TAB (\x09). The eslint disable is intentional —
// control chars here are exactly what we mean to strip from log payloads.
// eslint-disable-next-line no-control-regex
const CONTROLS_RE = /[\x00-\x08\x0b-\x1f]/g;

export const stripLogString = (input: string, max = 500): string =>
  input.replace(NEWLINES_RE, ' ').replace(CONTROLS_RE, '').slice(0, max);
