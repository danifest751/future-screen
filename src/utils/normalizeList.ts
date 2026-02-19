export const normalizeList = (value: string[] | string): string[] =>
  (Array.isArray(value) ? value : value.split(/[\n,]/))
    .map((s) => s.trim())
    .filter(Boolean);
