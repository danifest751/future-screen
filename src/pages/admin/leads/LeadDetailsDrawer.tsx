import type { ReactNode } from 'react';
import { ClipboardList, ExternalLink, X } from 'lucide-react';
import type { LeadLog } from '../../../types/leads';
import {
  adminLeadsContent,
  channelLabel,
  entryStatusClasses,
  entryStatusLabel,
  formatDateTime,
  formatStatusLabel,
  statusClasses,
} from './leadRuntime';

export const LeadDetailsDrawer = ({
  log,
  onClose,
  onOpenLog,
}: {
  log: LeadLog | null;
  onClose: () => void;
  onOpenLog: (log: LeadLog) => void;
}) => {
  if (!log) return null;

  const entries = [...(log.deliveryLog ?? [])].sort((a, b) => a.at.localeCompare(b.at));
  const latestEntries = entries.slice(-4).reverse();
  const statusClass = statusClasses[log.status ?? 'default'] ?? statusClasses.default;
  const extraEntries = Object.entries(log.extra ?? {});
  const contacts = [
    { label: adminLeadsContent.leadCard.fields.phone, value: log.phone, href: `tel:${log.phone}` },
    log.email ? { label: adminLeadsContent.leadCard.fields.email, value: log.email, href: `mailto:${log.email}` } : null,
    log.telegram ? { label: adminLeadsContent.leadCard.fields.telegram, value: log.telegram } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href?: string }>;
  const requestDetails = [
    log.city ? { label: adminLeadsContent.leadCard.fields.city, value: log.city } : null,
    log.date ? { label: adminLeadsContent.leadCard.fields.date, value: log.date } : null,
    log.format ? { label: adminLeadsContent.leadCard.fields.format, value: log.format } : null,
    log.comment ? { label: adminLeadsContent.leadCard.fields.comment, value: log.comment } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const origins = [
    log.pagePath ? { label: adminLeadsContent.detailsDrawer.fields.pagePath, value: log.pagePath, href: log.pagePath } : null,
    log.referrer ? { label: adminLeadsContent.detailsDrawer.fields.referrer, value: log.referrer, href: log.referrer } : null,
  ].filter(Boolean) as Array<{ label: string; value: string; href: string }>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/60"
        aria-label={adminLeadsContent.detailsDrawer.close}
        onClick={onClose}
      />
      <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-slate-950 shadow-2xl">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{adminLeadsContent.detailsDrawer.title}</div>
              <h2 className="mt-1 truncate text-xl font-semibold text-white">{log.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
                  {formatStatusLabel(log.status)}
                </span>
                <span className="rounded-md border border-emerald-300/15 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-100">{log.source}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              title={adminLeadsContent.detailsDrawer.close}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 active:scale-[0.96]"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
            <div>
              <span className="text-slate-500">{adminLeadsContent.detailsDrawer.fields.created}: </span>
              <span className="text-slate-200">{formatDateTime(log.timestamp)}</span>
            </div>
            {log.requestId ? (
              <div className="min-w-0 truncate">
                <span className="text-slate-500">{adminLeadsContent.requestId.label}: </span>
                <span className="font-mono text-slate-200">{log.requestId}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <DrawerSection title={adminLeadsContent.detailsDrawer.sections.contacts}>
            <div className="grid gap-2">
              {contacts.map((item) => (
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition hover:bg-white/[0.06]"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="truncate text-right text-white">{item.value}</span>
                  </a>
                ) : (
                  <div key={item.label} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="truncate text-right text-white">{item.value}</span>
                  </div>
                )
              ))}
            </div>
          </DrawerSection>

          <DrawerSection title={adminLeadsContent.detailsDrawer.sections.origin}>
            {origins.length > 0 ? (
              <div className="grid gap-2">
                {origins.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm transition hover:bg-white/[0.06]"
                  >
                    <span className="text-slate-500">{item.label}</span>
                    <span className="flex min-w-0 items-center gap-2 text-right text-white">
                      <span className="truncate">{item.value}</span>
                      <ExternalLink size={13} className="shrink-0 text-slate-500" />
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyInline>{adminLeadsContent.leadCard.fields.noOrigin}</EmptyInline>
            )}
          </DrawerSection>

          <DrawerSection title={adminLeadsContent.detailsDrawer.sections.request}>
            {requestDetails.length > 0 ? (
              <div className="grid gap-2">
                {requestDetails.map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className="mt-1 whitespace-pre-wrap text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyInline>{adminLeadsContent.leadCard.fields.noDetails}</EmptyInline>
            )}
          </DrawerSection>

          {extraEntries.length > 0 ? (
            <DrawerSection title={adminLeadsContent.detailsDrawer.sections.extra}>
              <div className="grid gap-2 sm:grid-cols-2">
                {extraEntries.map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                    <div className="text-xs text-slate-500">{key}</div>
                    <div className="mt-1 text-white">{value}</div>
                  </div>
                ))}
              </div>
            </DrawerSection>
          ) : null}

          <DrawerSection
            title={adminLeadsContent.detailsDrawer.sections.delivery}
            action={(
              <button
                type="button"
                onClick={() => onOpenLog(log)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
              >
                <ClipboardList size={13} />
                {adminLeadsContent.detailsDrawer.actions.openLog}
              </button>
            )}
          >
            {latestEntries.length > 0 ? (
              <div className="space-y-2">
                {latestEntries.map((entry, index) => (
                  <div key={`${entry.at}-${entry.step}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`rounded-full border px-2 py-0.5 font-medium ${entryStatusClasses[entry.status]}`}>
                        {entryStatusLabel(entry.status)}
                      </span>
                      <span className="text-slate-500">{channelLabel(entry.channel)}</span>
                      <span className="text-slate-500">{formatDateTime(entry.at)}</span>
                    </div>
                    <div className="mt-1 text-sm text-white">{entry.message}</div>
                    {entry.details ? <div className="mt-1 text-xs text-slate-400">{entry.details}</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyInline>{adminLeadsContent.leadCard.fields.noLog}</EmptyInline>
            )}
          </DrawerSection>
        </div>
      </aside>
    </div>
  );
};

const DrawerSection = ({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) => (
  <section>
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">{title}</div>
      {action}
    </div>
    {children}
  </section>
);

const EmptyInline = ({ children }: { children: ReactNode }) => (
  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-slate-500">
    {children}
  </div>
);
