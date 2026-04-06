import { memo } from 'react';
import { Link } from 'react-router-dom';
import { consentContent } from '../content/global';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  className?: string;
};

export const ConsentCheckbox = memo(function ConsentCheckbox({
  checked,
  onChange,
  error,
  className = '',
}: Props) {
  return (
    <div className={className}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
        />
        <span className="text-sm text-slate-400">
          {consentContent.prefix}{' '}
          <Link to="/privacy" target="_blank" className="text-brand-400 underline hover:text-brand-300">
            {consentContent.linkLabel}
          </Link>
        </span>
      </label>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
});
