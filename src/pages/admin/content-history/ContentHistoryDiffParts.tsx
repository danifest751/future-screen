import { formatJsonValue, type JsonDiffEntry } from '../../../lib/jsonDiff';
import type { DiffTextParts } from './contentHistoryUtils';

export const HighlightedDiffText = ({
  parts,
  tone,
}: {
  parts: DiffTextParts;
  tone: 'before' | 'after';
}) => {
  const highlightClass = tone === 'before'
    ? 'rounded bg-red-400/30 px-0.5 text-red-50 ring-1 ring-red-300/30'
    : 'rounded bg-emerald-400/30 px-0.5 text-emerald-50 ring-1 ring-emerald-300/30';

  return (
    <pre className="max-h-44 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
      <span>{parts.prefix}</span>
      {parts.changed.length > 0 && <mark className={highlightClass}>{parts.changed}</mark>}
      <span>{parts.suffix}</span>
    </pre>
  );
};

const kindStyles: Record<JsonDiffEntry['kind'], { row: string; badge: string }> = {
  added: {
    row: 'border-emerald-500/25 bg-emerald-500/5',
    badge: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
  },
  removed: {
    row: 'border-red-500/25 bg-red-500/5',
    badge: 'border-red-500/40 bg-red-500/15 text-red-200',
  },
  changed: {
    row: 'border-sky-500/25 bg-sky-500/5',
    badge: 'border-sky-500/40 bg-sky-500/15 text-sky-200',
  },
};

export const JsonDiffPathTable = ({
  entries,
  labels,
}: {
  entries: JsonDiffEntry[];
  labels: { path: string; before: string; after: string; root: string; kinds: Record<JsonDiffEntry['kind'], string> };
}) => (
  <div className="overflow-hidden rounded-lg border border-white/10">
    <table className="w-full table-fixed text-left text-xs">
      <thead className="bg-slate-900/80 text-[11px] uppercase text-slate-400">
        <tr>
          <th className="w-1/3 px-2 py-1.5 font-semibold">{labels.path}</th>
          <th className="w-1/3 px-2 py-1.5 font-semibold">{labels.before}</th>
          <th className="w-1/3 px-2 py-1.5 font-semibold">{labels.after}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, index) => {
          const style = kindStyles[entry.kind];
          return (
            <tr key={`${entry.path}-${index}`} className={`border-t border-white/5 ${style.row}`}>
              <td className="px-2 py-1.5 align-top font-mono text-slate-200">
                <div className="flex flex-col gap-1">
                  <span className={`inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${style.badge}`}>
                    {labels.kinds[entry.kind]}
                  </span>
                  <span className="break-all">{entry.path === '' ? labels.root : entry.path}</span>
                </div>
              </td>
              <td className="px-2 py-1.5 align-top">
                <pre className="max-h-32 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-red-100">
                  {entry.kind === 'added' ? '—' : formatJsonValue(entry.before)}
                </pre>
              </td>
              <td className="px-2 py-1.5 align-top">
                <pre className="max-h-32 whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-emerald-100">
                  {entry.kind === 'removed' ? '—' : formatJsonValue(entry.after)}
                </pre>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
