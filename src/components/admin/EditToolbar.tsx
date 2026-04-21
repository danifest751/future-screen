import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { useEditMode } from '../../context/EditModeContext';
import { useI18n } from '../../context/I18nContext';
import type { Locale } from '../../i18n/types';

const locales: Array<{ code: Locale; label: string }> = [
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

const EditToolbar = () => {
  const { isEditing, setEditing } = useEditMode();
  const { siteLocale, setSiteLocale } = useI18n();

  // Esc exits edit mode when focus isn't inside an editable element.
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const target = e.target as HTMLElement | null;
      if (target?.getAttribute('contenteditable') === 'true') return;
      setEditing(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isEditing, setEditing]);

  if (!isEditing) return null;

  const content = (
    <div
      className="fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2 rounded-2xl border border-amber-400/40 bg-slate-900/95 px-4 py-2.5 shadow-2xl backdrop-blur"
      role="toolbar"
      aria-label="Inline edit toolbar"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400"
            aria-hidden="true"
          />
          <span className="font-medium text-white">Edit mode</span>
          <span className="text-slate-400">— changes save on blur</span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-800 p-0.5">
          {locales.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setSiteLocale(code)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                siteLocale === code
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title={`Switch editor to ${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
          title="Done editing (Esc)"
        >
          <Check className="h-3.5 w-3.5" />
          Done
        </button>

        <button
          type="button"
          onClick={() => setEditing(false)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
          title="Exit without further changes"
        >
          <X className="h-3.5 w-3.5" />
          Close
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default EditToolbar;
