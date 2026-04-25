import DOMPurify from 'dompurify';

/**
 * Санитизирует HTML-строку с использованием DOMPurify для защиты от XSS-атак.
 * 
 * @param html - Исходная HTML-строка, которую необходимо санитизировать
 * @returns Безопасная HTML-строка, очищенная от потенциально опасных скриптов
 * 
 * @example
 * ```tsx
 * import { sanitizeHtml } from '../lib/sanitize';
 * 
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 * ```
 */
// Restrict URI schemes for both sanitizeHtml and sanitizeMarkdown. Without
// this, DOMPurify's default URI regex still permits `data:` for <a>/<img>
// (and historically `vbscript:` on older engines), which is enough to
// smuggle in `<a href="data:text/html,<script>...">` from CMS-controlled
// content. Same allowlist as src/lib/safeHref.ts so the policies match.
const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto|tel|ftp):|[#/?]|$)/i;

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, { ALLOWED_URI_REGEXP });
}

/**
 * Опции для санитизации Markdown перед рендерингом.
 */
export interface SanitizeMarkdownOptions {
  /** Разрешенные HTML-теги (по умолчанию: базовые теги форматирования) */
  allowedTags?: string[];
  /** Разрешенные атрибуты (по умолчанию: базовые атрибуты) */
  allowedAttributes?: Record<string, string[]>;
}

/**
 * Санитизирует Markdown-контент перед рендерингом.
 * Эта функция предназначена для предварительной обработки Markdown-контента,
 * который будет передан в markdown-to-jsx или аналогичный рендерер.
 * 
 * @param markdown - Исходный Markdown-контент
 * @param options - Опции санитизации
 * @returns Безопасный Markdown-контент
 * 
 * @example
 * ```tsx
 * import { sanitizeMarkdown } from '../lib/sanitize';
 * 
 * <Markdown>{sanitizeMarkdown(content)}</Markdown>
 * ```
 */
export function sanitizeMarkdown(
  markdown: string | null | undefined,
  options?: SanitizeMarkdownOptions
): string {
  if (!markdown) return '';

  const {
    allowedTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'dl', 'dt', 'dd'],
    // H10: `style` removed from the allow-list. Inline style was the last
    // vector for `background: url(javascript:...)` / `expression()` on
    // older engines and for CSS-based data exfiltration via `background:
    // url(//attacker)`. Use className from the design system instead.
    allowedAttributes = {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class', 'id'],
    },
  } = options || {};

  // Сначала санитизируем HTML, который может содержаться в Markdown
  const sanitized = DOMPurify.sanitize(markdown, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: Object.entries(allowedAttributes).flatMap(([tag, attrs]) =>
      tag === '*' ? attrs : attrs
    ),
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    ALLOWED_URI_REGEXP,
    SANITIZE_DOM: true,
  });

  return sanitized;
}
