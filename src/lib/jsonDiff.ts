export type JsonDiffKind = 'added' | 'removed' | 'changed';

export interface JsonDiffEntry {
  /**
   * Dot/bracket path inside the parsed value, e.g. `titleLines[0]`,
   * `stats[2].value`, `["weird key"].nested`. Empty string means the root
   * value itself changed (different scalar types or array<->object).
   */
  path: string;
  kind: JsonDiffKind;
  before?: unknown;
  after?: unknown;
}

export interface JsonDiffResult {
  /** True only when both sides parsed as JSON. False means the caller should fall back to a plain text diff. */
  ok: boolean;
  entries: JsonDiffEntry[];
}

const SAFE_KEY = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const joinPath = (base: string, segment: string | number): string => {
  if (typeof segment === 'number') {
    return `${base}[${segment}]`;
  }
  if (SAFE_KEY.test(segment)) {
    return base.length === 0 ? segment : `${base}.${segment}`;
  }
  return `${base}[${JSON.stringify(segment)}]`;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const valuesEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, idx) => valuesEqual(item, b[idx]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      if (!valuesEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
};

const walk = (
  before: unknown,
  after: unknown,
  path: string,
  out: JsonDiffEntry[]
): void => {
  if (valuesEqual(before, after)) return;

  const beforeIsObj = isPlainObject(before);
  const afterIsObj = isPlainObject(after);
  if (beforeIsObj && afterIsObj) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    const sorted = Array.from(keys).sort();
    for (const key of sorted) {
      const hasBefore = Object.prototype.hasOwnProperty.call(before, key);
      const hasAfter = Object.prototype.hasOwnProperty.call(after, key);
      const childPath = joinPath(path, key);
      if (hasBefore && !hasAfter) {
        out.push({ path: childPath, kind: 'removed', before: before[key] });
      } else if (!hasBefore && hasAfter) {
        out.push({ path: childPath, kind: 'added', after: after[key] });
      } else {
        walk(before[key], after[key], childPath, out);
      }
    }
    return;
  }

  const beforeIsArr = Array.isArray(before);
  const afterIsArr = Array.isArray(after);
  if (beforeIsArr && afterIsArr) {
    const max = Math.max(before.length, after.length);
    for (let i = 0; i < max; i += 1) {
      const childPath = joinPath(path, i);
      if (i >= before.length) {
        out.push({ path: childPath, kind: 'added', after: after[i] });
      } else if (i >= after.length) {
        out.push({ path: childPath, kind: 'removed', before: before[i] });
      } else {
        walk(before[i], after[i], childPath, out);
      }
    }
    return;
  }

  // Scalar mismatch, or shape mismatch (object<->array, object<->scalar, etc.)
  out.push({ path, kind: 'changed', before, after });
};

export const diffJsonValues = (before: unknown, after: unknown): JsonDiffEntry[] => {
  const out: JsonDiffEntry[] = [];
  walk(before, after, '', out);
  return out;
};

const tryParse = (raw: string | null | undefined): { ok: boolean; value: unknown } => {
  if (raw === null || raw === undefined) {
    return { ok: true, value: null };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }
  // Cheap pre-filter: only attempt JSON.parse if it looks structured.
  const first = trimmed[0];
  if (first !== '{' && first !== '[') {
    return { ok: false, value: raw };
  }
  try {
    return { ok: true, value: JSON.parse(trimmed) };
  } catch {
    return { ok: false, value: raw };
  }
};

/**
 * Diff two raw text values, treating them as JSON when both parse cleanly.
 * Returns `ok: false` if either side is not a JSON object/array — the
 * caller should fall back to its plain text diff in that case.
 */
export const diffJsonStrings = (
  before: string | null | undefined,
  after: string | null | undefined
): JsonDiffResult => {
  const a = tryParse(before);
  const b = tryParse(after);
  if (!a.ok || !b.ok) {
    return { ok: false, entries: [] };
  }
  return { ok: true, entries: diffJsonValues(a.value, b.value) };
};

/**
 * Compact human-readable rendering of a JSON value for the diff table.
 * Strings are quoted; objects/arrays are JSON.stringify'd; null is "null".
 */
export const formatJsonValue = (value: unknown): string => {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};
