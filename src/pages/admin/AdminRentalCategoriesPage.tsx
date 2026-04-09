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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {adminRentalCategoriesContent.state.count(items.length)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={reload}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              {adminRentalCategoriesContent.actions.refresh}
            </button>
            <Link
              to="/admin/rental/new"
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400"
            >
              <Plus size={16} />
              {adminRentalCategoriesContent.actions.add}
            </Link>
          </div>
        </div>

        {loading && <div className="text-sm text-slate-400">{adminRentalCategoriesContent.state.loading}</div>}
        {error && <div className="text-sm text-red-400">{adminRentalCategoriesContent.state.errorPrefix} {error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-800/40 p-8 text-center text-slate-400">
            {adminRentalCategoriesContent.state.empty}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">{adminRentalCategoriesContent.table.name}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">{adminRentalCategoriesContent.table.slug}</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-300">{adminRentalCategoriesContent.table.order}</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-300">{adminRentalCategoriesContent.table.status}</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-300">{adminRentalCategoriesContent.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-800/30">
                {items.map((cat) => (
                  <tr key={cat.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">
                      <span className="inline-flex items-center gap-2">
                        <span>{cat.name}</span>
                        <FallbackDot visible={adminContentLocale === 'en' && !!cat.isFallbackFromRu} locale={adminContentLocale} />
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">/rent/{cat.slug}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{cat.sortOrder}</td>
                    <td className="px-4 py-3 text-center">
                      {cat.isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          <Eye size={12} /> {adminRentalCategoriesContent.table.published}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs text-slate-400">
                          <EyeOff size={12} /> {adminRentalCategoriesContent.table.draft}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleBlurTitle(cat.id, !!(cat.hero as Record<string, unknown>)?.showBlurTitle)}
                          disabled={togglingId === cat.id}
                          className={`rounded p-1 transition ${
                            (cat.hero as Record<string, unknown>)?.showBlurTitle
                              ? 'text-brand-400'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                          title={(cat.hero as Record<string, unknown>)?.showBlurTitle ? adminRentalCategoriesContent.table.blurEnabled : adminRentalCategoriesContent.table.blurDisabled}
                        >
                          <Sparkles size={16} className={togglingId === cat.id ? 'animate-spin' : ''} />
                        </button>
                        <Link
                          to={`/rent/${cat.slug}`}
                          target="_blank"
                          className="rounded p-1 text-slate-400 transition hover:text-white"
                          title={adminRentalCategoriesContent.table.openPage}
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/admin/rental/${cat.id}`}
                          className="rounded p-1 text-slate-400 transition hover:text-brand-400"
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
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRentalCategoriesPage;
