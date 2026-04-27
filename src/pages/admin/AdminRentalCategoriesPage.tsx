import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRentalCategories, toggleRentalCategoryBlurTitle } from '../../services/rentalCategories';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../../context/I18nContext';
import { getAdminRentalCategoriesContent } from '../../content/pages/adminRentalCategories';
import { FallbackDot } from '../../components/admin/ui';

const AdminRentalCategoriesPage = () => {
  const { adminLocale, adminContentLocale, setAdminContentLocale } = useI18n();
  const adminRentalCategoriesContent = getAdminRentalCategoriesContent(adminLocale);
  const { items, loading, error, reload } = useRentalCategories(adminContentLocale);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggleBlurTitle = async (id: number, currentValue: boolean) => {
    setTogglingId(id);
    try {
      await toggleRentalCategoryBlurTitle(id, !currentValue);
      await reload();
      toast.success(adminRentalCategoriesContent.toasts.saveSuccess);
    } catch {
      toast.error(adminRentalCategoriesContent.toasts.saveError);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <AdminLayout
      title={adminRentalCategoriesContent.layout.title}
      subtitle={adminRentalCategoriesContent.layout.subtitle}
      contentLocale={adminContentLocale}
      onContentLocaleChange={setAdminContentLocale}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/35 p-3 shadow-2xl shadow-black/10">
          <p className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-100">
            {adminRentalCategoriesContent.state.count(items.length)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={reload}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:border-white/20 hover:bg-white/10 active:scale-[0.98]"
            >
              {adminRentalCategoriesContent.actions.refresh}
            </button>
            <Link
              to="/admin/rental/new"
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 active:scale-[0.98]"
            >
              <Plus size={16} />
              {adminRentalCategoriesContent.actions.add}
            </Link>
          </div>
        </div>

        {loading && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35 shadow-2xl shadow-black/10">
            <div className="border-b border-white/10 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300">
              {adminRentalCategoriesContent.state.loading}
            </div>
            <div className="divide-y divide-white/5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="grid gap-3 px-3 py-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(120px,0.65fr)_80px_120px_120px]">
                  <div className="space-y-2">
                    <div className="h-4 w-44 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-28 animate-pulse rounded bg-white/5" />
                  </div>
                  <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-10 animate-pulse rounded bg-white/5 sm:justify-self-center" />
                  <div className="h-5 w-24 animate-pulse rounded-full bg-white/5 sm:justify-self-center" />
                  <div className="h-7 w-24 animate-pulse rounded bg-white/5 sm:justify-self-end" />
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 shadow-2xl shadow-black/10">
            {adminRentalCategoriesContent.state.errorPrefix} {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/35 p-8 text-center text-slate-400 shadow-2xl shadow-black/10">
            {adminRentalCategoriesContent.state.empty}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/35 shadow-2xl shadow-black/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-white/10 bg-slate-900/80">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-300">{adminRentalCategoriesContent.table.name}</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-300">{adminRentalCategoriesContent.table.slug}</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-300">{adminRentalCategoriesContent.table.order}</th>
                    <th className="px-3 py-2 text-center font-medium text-slate-300">{adminRentalCategoriesContent.table.status}</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-300">{adminRentalCategoriesContent.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((cat) => (
                    <tr key={cat.id} className="transition hover:bg-slate-900/70">
                      <td className="px-3 py-2 font-medium text-white">
                        <div className="min-w-0">
                          <span className="inline-flex max-w-full items-center gap-2">
                            <span className="truncate">{cat.name}</span>
                            <FallbackDot visible={adminContentLocale === 'en' && !!cat.isFallbackFromRu} adminLocale={adminLocale} />
                          </span>
                          <div className="mt-0.5 truncate text-xs font-normal text-slate-500">{cat.shortName}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-400">/rent/{cat.slug}</td>
                      <td className="px-3 py-2 text-center font-mono text-xs text-slate-300">{cat.sortOrder}</td>
                      <td className="px-3 py-2 text-center">
                        {cat.isPublished ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">
                            <Eye size={12} /> {adminRentalCategoriesContent.table.published}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-500/10 px-2 py-0.5 text-xs text-slate-300">
                            <EyeOff size={12} /> {adminRentalCategoriesContent.table.draft}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleBlurTitle(cat.id, !!(cat.hero as Record<string, unknown>)?.showBlurTitle)}
                            disabled={togglingId === cat.id}
                            className={`rounded-lg border p-1.5 transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 ${
                              (cat.hero as Record<string, unknown>)?.showBlurTitle
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/50'
                                : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                            }`}
                            title={(cat.hero as Record<string, unknown>)?.showBlurTitle ? adminRentalCategoriesContent.table.blurEnabled : adminRentalCategoriesContent.table.blurDisabled}
                          >
                            <Sparkles size={16} className={togglingId === cat.id ? 'animate-pulse' : ''} />
                          </button>
                          <Link
                            to={`/rent/${cat.slug}`}
                            target="_blank"
                            className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:border-white/20 hover:text-white active:scale-[0.96]"
                            title={adminRentalCategoriesContent.table.openPage}
                          >
                            <Eye size={16} />
                          </Link>
                          <Link
                            to={`/admin/rental/${cat.id}`}
                            className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200 active:scale-[0.96]"
                            title={adminRentalCategoriesContent.table.edit}
                          >
                            <Edit2 size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRentalCategoriesPage;
