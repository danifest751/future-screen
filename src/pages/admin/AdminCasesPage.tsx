import { FormEvent, useMemo, useState } from 'react';
import Section from '../../components/Section';
import { useCases } from '../../hooks/useCases';
import type { CaseItem } from '../../data/cases';
import { slugify } from '../../utils/slugify';

type FormState = Omit<CaseItem, 'services' | 'images'> & { services: string; imagesText: string; images: string[] };

const emptyForm: FormState = {
  slug: '',
  title: '',
  city: '',
  date: '',
  format: '',
  summary: '',
  metrics: '',
  imagesText: '',
  images: [],
  services: '',
};

const AdminCasesPage = () => {
  const { cases, addCase, updateCase, deleteCase, resetToDefault } = useCases();
  const [form, setForm] = useState(emptyForm);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const isEditing = Boolean(editingSlug);

  const canSubmit = useMemo(() => form.slug.trim() && form.title.trim(), [form.slug, form.title]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      ...form,
      services: form.services.split(',').map((s) => s.trim()),
      images: [
        ...form.images,
        ...form.imagesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ],
    };

    if (isEditing && editingSlug) {
      updateCase(editingSlug, payload);
    } else {
      addCase(payload);
    }

    setForm(emptyForm);
    setEditingSlug(null);
  };

  const startEdit = (item: CaseItem) => {
    setForm({
      ...item,
      services: item.services.join(', '),
      imagesText: item.images?.join(', ') ?? '',
      images: item.images ?? [],
    });
    setEditingSlug(item.slug);
  };

  const cancelEdit = () => {
    setForm(emptyForm);
    setEditingSlug(null);
  };

  return (
    <div className="space-y-2">
      <Section title="Админка кейсов" subtitle="Локальное редактирование (localStorage). Для прод нужна реальная CMS/API.">
        <div className="grid gap-6 md:grid-cols-2">
          <form className="card space-y-3" onSubmit={onSubmit}>
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">{isEditing ? 'Редактировать кейс' : 'Создать кейс'}</div>
              {isEditing && (
                <button type="button" onClick={cancelEdit} className="text-sm text-slate-300 hover:text-white">
                  Сбросить
                </button>
              )}
            </div>
            <div className="grid gap-3">
              <label className="text-sm text-slate-200">
                Slug*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                  disabled={isEditing}
                />
              </label>
              <label className="text-sm text-slate-200">
                Заголовок*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={form.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    const autoSlug = slugify(nextTitle);
                    setForm((f) => {
                      const shouldUpdateSlug = !isEditing && (!f.slug || f.slug === slugify(f.title));
                      return {
                        ...f,
                        title: nextTitle,
                        slug: shouldUpdateSlug ? autoSlug : f.slug,
                      };
                    });
                  }}
                  required
                />
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm text-slate-200">
                  Город
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </label>
                <label className="text-sm text-slate-200">
                  Дата/год
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </label>
                <label className="text-sm text-slate-200">
                  Формат
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    value={form.format}
                    onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
                  />
                </label>
              </div>
              <label className="text-sm text-slate-200">
                Услуги (через запятую: led, sound, light, video, stage, support)
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={form.services}
                  onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))}
                  placeholder="led, sound, stage"
                />
              </label>
              <label className="text-sm text-slate-200">
                Краткое описание
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  rows={3}
                />
              </label>
              <label className="text-sm text-slate-200">
                Метрики (опционально)
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={form.metrics}
                  onChange={(e) => setForm((f) => ({ ...f, metrics: e.target.value }))}
                  placeholder="800 гостей, 2 дня"
                />
              </label>
              <label className="text-sm text-slate-200">
                Изображения (URL через запятую)
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={form.imagesText}
                  onChange={(e) => setForm((f) => ({ ...f, imagesText: e.target.value }))}
                  rows={2}
                  placeholder="https://.../img1.jpg, https://.../img2.webp"
                />
              </label>
              <label className="text-sm text-slate-200">
                Загрузить файлы (конвертируются в data URL, сохраняются в localStorage)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-1 w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-500 file:px-3 file:py-2 file:text-white file:hover:bg-brand-400"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (!files.length) return;
                    const toDataUrl = (file: File) =>
                      new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(String(reader.result));
                        reader.onerror = () => reject(reader.error);
                        reader.readAsDataURL(file);
                      });
                    try {
                      const urls = await Promise.all(files.map((f) => toDataUrl(f)));
                      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
                    } catch (err) {
                      console.error('File read error', err);
                    }
                    e.target.value = '';
                  }}
                />
                <div className="mt-2 text-xs text-slate-400">Для прод лучше грузить в CDN/S3. Data URL подходят для черновиков.</div>
              </label>
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.images.map((src, idx) => (
                    <div key={src + idx} className="relative">
                      <img src={src} alt="preview" className="h-16 w-full rounded-md object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/60 px-1 text-[10px] text-white"
                        onClick={() =>
                          setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
                        }
                        aria-label="Удалить изображение"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-50"
            >
              {isEditing ? 'Сохранить' : 'Добавить'}
            </button>
          </form>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">Список кейсов</div>
              <button
                type="button"
                onClick={resetToDefault}
                className="text-sm text-slate-300 hover:text-white"
              >
                Сброс к дефолту
              </button>
            </div>
            <div className="space-y-2">
              {cases.map((item) => (
                <div key={item.slug} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.slug}</div>
                  </div>
                  <div className="text-xs text-slate-400">{item.city} · {item.date} · {item.format}</div>
                  <div className="mt-1 text-slate-200">{item.summary}</div>
                  {item.metrics && <div className="text-xs text-brand-100">{item.metrics}</div>}
                  <div className="text-xs text-slate-400">Услуги: {item.services.join(', ')}</div>
                  {item.images && item.images.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {item.images.map((src) => (
                        <img
                          key={src}
                          src={src}
                          alt={item.title}
                          className="h-16 w-full rounded-md object-cover"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCase(item.slug)}
                      className="rounded-lg border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
              {cases.length === 0 && <div className="text-slate-400">Нет кейсов.</div>}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-400">
          Данные сохраняются в localStorage браузера. Для прод-версии нужен backend/CMS и авторизация.
        </div>
      </Section>
    </div>
  );
};

export default AdminCasesPage;
