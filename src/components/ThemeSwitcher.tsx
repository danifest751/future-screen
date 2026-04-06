import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { themeSwitcherContent } from '../content/components/themeSwitcher';

const ThemeSwitcher = () => {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
        }}
        title={themeSwitcherContent.toggleTitle}
      >
        <span>{theme.emoji}</span>
        <span className="hidden sm:inline">{theme.name}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl shadow-xl"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition"
              style={{
                color: theme.id === t.id ? 'var(--brand-500)' : 'var(--text-primary)',
                background: theme.id === t.id ? 'var(--bg-card)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (theme.id !== t.id) e.currentTarget.style.background = 'var(--bg-card-hover)';
              }}
              onMouseLeave={(e) => {
                if (theme.id !== t.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span>{t.emoji}</span>
              <span>{t.name}</span>
              {theme.id === t.id && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
