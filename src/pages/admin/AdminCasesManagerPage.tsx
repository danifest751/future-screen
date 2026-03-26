import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminFieldError from '../../components/admin/AdminFieldError';
import { ConfirmModal, EmptyState } from '../../components/admin/ui';
import { FolderOpen, X, HelpCircle } from 'lucide-react';
import { useCases } from '../../hooks/useCases';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import type { CaseItem } from '../../data/cases';
import { supabase } from '../../lib/supabase';
import { compressImages, isImageFile, formatFileSize } from '../../lib/imageCompression';

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

// Format options for dropdown
const FORMAT_OPTIONS = [
  'Корпоратив',
  'Концерт',
  'Конференция',
  'Выставка',
  'Свадьба',
  'Презентация',
  'Фестиваль',
  'Тимбилдинг',
  'Другое',
];

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// Transliterate Russian to Latin for slug generation
const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', '_': '-',
  };
  return text
    .toLowerCase()
    .split('')
    .map((char) => map[char] || char)
    .join('')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Tooltip component
const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1 flex items-start gap-1 text-xs text-slate-500">
    <HelpCircle size={12} className="mt-0.5 shrink-0" />
    <span>{children}</span>
  </div>
);

const AdminCasesManagerPage = () => {
  const { cases, addCase, updateCase, deleteCase, resetToDefault } = useCases();
  const [caseEditing, setCaseEditing] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedVideos, setUploadedVideos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Pick<CaseItem, 'slug' | 'title'> | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues,
  });

  useUnsavedChangesGuard(isDirty);

  const titleValue = watch('title');
  const slugValue = watch('slug');

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue('title', newTitle);
    if (autoSlug && !caseEditing) {
      const generatedSlug = transliterate(newTitle);
      setValue('slug', generatedSlug, { shouldValidate: true });
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = normalizeSlug(e.target.value);
    setValue('slug', newSlug, { shouldValidate: true });
    setAutoSlug(false);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    setUploading(true);
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];

    // Separate images and videos
    const imageFiles = list.filter(isImageFile);
    const videoFiles = list.filter((f) => !isImageFile(f));

    // Compress images before upload
    let compressedImages = imageFiles;
    if (imageFiles.length > 0) {
      toast.loading(`Сжатие ${imageFiles.length} изображений...`, { id: 'compression' });
      compressedImages = await compressImages(imageFiles, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
      });
      toast.success(`Сжато ${compressedImages.length} изображений`, { id: 'compression' });
    }

    // Upload all files
    const filesToUpload = [...compressedImages, ...videoFiles];

    for (const file of filesToUpload) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = !isImageFile(file);
      const folder = isVideo ? 'videos' : 'cases';
      const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('images').upload(filePath, file, { upsert: false });
      if (error) {
        toast.error(`Ошибка загрузки ${file.name}`);
        continue;
      }

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      if (data?.publicUrl) {
        if (isVideo) {
          videoUrls.push(data.publicUrl);
        } else {
          imageUrls.push(data.publicUrl);
        }
      }
    }

    if (imageUrls.length) {
      setUploadedImages((prev) => [...prev, ...imageUrls]);
      const originalSize = imageFiles.reduce((acc, f) => acc + f.size, 0);
      const compressedSize = compressedImages.reduce((acc, f) => acc + f.size, 0);
      toast.success(
        `Загружено ${imageUrls.length} изображений (${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)})`
      );
    }
    if (videoUrls.length) {
      setUploadedVideos((prev) => [...prev, ...videoUrls]);
      toast.success(`Загружено ${videoUrls.length} видео`);
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
    const videos = uploadedVideos.length ? uploadedVideos : undefined;

    const payload: Omit<CaseItem, 'services'> & { services: string[]; videos?: string[] } = {
      slug: values.slug,
      title: values.title,
      city: values.city,
      date: values.date,
      format: values.format,
      summary: values.summary,
      metrics: values.metrics || undefined,
      services,
      images: images.length ? images : undefined,
      videos,
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
        videos: payload.videos,
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
    setUploadedVideos([]);
    setAutoSlug(true);
    reset(defaultValues);
  };

  const startEdit = (item: CaseItem) => {
    setCaseEditing(item.slug);
    setUploadedImages(item.images ?? []);
    setUploadedVideos((item as CaseItem & { videos?: string[] }).videos ?? []);
    setAutoSlug(false);
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
    setUploadedVideos([]);
    setAutoSlug(true);
    reset(defaultValues);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteCase(deleteTarget.slug);
    if (ok) toast.success('Кейс удален');
    else toast.error('Не удалось удалить кейс');
  };

  const handleResetDefaults = async () => {
    await resetToDefault();
    toast.success('Кейсы сброшены к демо-значениям');
  };

  const sortedCases = useMemo(
    () => [...cases].sort((a, b) => b.date.localeCompare(a.date)),
    [cases]
  );

  return (
    <AdminLayout title="Кейсы" subtitle="Проекты, фото и ключевые метрики">
      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title="Удалить кейс?"
        description={deleteTarget ? `Кейс "${deleteTarget.title}" будет удален без возможности восстановления.` : ''}
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
      <ConfirmModal
        open={resetModalOpen}
        danger
        title="Сбросить все кейсы к дефолту?"
        description="Текущие кейсы будут перезаписаны демо-значениями."
        confirmText="Сбросить"
        cancelText="Отмена"
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaults}
      />

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
                <span className="flex items-center gap-1">
                  Slug*
                  {!caseEditing && autoSlug && (
                    <span className="text-[10px] text-brand-400">(авто)</span>
                  )}
                </span>
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  disabled={Boolean(caseEditing)}
                  value={slugValue}
                  onChange={handleSlugChange}
                  placeholder="nazvanie-kejsa"
                />
                {errors.slug && <AdminFieldError message={errors.slug.message} />}
                <FieldHint>Уникальный идентификатор для URL. Только латиница, цифры и дефис. Генерируется автоматически из названия.</FieldHint>
              </label>

              <label className="text-sm text-slate-200">
                Название*
                <input 
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" 
                  value={titleValue}
                  onChange={handleTitleChange}
                  placeholder="Например: Корпоратив Газпром"
                />
                {errors.title && <AdminFieldError message={errors.title.message} />}
                <FieldHint>Название кейса для отображения на сайте. От него автоматически генерируется slug.</FieldHint>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-200">
                Город
                <input 
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" 
                  {...register('city')}
                  placeholder="Екатеринбург"
                />
                <FieldHint>Город проведения мероприятия. Отображается в списке кейсов.</FieldHint>
              </label>
              <label className="text-sm text-slate-200">
                Дата
                <input 
                  type="date"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200" 
                  {...register('date')}
                />
                <FieldHint>Дата проведения мероприятия. Используется для сортировки кейсов.</FieldHint>
              </label>
            </div>

            <label className="text-sm text-slate-200">
              Формат
              <select 
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200" 
                {...register('format')}
              >
                <option value="">Выберите формат</option>
                {FORMAT_OPTIONS.map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
              <FieldHint>Тип мероприятия. Помогает клиентам понять ваш опыт в конкретной сфере.</FieldHint>
            </label>

            <label className="text-sm text-slate-200">
              Краткое описание*
              <textarea 
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" 
                rows={3} 
                {...register('summary')}
                placeholder="Описание задачи и что было сделано..."
              />
              <AdminFieldError message={errors.summary?.message} />
              <FieldHint>Краткое описание проекта (2-3 предложения). Отображается в списке кейсов и на детальной странице.</FieldHint>
            </label>

            <label className="text-sm text-slate-200">
              <span className="flex items-center gap-1">
                Метрики
              </span>
              <input 
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" 
                {...register('metrics')}
                placeholder="500+ гостей, 50 м² экран"
              />
              <FieldHint>Ключевые цифры проекта через запятую. Например: «500+ гостей, 50 м² экран, 3 дня». Отображаются в карточке кейса.</FieldHint>
            </label>

            <label className="text-sm text-slate-200">
              Услуги (через запятую)
              <input 
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" 
                {...register('servicesText')}
                placeholder="LED-экран, звук, свет"
              />
              <FieldHint>Перечислите услуги, которые были оказаны. Отображаются как теги в карточке кейса.</FieldHint>
            </label>

            <div className="space-y-2 rounded-lg border border-dashed border-white/20 bg-white/5 p-3">
              <div className="text-sm text-slate-200">Изображения и видео (drag & drop / выбор файлов)</div>
              <input
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  if (e.target.files?.length) void uploadFiles(e.target.files);
                }}
                className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-white"
              />
              <div
                className="rounded-md border border-white/10 p-3 text-xs text-slate-400"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
                }}
              >
                Перетащите изображения или видео сюда
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
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadedVideos.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400">Загруженные видео</div>
                <div className="space-y-2">
                  {uploadedVideos.map((url) => (
                    <div key={url} className="group relative flex items-center gap-2 rounded border border-white/10 bg-slate-700/50 p-2">
                      <video src={url} className="h-12 w-16 rounded object-cover" />
                      <span className="flex-1 truncate text-xs text-slate-300">{url.split('/').pop()}</span>
                      <button
                        type="button"
                        onClick={() => setUploadedVideos((prev) => prev.filter((item) => item !== url))}
                        className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-300 transition hover:bg-red-500/30"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="text-sm text-slate-200">
              Доп. ссылки на изображения (через запятую)
              <textarea 
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" 
                rows={2} 
                {...register('imagesText')}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
              <FieldHint>Ссылки на внешние изображения. Используйте, если файлы уже загружены на другой хостинг.</FieldHint>
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
              onClick={() => setResetModalOpen(true)}
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
                      onClick={() => setDeleteTarget({ slug: c.slug, title: c.title })}
                      className="rounded border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {sortedCases.length === 0 && (
              <EmptyState
                icon={<FolderOpen size={32} className="text-brand-400" />}
                title="Кейсов пока нет"
                description="Добавьте первый кейс через форму слева."
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCasesManagerPage;
