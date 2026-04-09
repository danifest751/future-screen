import type { Locale } from '../../../i18n/types';
import { getFallbackDotContent } from '../../../content/components/fallbackDot';

type FallbackDotProps = {
  visible: boolean;
  adminLocale: Locale;
  className?: string;
};

const FallbackDot = ({ visible, adminLocale, className = '' }: FallbackDotProps) => {
  if (!visible) return null;

  const title = getFallbackDotContent(adminLocale).title;

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

