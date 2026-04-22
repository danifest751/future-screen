import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { useGlobalConsent } from '../hooks/useGlobalConsent';
import { useEditableBinding } from '../hooks/useEditableBinding';
import type { GlobalConsentContent } from '../lib/content/globalConsent';

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
  const { siteLocale } = useI18n();
  const { data: consentContent, save: saveConsent } = useGlobalConsent(siteLocale, true);

  const savePatch = async (patch: Partial<GlobalConsentContent>) => {
    const ok = await saveConsent({ ...consentContent, ...patch });
    if (!ok) throw new Error('Failed to save consent text');
  };

  const prefixEdit = useEditableBinding({
    value: consentContent.prefix,
    onSave: (next) => savePatch({ prefix: next }),
    label: 'Consent — prefix',
    kind: 'multiline',
  });
  const linkLabelEdit = useEditableBinding({
    value: consentContent.linkLabel,
    onSave: (next) => savePatch({ linkLabel: next }),
    label: 'Consent — privacy link label',
  });

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
          <span {...prefixEdit.bindProps}>{prefixEdit.value}</span>{' '}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 underline hover:text-brand-300"
          >
            <span {...linkLabelEdit.bindProps}>{linkLabelEdit.value}</span>
          </Link>
        </span>
      </label>
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
});
