import type { Locale } from '../i18n/types';

type Props = {
  value: Locale;
  onChange: (locale: Locale) => void;
  ariaLabel: string;
  className?: string;
};

const items: Locale[] = ['en', 'ru'];

const LocaleSwitch = ({ value, onChange, ariaLabel, className = '' }: Props) => {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex items-center rounded-full border border-white/15 bg-black/40 p-0.5 ${className}`}
    >
      {items.map((locale) => {
        const active = value === locale;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => onChange(locale)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
              active
                ? 'bg-white text-slate-900'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            aria-pressed={active}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
};

export default LocaleSwitch;
