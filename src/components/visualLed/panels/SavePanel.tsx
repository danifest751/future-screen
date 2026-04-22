import { useState } from 'react';
import { Check, Copy, ExternalLink, Save, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { saveProject } from '../saveProject';
import { useVisualLed } from '../state/VisualLedContext';

/**
 * Save-project panel: sends the in-memory state to the save endpoint
 * and shows a share-link modal on success. Background images are NOT
 * included in the save payload (payload-size cap); user re-uploads
 * them when opening the shared link. Proper upload-to-storage flow
 * lands in phase 5.
 */
const SavePanel = () => {
  const { state } = useVisualLed();
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await saveProject(state);
      if (!result.ok) {
        setError(result.error ?? 'Не удалось сохранить');
        return;
      }
      setShareUrl(result.shareUrl ?? null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
      <h2 className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Save className="h-3 w-3" /> Сохранить проект
      </h2>
      <button
        type="button"
        onClick={() => void run()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Save className="h-3 w-3" />
        {busy ? 'Сохранение…' : 'Получить ссылку'}
      </button>
      <p className="mt-2 text-[10px] text-slate-500">
        Сохранится макет (сцены, экраны, кабинеты). Фоновые изображения нужно будет
        перезагрузить по ссылке.
      </p>
      {error ? (
        <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] text-red-200">
          {error}
        </div>
      ) : null}

      {shareUrl ? <ShareDialog url={shareUrl} onClose={() => setShareUrl(null)} /> : null}
    </div>
  );
};

const ShareDialog = ({ url, onClose }: { url: string; onClose: () => void }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Ссылка на проект</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/10 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:border-white/30 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <p className="mb-3 text-xs text-slate-400">
          Любой, кто откроет эту ссылку, увидит сохранённую сцену. Фон нужно
          перезагрузить.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 min-w-0 rounded-md border border-white/10 bg-slate-950 px-2 py-1.5 font-mono text-xs text-white"
          />
          <button
            type="button"
            onClick={() => void copy()}
            className="flex items-center gap-1 rounded-md bg-brand-500/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-500"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
          >
            Открыть в новой вкладке
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SavePanel;
