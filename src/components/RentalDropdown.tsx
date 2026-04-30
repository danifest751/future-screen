import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRentalCategories } from '../services/rentalCategories';
import { getRentalDropdownContent } from '../content/components/rentalDropdown';
import { useI18n } from '../context/I18nContext';

const categoryIcons: Record<string, JSX.Element> = {
  video: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect width="20" height="15" x="2" y="3" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M9 17h6"/>
    </svg>
  ),
  sound: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  light: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>
    </svg>
  ),
  stage: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  instruments: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="m9 18 6-6-6-6"/><circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  computers: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>
    </svg>
  ),
  touchscreens: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/><path d="M10 10.5a2 2 0 0 0-2-2a2 2 0 0 0-2 2V19a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-5a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>
    </svg>
  ),
  staff: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

const defaultIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
  </svg>
);

interface RentalDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RentalDropdown = ({ isOpen, onClose }: RentalDropdownProps) => {
  const { siteLocale } = useI18n();
  const rentalDropdownContent = getRentalDropdownContent(siteLocale);
  const { items, loading } = useRentalCategories(siteLocale, false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerOutside = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerOutside);
    }
    return () => {
      document.removeEventListener('pointerdown', handlePointerOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2"
      style={{ animation: 'dropdownFadeIn 0.2s ease-out' }}
    >
      <div className="relative flex justify-center">
        <div className="h-3 w-3 rotate-45 border-l border-t border-white/15 bg-white/5 backdrop-blur-2xl" />
      </div>

      <div
        className="mt-1 min-w-[320px] overflow-hidden rounded-2xl border border-white/10 bg-black/75 backdrop-blur-2xl shadow-2xl"
        style={{
          boxShadow: '0 20px 60px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 40px rgba(102, 126, 234, 0.08)',
          animation: 'dropdownSlideIn 0.25s ease-out',
        }}
      >
        <div className="border-b border-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-400">{rentalDropdownContent.headerTitle}</span>
            <Link
              to="/rent"
              className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              onClick={onClose}
            >
              {rentalDropdownContent.allLink}
            </Link>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : items.length > 0 ? (
            <div className="grid gap-1">
              {items.map((category) => (
                <Link
                  key={category.id}
                  to={`/rent/${category.slug}`}
                  onClick={onClose}
                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200 hover:bg-white/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition-colors group-hover:bg-brand-500/20 group-hover:text-brand-400">
                    {categoryIcons[category.slug] || defaultIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white group-hover:text-brand-300 transition-colors">
                      {category.name}
                    </div>
                    {category.shortName && (
                      <div className="truncate text-xs text-gray-500">
                        {category.shortName}
                      </div>
                    )}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4 text-gray-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6"/>
                  </svg>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-500">
              {rentalDropdownContent.emptyState}
            </div>
          )}
        </div>

        <div className="border-t border-white/5 p-3">
          <Link
            to="/rent"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500/10 px-4 py-2.5 text-sm font-medium text-brand-400 transition-all hover:bg-brand-500/20 hover:text-brand-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
            </svg>
            {rentalDropdownContent.footerCta}
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes dropdownSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};
