/**
 * Restrict the URL schemes admin-controlled (CMS, share-link payloads,
 * etc.) values may render as <a href> / similar attributes. The default
 * allowlist covers everything the site legitimately uses; anything else
 * (`javascript:`, `data:`, `vbscript:`, custom schemes) is replaced with
 * `'#'` so the click is a no-op rather than an XSS sink.
 *
 * Accepts:
 *   - relative paths starting with `/` (in-app navigation)
 *   - in-page anchors starting with `#`
 *   - `http://` and `https://`
 *   - `mailto:`, `tel:`
 *   - protocol-relative `//host/...`
 *
 * Use this on EVERY href whose value originates from CMS-editable
 * content (Header navLinks, AdminVisualLedSession.page_url, share URLs,
 * etc.). Static literals don't need it.
 */
export const SAFE_HREF_FALLBACK = '#';

const SAFE_HREF_PATTERN = /^(?:https?:|mailto:|tel:|\/|#)/i;

export const isSafeHref = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return SAFE_HREF_PATTERN.test(trimmed);
};

/**
 * Normalize an href: returns the trimmed value when it matches the
 * allowlist, `'#'` otherwise. Always safe to drop into `<a href>`.
 */
export const safeHref = (value: unknown): string => {
  if (!isSafeHref(value)) return SAFE_HREF_FALLBACK;
  return value.trim();
};
