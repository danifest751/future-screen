import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useRentalCategories } from '../../services/rentalCategories';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Eye, EyeOff } from 'lucide-react';

const AdminRentalCategoriesPage = () => {
  const { items, loading, error, reload } = useRentalCategories();

  return (
    <AdminLayout title="Категории аренды" subtitle="Управление разделами оборудования в аренду">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {items.length} категорий
          </p>
          <div className="flex gap-3">
            <button
              onClick={reload}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              Обновить
            </button>
            <Link
              to="/admin/rental/new"
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-400"
            >
              <Plus size={16} />
              Добавить
            </Link>
          </div>
        </div>

        {loading && <div className="text-sm text-slate-400">Загрузка...</div>}
        {error && <div className="text-sm text-red-400">Ошибка: {error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-800/40 p-8 text-center text-slate-400">
            Нет категорий аренды. Создайте первую.
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Название</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-300">Slug</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-300">Порядок</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-300">Статус</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-300">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-800/30">
                {items.map((cat) => (
                  <tr key={cat.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 font-medium text-white">{cat.name}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">/rent/{cat.slug}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{cat.sortOrder}</td>
                    <td className="px-4 py-3 text-center">
                      {cat.isPublished ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          <Eye size={12} /> Опубликовано
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-xs text-slate-400">
                          <EyeOff size={12} /> Черновик
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/rent/${cat.slug}`}
                          target="_blank"
                          className="rounded p-1 text-slate-400 transition hover:text-white"
                          title="Открыть страницу"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          to={`/admin/rental/${cat.id}`}
                          className="rounded p-1 text-slate-400 transition hover:text-brand-400"
                          title="Редактировать"
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
