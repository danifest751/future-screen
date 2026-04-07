import type { Locale } from '../../../i18n/types';

type FallbackDotProps = {
  visible: boolean;
  locale: Locale;
  className?: string;
};

const FallbackDot = ({ visible, locale, className = '' }: FallbackDotProps) => {
  if (!visible) return null;

  const title = locale === 'ru' ? 'Используется fallback из русской версии' : 'Using RU fallback';

  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex h-4 w-4 items-center justify-center ${className}`.trim()}
    >
      <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.2)]" />
    </span>
  );
};

export default FallbackDot;
