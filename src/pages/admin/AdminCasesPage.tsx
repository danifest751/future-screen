import { FormEvent, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useCases } from '../../hooks/useCases';
import type { CaseItem } from '../../data/cases';

type CaseFormState = Omit<CaseItem, 'services' | 'images'> & { 
  servicesText: string; 
  imagesText: string; 
};

const emptyCaseForm: CaseFormState = {
  slug: '', 
  title: '', 
  city: '', 
  date: '', 
  format: '', 
  summary: '', 
  metrics: '', 
  servicesText: '', 
  imagesText: '',
};

const AdminCasesPage = () => {
  const { cases, addCase, updateCase, deleteCase, resetToDefault } = useCases();
  const [caseForm, setCaseForm] = useState<CaseFormState>(emptyCaseForm);
  const [caseEditing, setCaseEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const caseCanSubmit = useMemo(() => 
    caseForm.slug.trim() && caseForm.title.trim(), 
    [caseForm.slug, caseForm.title]
  );

  const submitCase = async (e: FormEvent) => {
    e.preventDefault();
    if (!caseCanSubmit) return;

    const payload = {
      ...caseForm,
      services: caseForm.servicesText.split(',').map((s) => s.trim()).filter(Boolean),
      images: caseForm.imagesText.split(',').map((s) => s.trim()).filter(Boolean),
    };

    setIsSaving(true);
    try {
      const ok = caseEditing ? await updateCase(caseEditing, payload) : await addCase(payload);
      if (ok) {
        setCaseForm(emptyCaseForm);
        setCaseEditing(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (item: CaseItem) => {
    setCaseForm({
      ...item,
      servicesText: item.services.join(', '),
      imagesText: item.images?.join(', ') ?? '',
    });
    setCaseEditing(item.slug);
  };

  const cancelEdit = () => {
    setCaseForm(emptyCaseForm);
    setCaseEditing(null);
  };

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...cases];

    return cases.filter((c) => {
      const haystack = [
        c.slug,
        c.title,
        c.city,
        c.date,
        c.format,
        c.summary,
        c.metrics ?? '',
        ...(c.services ?? []),
        ...(c.images ?? []),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [cases, search]);

  return (
    <AdminLayout title="Кейсы" subtitle="Реализованные проекты">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Форма */}
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {caseEditing ? 'Редактирование кейса' : 'Новый кейс'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {caseEditing
                  ? `Вы редактируете кейс ${caseEditing}. Сохраните изменения или нажмите «Отмена».`
                  : 'Создайте новый кейс или выберите существующий справа для редактирования.'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {caseEditing && (
                <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
                  Режим редактирования
                </span>
              )}
              {caseEditing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-sm text-slate-300 hover:text-white"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>
          
          <form onSubmit={submitCase} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-200">
                Slug*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={caseForm.slug}
                  onChange={(e) => setCaseForm((f) => ({ ...f, slug: e.target.value }))}
                  disabled={isSaving}
                  placeholder="forum-ekb-2024"
                  required
                />
              </label>
              <label className="text-sm text-slate-200">
                Название*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={caseForm.title}
                  onChange={(e) => setCaseForm((f) => ({ ...f, title: e.target.value }))}
                  disabled={isSaving}
                  placeholder="Форум в Екатеринбурге"
                  required
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-200">
                Город
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={caseForm.city}
                  onChange={(e) => setCaseForm((f) => ({ ...f, city: e.target.value }))}
                  disabled={isSaving}
                  placeholder="Екатеринбург"
                />
              </label>
              <label className="text-sm text-slate-200">
                Дата
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={caseForm.date}
                  onChange={(e) => setCaseForm((f) => ({ ...f, date: e.target.value }))}
                  disabled={isSaving}
                  placeholder="2024"
                />
              </label>
            </div>

            <label className="text-sm text-slate-200">
              Формат
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={caseForm.format}
                onChange={(e) => setCaseForm((f) => ({ ...f, format: e.target.value }))}
                disabled={isSaving}
                placeholder="Форум"
              />
            </label>

            <label className="text-sm text-slate-200">
              Описание
              <textarea
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={caseForm.summary}
                onChange={(e) => setCaseForm((f) => ({ ...f, summary: e.target.value }))}
                disabled={isSaving}
                rows={3}
                placeholder="Краткое описание проекта"
              />
            </label>

            <label className="text-sm text-slate-200">
              Метрики
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={caseForm.metrics}
                onChange={(e) => setCaseForm((f) => ({ ...f, metrics: e.target.value }))}
                disabled={isSaving}
                placeholder="800 гостей, 2 дня"
              />
            </label>

            <label className="text-sm text-slate-200">
              Услуги (через запятую)
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={caseForm.servicesText}
                onChange={(e) => setCaseForm((f) => ({ ...f, servicesText: e.target.value }))}
                disabled={isSaving}
                placeholder="led, sound, light, support"
              />
            </label>

            <label className="text-sm text-slate-200">
              Изображения (URL через запятую)
              <textarea
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={caseForm.imagesText}
                onChange={(e) => setCaseForm((f) => ({ ...f, imagesText: e.target.value }))}
                disabled={isSaving}
                rows={2}
                placeholder="https://..."
              />
            </label>

            <button
              type="submit"
              disabled={!caseCanSubmit}
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Сохранение...' : caseEditing ? 'Сохранить кейс' : 'Добавить кейс'}
            </button>
          </form>
        </div>

        {/* Список кейсов */}
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Список кейсов</h2>
              <p className="mt-1 text-sm text-slate-400">
                Показано {filteredCases.length} из {cases.length}
              </p>
            </div>
            <button
              type="button"
              onClick={resetToDefault}
              disabled={isSaving}
              className="text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Сброс к дефолту
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по slug, названию, городу, услугам..."
              disabled={isSaving}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                disabled={isSaving}
                className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Очистить
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredCases.map((c) => (
              <div 
                key={c.slug} 
                className="rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{c.title}</span>
                      <span className="text-xs text-slate-400">({c.slug})</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      {c.city} · {c.date} · {c.format}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {c.summary}
                    </div>
                    {c.metrics && (
                      <div className="mt-1 text-xs text-brand-100">
                        📊 {c.metrics}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.services.map((s) => (
                        <span 
                          key={s}
                          className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      disabled={isSaving}
                      className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => {
                        if (confirm(`Удалить кейс "${c.title}"?`)) {
                          deleteCase(c.slug);
                        }
                      }}
                      className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredCases.length === 0 && (
              <div className="text-center text-slate-400">
                {cases.length === 0
                  ? 'Кейсов пока нет. Добавьте первый!'
                  : 'Ничего не найдено. Попробуйте изменить поисковый запрос.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCasesPage;
