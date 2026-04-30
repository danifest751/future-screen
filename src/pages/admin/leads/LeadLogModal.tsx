import { Button } from '../../../components/admin/ui';
import type { LeadLog } from '../../../types/leads';
import {
  adminLeadsContent,
  channelLabel,
  entryStatusClasses,
  entryStatusLabel,
  formatDateTime,
  formatStatusLabel,
} from './leadRuntime';

export const LeadLogModal = ({
  log,
  onClose,
}: {
  log: LeadLog | null;
  onClose: () => void;
}) => {
  if (!log) return null;

  const entries = [...(log.deliveryLog ?? [])].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-white">{adminLeadsContent.logModal.title}</div>
            <div className="mt-1 truncate text-sm text-slate-400">
              {log.name} <span className="text-slate-600">·</span> {log.phone}
            </div>
            {log.requestId ? (
              <div className="mt-1 truncate font-mono text-xs text-slate-500">
                {adminLeadsContent.requestId.label}: {log.requestId}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {adminLeadsContent.logModal.close}
          </Button>
        </div>

        <div className="max-h-[calc(85vh-80px)] space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 md:grid-cols-3">
            <LogSummaryCard label={adminLeadsContent.logModal.cards.status} value={formatStatusLabel(log.status)} />
            <LogSummaryCard label={adminLeadsContent.logModal.cards.created} value={formatDateTime(log.timestamp)} />
            <LogSummaryCard label={adminLeadsContent.logModal.cards.steps} value={entries.length} />
          </div>

          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
              {adminLeadsContent.logModal.empty}
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div key={`${entry.at}-${entry.step}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-0.5 font-medium ${entryStatusClasses[entry.status]}`}>
                      {entryStatusLabel(entry.status)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-slate-900 px-2 py-0.5 text-slate-300">
                      {channelLabel(entry.channel)}
                    </span>
                    <span className="text-slate-500">{formatDateTime(entry.at)}</span>
                    <span className="text-slate-500">· {entry.step}</span>
                  </div>
                  <div className="mt-2 text-sm text-white">{entry.message}</div>
                  {entry.details ? (
                    <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs text-slate-300">
                      {entry.details}
                    </div>
                  ) : null}
                  {entry.meta && Object.keys(entry.meta).length > 0 ? (
                    <div className="mt-2 grid gap-1.5 md:grid-cols-2 xl:grid-cols-3">
                      {Object.entries(entry.meta).map(([key, value]) => (
                        <div key={key} className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-xs">
                          <span className="text-slate-500">{key}:</span> <span className="text-slate-300">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LogSummaryCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
    <div className="text-[11px] font-semibold uppercase tracking-normal text-slate-500">{label}</div>
    <div className="mt-1 text-sm font-medium text-white">{value}</div>
  </div>
);
