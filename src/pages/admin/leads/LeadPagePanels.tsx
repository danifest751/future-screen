import { AlertTriangle, Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AdminLeadsContent } from './leadRuntime';

export const StatStripItem = ({ label, value, hint, Icon, tone = 'text-emerald-200' }: {
  label: string;
  value: string | number;
  hint: string;
  Icon: LucideIcon;
  tone?: string;
}) => (
  <div className="group min-h-[112px] p-4 transition hover:bg-white/[0.03]">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-normal text-slate-500">{label}</div>
        <div className="mt-2 font-mono text-3xl font-semibold leading-none text-white">{value}</div>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition group-hover:border-emerald-300/25 group-hover:text-emerald-200">
        <Icon size={18} />
      </div>
    </div>
    <div className={`mt-3 text-xs font-medium ${tone}`}>{hint}</div>
  </div>
);

export const ErrorPanel = ({ title, description }: { title: string; description: string }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-100">
    <AlertTriangle size={18} className="mt-0.5 shrink-0" />
    <div>
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-red-100/75">{description}</div>
    </div>
  </div>
);

export const LeadsSkeleton = ({ content }: { content: AdminLeadsContent }) => (
  <div className="space-y-6" aria-busy="true">
    <div>
      <div className="text-sm text-slate-400">{content.loading.title}</div>
      <div className="mt-1 text-xs text-slate-500">{content.loading.description}</div>
    </div>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45">
      <div className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="min-h-[112px] p-4">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
            <div className="mt-5 h-8 w-16 animate-pulse rounded-lg bg-white/10" />
            <div className="mt-4 h-3 w-32 animate-pulse rounded-full bg-white/10" />
          </div>
        ))}
      </div>
    </div>
    <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-4">
      <div className="h-4 w-36 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="h-10 animate-pulse rounded-xl bg-white/10" />
        <div className="h-10 animate-pulse rounded-xl bg-white/10" />
      </div>
    </div>
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="border-b border-white/10 px-3 py-3 last:border-b-0">
          <div className="grid gap-3 xl:grid-cols-[28px_minmax(170px,1fr)_minmax(190px,1fr)_minmax(180px,0.9fr)_minmax(230px,1.2fr)_minmax(170px,0.9fr)_76px]">
            <div className="h-4 w-4 animate-pulse rounded bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-10 animate-pulse rounded-xl bg-white/10" />
            <div className="h-8 animate-pulse rounded-lg bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const EmptyLeadsPanel = ({ title, description }: { title: string; description: string }) => (
  <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-950/35 px-6 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-emerald-200">
      <Inbox size={20} />
    </div>
    <div>
      <div className="text-base font-semibold text-white">{title}</div>
      <div className="mt-1 max-w-md text-sm text-slate-400">{description}</div>
    </div>
  </div>
);
