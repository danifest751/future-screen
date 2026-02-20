import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminFieldError from '../../components/admin/AdminFieldError';
import { useCases } from '../../hooks/useCases';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type { CaseItem } from '../../data/cases';
import { supabase } from '../../lib/supabase';

const caseSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug обязателен')
    .regex(/^[a-z0-9-]+$/, 'Slug: только латиница, цифры и дефис'),
  title: z.string().min(2, 'Название обязательно'),
  city: z.string().default(''),
  date: z.string().default(''),
  format: z.string().default(''),
  summary: z.string().min(3, 'Описание обязательно'),
  metrics: z.string().default(''),
  servicesText: z.string().default(''),
  imagesText: z.string().default(''),
});

type CaseFormValues = z.infer<typeof caseSchema>;

const defaultValues: CaseFormValues = {
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

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const AdminCasesManagerPage = () => {
  const { cases, addCase, updateCase, deleteCase, resetToDefault } = useCases();
  const [caseEditing, setCaseEditing] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues,
  });

  useUnsavedChangesGuard(isDirty);

  const uploadImages = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    setUploading(true);
    const urls: string[] = [];

    for (const file of list) {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `cases/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('images').upload(filePath, file, { upsert: false });
      if (error) {
        toast.error(`Ошибка загрузки ${file.name}`);
        continue;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      if (data?.publicUrl) urls.push(data.publicUrl);
    }

    if (urls.length) {
      setUploadedImages((prev) => [...prev, ...urls]);
      toast.success(`Загружено файлов: ${urls.length}`);
    }

    setUploading(false);
  };

  const onSubmit = async (values: CaseFormValues) => {
    const services = values.servicesText
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const manualImages = values.imagesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const images = Array.from(new Set([...uploadedImages, ...manualImages]));

    const payload: Omit<CaseItem, 'services'> & { services: string[] } = {
      slug: values.slug,
      title: values.title,
      city: values.city,
      date: values.date,
      format: values.format,
      summary: values.summary,
      metrics: values.metrics || undefined,
      services,
      images: images.length ? images : undefined,
    };

    let ok = false;
    if (caseEditing) {
      const updates = {
        title: payload.title,
        city: payload.city,
        date: payload.date,
        format: payload.format,
        summary: payload.summary,
        metrics: payload.metrics,
        services: payload.services,
        images: payload.images,
      };
      ok = await updateCase(caseEditing, updates);
    } else {
      ok = await addCase(payload);
    }

    if (!ok) {
      toast.error('Ошибка сохранения кейса');
      return;
    }

    toast.success(caseEditing ? 'Кейс обновлен' : 'Кейс добавлен');
    setCaseEditing(null);
    setUploadedImages([]);
    reset(defaultValues);
  };

  const startEdit = (item: CaseItem) => {
    setCaseEditing(item.slug);
    setUploadedImages(item.images ?? []);
    reset({
      slug: item.slug,
      title: item.title,
      city: item.city,
      date: item.date,
      format: item.format,
      summary: item.summary,
      metrics: item.metrics ?? '',
      servicesText: item.services.join(', '),
      imagesText: '',
    });
  };

  const cancelEdit = () => {
    setCaseEditing(null);
    setUploadedImages([]);
    reset(defaultValues);
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Удалить кейс "${title}"?`)) return;
    const ok = await deleteCase(slug);
    if (ok) toast.success('Кейс удален');
    else toast.error('Не удалось удалить кейс');
  };

  const sortedCases = useMemo(
    () => [...cases].sort((a, b) => b.date.localeCompare(a.date)),
    [cases]
  );

  return (
    <AdminLayout title="Кейсы" subtitle="Проекты, фото и ключевые метрики">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{caseEditing ? 'Редактирование кейса' : 'Новый кейс'}</h2>
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                Есть несохраненные изменения
              </span>
            )}
            {caseEditing && (
              <button type="button" onClick={cancelEdit} className="text-sm text-slate-300 hover:text-white">
                Отмена
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-200">
                Slug*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  disabled={Boolean(caseEditing)}
                  {...register('slug', {
                    onChange: (e) => {
                      const next = normalizeSlug(e.target.value);
                      setValue('slug', next, { shouldValidate: true });
                    },
                  })}
                />
                {errors.slug && <AdminFieldError message={errors.slug.message} />}
              </label>

              <label className="text-sm text-slate-200">
                Название*
                <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('title')} />
                {errors.title && <AdminFieldError message={errors.title.message} />}
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-200">
                Город
                <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('city')} />
              </label>
              <label className="text-sm text-slate-200">
                Дата
                <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('date')} />
              </label>
            </div>

            <label className="text-sm text-slate-200">
              Формат
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('format')} />
            </label>

            <label className="text-sm text-slate-200">
              Краткое описание*
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={3} {...register('summary')} />
              <AdminFieldError message={errors.summary?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Метрики
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('metrics')} />
            </label>

            <label className="text-sm text-slate-200">
              Услуги (через запятую)
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('servicesText')} />
            </label>

            <div className="space-y-2 rounded-lg border border-dashed border-white/20 bg-white/5 p-3">
              <div className="text-sm text-slate-200">Изображения (drag & drop / выбор файлов)</div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.length) void uploadImages(e.target.files);
                }}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white"
              />
              <div
                className="rounded-md border border-white/10 p-3 text-xs text-slate-400"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.length) void uploadImages(e.dataTransfer.files);
                }}
              >
                Перетащите изображения сюда
              </div>
              {uploading && <div className="text-xs text-brand-200">Загрузка файлов...</div>}
            </div>

            {uploadedImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400">Загруженные изображения</div>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImages.map((url) => (
                    <div key={url} className="group relative overflow-hidden rounded border border-white/10">
                      <img src={url} alt="preview" className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setUploadedImages((prev) => prev.filter((item) => item !== url))}
                        className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="text-sm text-slate-200">
              Доп. ссылки на изображения (через запятую)
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={2} {...register('imagesText')} />
            </label>

            <button
              type="submit"
              disabled={isSubmitting || uploading}
              className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
            >
              {isSubmitting ? 'Сохраняем...' : caseEditing ? 'Сохранить изменения' : 'Добавить кейс'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Список кейсов</h2>
            <button
              type="button"
              onClick={async () => {
                await resetToDefault();
                toast.success('Кейсы сброшены к демо-значениям');
              }}
              className="text-sm text-slate-300 hover:text-white"
            >
              Сброс к дефолту
            </button>
          </div>

          <div className="space-y-3">
            {sortedCases.map((c) => (
              <div key={c.slug} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{c.title}</div>
                    <div className="text-xs text-slate-400">{c.city} · {c.date} · {c.format}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-300">{c.summary}</div>
                    {c.images?.[0] && (
                      <img src={c.images[0]} alt={c.title} className="mt-2 h-16 w-24 rounded object-cover" />
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.services.map((s) => (
                        <span key={s} className="rounded bg-slate-700 px-2 py-0.5 text-[10px] uppercase text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="rounded border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40"
                    >
                      Ред.
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(c.slug, c.title)}
                      className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {sortedCases.length === 0 && <div className="text-center text-slate-400">Кейсов пока нет</div>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCasesManagerPage;
