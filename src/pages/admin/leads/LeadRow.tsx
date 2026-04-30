import { ClipboardList, Mail, MapPin, MessageCircle, Phone, Trash2 } from 'lucide-react';
import type { LeadLog } from '../../../types/leads';
import {
  adminLeadsContent,
  channelLabel,
  formatShortDate,
  formatStatusLabel,
  formatTime,
  statusClasses,
} from './leadRuntime';

export const LeadRow = ({
  log,
  onOpenDetails,
  onOpenLog,
  onDelete,
  deleteTitle,
  selected,
  onToggleSelect,
  channelLabelText,
}: {
  log: LeadLog;
  onOpenDetails: (log: LeadLog) => void;
  onOpenLog: (log: LeadLog) => void;
  onDelete: (log: LeadLog) => void;
  deleteTitle: string;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  channelLabelText: string;
}) => {
  const time = formatTime(log.timestamp);
  const lastEntry = log.deliveryLog?.[log.deliveryLog.length - 1];
  const statusClass = statusClasses[log.status ?? 'default'] ?? statusClasses.default;
  const hasDetails = Boolean(log.city || log.date || log.format || log.comment || (log.extra && Object.keys(log.extra).length > 0));
  const origin = log.pagePath || log.referrer || '';

  return (
    <article
      className={`cursor-pointer border-b border-white/10 transition last:border-b-0 focus-within:bg-white/[0.04] hover:bg-white/[0.03] ${
        selected ? 'bg-emerald-400/[0.07]' : ''
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(log)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenDetails(log);
        }
      }}
    >
      <div className="grid gap-3 px-3 py-3 xl:grid-cols-[28px_minmax(170px,1fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(230px,1.2fr)_minmax(170px,0.9fr)_76px] xl:items-center">
        <label
          className="flex h-full items-start pt-0.5"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-emerald-400"
            checked={selected}
            onChange={() => onToggleSelect(log.id)}
            aria-label={`select ${log.name}`}
          />
        </label>

        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {!log.readAt ? <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300" aria-hidden="true" /> : null}
            <div className="truncate text-sm font-semibold text-white">{log.name}</div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-emerald-300/15 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-100">{log.source}</span>
            <span className="text-xs text-slate-500">{formatShortDate(log.timestamp)} · {time}</span>
          </div>
          {log.requestId ? (
            <div className="mt-1 truncate font-mono text-xs text-slate-500">
              {adminLeadsContent.requestId.label}: {log.requestId}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-0.5 text-xs">
          <a href={`tel:${log.phone}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-2 text-white hover:text-emerald-100">
            <Phone size={13} className="text-slate-500" />
            <span className="truncate">{log.phone}</span>
          </a>
          {log.email ? (
            <a href={`mailto:${log.email}`} onClick={(event) => event.stopPropagation()} className="flex items-center gap-2 text-slate-300 hover:text-emerald-100">
              <Mail size={13} className="text-slate-500" />
              <span className="truncate">{log.email}</span>
            </a>
          ) : null}
          {log.telegram ? (
            <div className="flex items-center gap-2 text-slate-300">
              <MessageCircle size={13} className="text-slate-500" />
              <span className="truncate">{log.telegram}</span>
            </div>
          ) : null}
          {!log.phone && !log.email && !log.telegram ? (
            <div className="text-slate-500">{adminLeadsContent.leadCard.fields.noContact}</div>
          ) : null}
        </div>

        <div className="min-w-0 text-xs">
          <div className="truncate font-medium text-slate-200">{channelLabelText}</div>
          <div className="mt-0.5 truncate text-[11px] text-slate-500">
            {origin || adminLeadsContent.leadCard.fields.noOrigin}
          </div>
          {log.referrer && log.pagePath ? (
            <div className="truncate text-[11px] text-slate-500">
              {adminLeadsContent.leadCard.fields.referrer}: {log.referrer}
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-0.5 text-xs">
          {hasDetails ? (
            <>
              {log.city ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin size={13} className="text-slate-500" />
                  <span className="truncate">{log.city}</span>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
                {log.date ? <span>{adminLeadsContent.leadCard.fields.date}: {log.date}</span> : null}
                {log.format ? <span>{adminLeadsContent.leadCard.fields.format}: {log.format}</span> : null}
              </div>
              {log.comment ? <div className="line-clamp-1 text-[11px] text-slate-400">{log.comment}</div> : null}
              {log.extra && Object.keys(log.extra).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(log.extra).slice(0, 3).map(([key, value]) => (
                    <span key={key} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">
                      {key}: {value}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <span className="text-xs text-slate-500">{adminLeadsContent.leadCard.fields.noDetails}</span>
          )}
        </div>

        <div className="min-w-0">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
            {formatStatusLabel(log.status)}
          </span>
          {lastEntry ? (
            <div className="mt-1 text-xs">
              <div className="line-clamp-1 text-slate-300">{lastEntry.message}</div>
              <div className="mt-0.5 text-slate-500">
                {channelLabel(lastEntry.channel)} · {formatTime(lastEntry.at)}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-slate-500">{adminLeadsContent.leadCard.fields.noLog}</div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 xl:justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenLog(log);
            }}
            title={adminLeadsContent.leadCard.actions.log}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-slate-200 transition hover:bg-white/10 active:scale-[0.96]"
          >
            <ClipboardList size={14} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(log);
            }}
            title={deleteTitle}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/10 text-red-100 transition hover:border-red-400/60 hover:bg-red-500/15 active:scale-[0.96]"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
};
