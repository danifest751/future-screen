import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  FolderOpen,
  Image,
  Film,
  Search,
  Plus,
  Edit2,
  Trash2,
  HelpCircle,
  LayoutGrid,
  Library,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminFieldError from '../../components/admin/AdminFieldError';
import { ConfirmModal, EmptyState, FallbackDot } from '../../components/admin/ui';
import { CaseMediaSelector } from '../../components/admin/cases';
import { MediaLibrary } from '../../components/admin/media';
import { useCases } from '../../hooks/useCases';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';
import { useCaseMediaQuery, useLinkMediaToCaseMutation, useUnlinkMediaFromCaseMutation } from '../../queries/mediaLibrary';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import { adminCasesRedesignedContent as adminCasesRedesignedContentStatic, getAdminCasesRedesignedContent } from '../../content/pages/adminCasesRedesigned';
import type { CaseItem } from '../../data/cases';
import type { MediaItem } from '../../types/media';

const caseSchema = z.object({
  slug: z
    .string()
    .min(2, adminCasesRedesignedContentStatic.validation.slugRequired)
    .regex(/^[a-z0-9-]+$/, adminCasesRedesignedContentStatic.validation.slugPattern),
  title: z.string().min(2, adminCasesRedesignedContentStatic.validation.titleRequired),
  city: z.string().default(''),
  date: z.string().default(''),
  format: z.string().default(''),
  summary: z.string().min(3, adminCasesRedesignedContentStatic.validation.summaryRequired),
  metrics: z.string().default(''),
  servicesText: z.string().default(''),
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
};

const FORMAT_OPTIONS = adminCasesRedesignedContentStatic.formatOptions;

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo',
    ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    ' ': '-', _: '-',
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

const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1 flex items-start gap-1 text-xs text-slate-500">
    <HelpCircle size={12} className="mt-0.5 shrink-0" />
    <span>{children}</span>
  </div>
);

const getCaseIdBySlug = async (slug: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from('cases')
    .select('id')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data.id;
};

const AdminCasesRedesignedPage = () => {
  const { adminLocale, adminContentLocale, setAdminContentLocale } = useI18n();
  const adminCasesRedesignedContent = getAdminCasesRedesignedContent(adminLocale);
  const { cases, getEditorCase, fallbackBySlug, addCase, updateCase, deleteCase, resetToDefault } = useCases(adminContentLocale);
  const [activeTab, setActiveTab] = useState<'cases' | 'media'>('cases');
  const [caseEditing, setCaseEditing] = useState<string | null>(null);
  const [editingCaseId, setEditingCaseId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Pick<CaseItem, 'slug' | 'title'> | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const linkMediaMutation = useLinkMediaToCaseMutation();
  const unlinkMediaMutation = useUnlinkMediaFromCaseMutation();

  const { data: caseMediaLinks } = useCaseMediaQuery(editingCaseId ?? undefined);

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

  useEffect(() => {
    setDeleteTarget(null);
    setResetModalOpen(false);
    setSearchQuery('');
    setActiveTab('cases');

    if (!caseEditing) {
      setEditingCaseId(null);
      setSelectedMedia([]);
      setAutoSlug(true);
      reset(defaultValues);
      return;
    }

    const currentCase = getEditorCase(caseEditing);
    if (!currentCase) {
      setEditingCaseId(null);
      setSelectedMedia([]);
      setAutoSlug(true);
      reset(defaultValues);
      return;
    }

    reset({
      slug: currentCase.slug,
      title: currentCase.title,
      city: currentCase.city,
      date: currentCase.date,
      format: currentCase.format,
      summary: currentCase.summary,
      metrics: currentCase.metrics ?? '',
      servicesText: currentCase.services.join(', '),
    });
  }, [adminContentLocale, caseEditing, getEditorCase, reset]);

  useEffect(() => {
    if (!caseEditing) return;

    const currentCase = getEditorCase(caseEditing);
    if (!currentCase) return;

    reset({
      slug: currentCase.slug,
      title: currentCase.title,
      city: currentCase.city,
      date: currentCase.date,
      format: currentCase.format,
      summary: currentCase.summary,
      metrics: currentCase.metrics ?? '',
      servicesText: currentCase.services.join(', '),
    });
  }, [caseEditing, getEditorCase, reset]);

  useEffect(() => {
    if (caseMediaLinks && caseMediaLinks.length > 0) {
      const media = caseMediaLinks.map((link) => link.media).filter(Boolean) as MediaItem[];
      setSelectedMedia(media);
    } else if (!editingCaseId) {
      setSelectedMedia([]);
    }
  }, [caseMediaLinks, editingCaseId]);

  const titleValue = watch('title');
  const slugValue = watch('slug');

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

  const syncCaseMedia = async (caseId: number, mediaItems: MediaItem[]) => {
    try {
      const currentMediaIds = caseMediaLinks?.map((link) => link.media_id) || [];
      const newMediaIds = mediaItems.map((m) => m.id);

      const toUnlink = currentMediaIds.filter((id) => !newMediaIds.includes(id));
      const toLink = newMediaIds.filter((id) => !currentMediaIds.includes(id));

      if (toUnlink.length > 0) {
        await unlinkMediaMutation.mutateAsync({ caseId, mediaIds: toUnlink });
      }

      if (toLink.length > 0) {
        await linkMediaMutation.mutateAsync({ caseId, mediaIds: toLink });
      }
    } catch (error) {
      console.error('Error syncing case media:', error);
    }
  };

  const onSubmit = async (values: CaseFormValues) => {
    const services = values.servicesText
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const images = selectedMedia
      .filter((m) => m.type === 'image')
      .map((m) => m.public_url);

    const videos = selectedMedia
      .filter((m) => m.type === 'video')
      .map((m) => m.public_url);

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
      videos: videos.length ? videos : undefined,
    };

    let ok = false;
    let caseId: number | null = null;

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
      if (ok) {
        caseId = editingCaseId;
      }
    } else {
      ok = await addCase(payload);
      if (ok) {
        caseId = await getCaseIdBySlug(values.slug);
      }
    }

    if (!ok) {
      toast.error(adminCasesRedesignedContent.toasts.saveError);
      return;
    }

    if (caseId && selectedMedia.length > 0) {
      await syncCaseMedia(caseId, selectedMedia);
    }

    toast.success(
      caseEditing ? adminCasesRedesignedContent.toasts.updateSuccess : adminCasesRedesignedContent.toasts.addSuccess
    );
    setCaseEditing(null);
    setEditingCaseId(null);
    setSelectedMedia([]);
    setAutoSlug(true);
    reset(defaultValues);
  };

  const startEdit = async (item: CaseItem) => {
    const editorCase = getEditorCase(item.slug) ?? item;
    setCaseEditing(item.slug);
    setAutoSlug(false);
    reset({
      slug: editorCase.slug,
      title: editorCase.title,
      city: editorCase.city,
      date: editorCase.date,
      format: editorCase.format,
      summary: editorCase.summary,
      metrics: editorCase.metrics ?? '',
      servicesText: editorCase.services.join(', '),
    });

    const caseId = await getCaseIdBySlug(item.slug);
    if (caseId) {
      setEditingCaseId(caseId);
    } else {
      const mediaItems: MediaItem[] = [];
      if (editorCase.images) {
        editorCase.images.forEach((url, index) => {
          mediaItems.push({
            id: `img-${index}`,
            name: url.split('/').pop() || 'image',
            storage_path: '',
            public_url: url,
            type: 'image',
            mime_type: 'image/jpeg',
            size_bytes: 0,
            tags: [],
            uploaded_by: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }
      if ((editorCase as CaseItem & { videos?: string[] }).videos) {
        (editorCase as CaseItem & { videos?: string[] }).videos?.forEach((url, index) => {
          mediaItems.push({
            id: `vid-${index}`,
            name: url.split('/').pop() || 'video',
            storage_path: '',
            public_url: url,
            type: 'video',
            mime_type: 'video/mp4',
            size_bytes: 0,
            tags: [],
            uploaded_by: 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      }
      setSelectedMedia(mediaItems);
    }
    setActiveTab('cases');
  };

  const cancelEdit = () => {
    setCaseEditing(null);
    setEditingCaseId(null);
    setSelectedMedia([]);
    setAutoSlug(true);
    reset(defaultValues);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteCase(deleteTarget.slug);
    if (ok) toast.success(adminCasesRedesignedContent.toasts.deleteSuccess);
    else toast.error(adminCasesRedesignedContent.toasts.deleteError);
    setDeleteTarget(null);
  };

  const handleResetDefaults = async () => {
    await resetToDefault();
    toast.success(adminCasesRedesignedContent.toasts.resetSuccess);
  };

  const filteredCases = useMemo(() => {
    let sorted = [...cases].sort((a, b) => b.date.localeCompare(a.date));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      sorted = sorted.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.format.toLowerCase().includes(q) ||
        c.services.some((s) => s.toLowerCase().includes(q))
      );
    }
    return sorted;
  }, [cases, searchQuery]);

  const editingFallbackUsed = adminContentLocale === 'en' && !!(caseEditing && fallbackBySlug[caseEditing]);
  const sourceLabel =
    adminLocale === 'ru'
      ? adminContentLocale === 'en'
        ? editingFallbackUsed
          ? 'Источник: RU fallback'
          : 'Источник: EN локаль'
        : 'Источник: RU локаль'
      : adminContentLocale === 'en'
        ? editingFallbackUsed
          ? 'Source: RU fallback'
          : 'Source: EN locale'
        : 'Source: RU locale';

  const getCaseMediaCount = (caseItem: CaseItem) => {
    const imageCount = caseItem.images?.length || 0;
    const videoCount = (caseItem as CaseItem & { videos?: string[] }).videos?.length || 0;
    return { imageCount, videoCount };
  };

  return (
    <AdminLayout
      title={adminCasesRedesignedContent.layout.title}
      subtitle={adminCasesRedesignedContent.layout.subtitle}
      contentLocale={adminContentLocale}
      onContentLocaleChange={setAdminContentLocale}
    >
      <div className="mb-6 flex justify-end gap-2">
        <button
          onClick={() => setActiveTab('cases')}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            activeTab === 'cases'
              ? 'border-brand-500 bg-brand-500/20 text-brand-300'
              : 'border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <LayoutGrid size={16} />
          {adminCasesRedesignedContent.tabs.cases}
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
            activeTab === 'media'
              ? 'border-brand-500 bg-brand-500/20 text-brand-300'
              : 'border-white/10 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <Library size={16} />
          {adminCasesRedesignedContent.tabs.media}
        </button>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        danger
        title={adminCasesRedesignedContent.confirm.deleteTitle}
        description={deleteTarget ? adminCasesRedesignedContent.confirm.deleteDescription(deleteTarget.title) : ''}
        confirmText={adminCasesRedesignedContent.confirm.deleteConfirm}
        cancelText={adminCasesRedesignedContent.confirm.cancel}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        open={resetModalOpen}
        danger
        title={adminCasesRedesignedContent.confirm.resetTitle}
        description={adminCasesRedesignedContent.confirm.resetDescription}
        confirmText={adminCasesRedesignedContent.confirm.resetConfirm}
        cancelText={adminCasesRedesignedContent.confirm.cancel}
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaults}
      />

      {activeTab === 'media' ? (
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white">{adminCasesRedesignedContent.mediaSection.title}</h2>
            <p className="text-sm text-slate-400">{adminCasesRedesignedContent.mediaSection.description}</p>
          </div>
          <MediaLibrary />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">
                  {caseEditing ? adminCasesRedesignedContent.form.editTitle : adminCasesRedesignedContent.form.newTitle}
                </h2>
                <FallbackDot visible={editingFallbackUsed} locale={adminContentLocale} />
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-slate-300">
                  {sourceLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                    {adminCasesRedesignedContent.form.unsavedChanges}
                  </span>
                )}
                {caseEditing && (
                  <button type="button" onClick={cancelEdit} className="text-sm text-slate-300 hover:text-white">
                    {adminCasesRedesignedContent.form.cancel}
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-200">
                  <span className="flex items-center gap-1">
                    {adminCasesRedesignedContent.form.slugLabel}
                    {!caseEditing && autoSlug && (
                      <span className="text-[10px] text-brand-400">{adminCasesRedesignedContent.form.slugAutoLabel}</span>
                    )}
                  </span>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    disabled={Boolean(caseEditing)}
                    value={slugValue}
                    onChange={handleSlugChange}
                    placeholder={adminCasesRedesignedContent.form.slugPlaceholder}
                  />
                  {errors.slug && <AdminFieldError message={errors.slug.message} />}
                  <FieldHint>{adminCasesRedesignedContent.form.slugHint}</FieldHint>
                </label>

                <label className="text-sm text-slate-200">
                  {adminCasesRedesignedContent.form.titleLabel}
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    value={titleValue}
                    onChange={handleTitleChange}
                    placeholder={adminCasesRedesignedContent.form.titlePlaceholder}
                  />
                  {errors.title && <AdminFieldError message={errors.title.message} />}
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-200">
                  {adminCasesRedesignedContent.form.cityLabel}
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    {...register('city')}
                    placeholder={adminCasesRedesignedContent.form.cityPlaceholder}
                  />
                </label>
                <label className="text-sm text-slate-200">
                  {adminCasesRedesignedContent.form.dateLabel}
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200"
                    {...register('date')}
                  />
                </label>
              </div>

              <label className="text-sm text-slate-200">
                {adminCasesRedesignedContent.form.formatLabel}
                <select
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-slate-200"
                  {...register('format')}
                >
                  <option value="">{adminCasesRedesignedContent.form.formatPlaceholder}</option>
                  {FORMAT_OPTIONS.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-slate-200">
                {adminCasesRedesignedContent.form.summaryLabel}
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  rows={3}
                  {...register('summary')}
                  placeholder={adminCasesRedesignedContent.form.summaryPlaceholder}
                />
                <AdminFieldError message={errors.summary?.message} />
              </label>

              <label className="text-sm text-slate-200">
                {adminCasesRedesignedContent.form.metricsLabel}
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  {...register('metrics')}
                  placeholder={adminCasesRedesignedContent.form.metricsPlaceholder}
                />
              </label>

              <label className="text-sm text-slate-200">
                {adminCasesRedesignedContent.form.servicesLabel}
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  {...register('servicesText')}
                  placeholder={adminCasesRedesignedContent.form.servicesPlaceholder}
                />
              </label>

              <div>
                <label className="mb-2 block text-sm text-slate-200">
                  {adminCasesRedesignedContent.form.mediaFilesLabel}
                </label>
                <CaseMediaSelector selectedMedia={selectedMedia} onChange={setSelectedMedia} />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-60"
              >
                {isSubmitting
                  ? adminCasesRedesignedContent.form.submitting
                  : caseEditing
                    ? adminCasesRedesignedContent.form.submitEdit
                    : adminCasesRedesignedContent.form.submitCreate}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{adminCasesRedesignedContent.list.title}</h2>
              <button
                type="button"
                onClick={() => setResetModalOpen(true)}
                className="text-sm text-slate-300 hover:text-white"
              >
                {adminCasesRedesignedContent.list.resetAction}
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={adminCasesRedesignedContent.list.searchPlaceholder}
                className="w-full rounded-lg border border-white/10 bg-slate-900 py-2 pl-10 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
                >
                  <Plus size={14} className="rotate-45" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              {filteredCases.map((c) => {
                const { imageCount, videoCount } = getCaseMediaCount(c);

                return (
                  <div key={c.slug} className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-semibold text-white">{c.title}</h3>
                          <FallbackDot visible={adminContentLocale === 'en' && !!fallbackBySlug[c.slug]} locale={adminContentLocale} />
                          <span className="text-xs text-slate-500">({c.slug})</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span>{c.city}</span>
                          <span>{adminCasesRedesignedContent.list.separator}</span>
                          <span>{c.date}</span>
                          <span>{adminCasesRedesignedContent.list.separator}</span>
                          <span>{c.format}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-300">{c.summary}</p>

                        <div className="mt-2 flex items-center gap-3">
                          {imageCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Image size={12} />
                              {imageCount} {adminCasesRedesignedContent.list.photosSuffix}
                            </span>
                          )}
                          {videoCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Film size={12} />
                              {videoCount} {adminCasesRedesignedContent.list.videosSuffix}
                            </span>
                          )}
                        </div>

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
                          className="flex items-center justify-center gap-1 rounded border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-white/40"
                        >
                          <Edit2 size={12} />
                          {adminCasesRedesignedContent.list.editAction}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ slug: c.slug, title: c.title })}
                          className="flex items-center justify-center gap-1 rounded border border-red-400/40 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:border-red-400"
                        >
                          <Trash2 size={12} />
                          {adminCasesRedesignedContent.list.deleteAction}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredCases.length === 0 && (
                <EmptyState
                  icon={<FolderOpen size={32} className="text-brand-400" />}
                  title={adminCasesRedesignedContent.list.emptyTitle}
                  description={
                    searchQuery
                      ? adminCasesRedesignedContent.list.emptySearchDescription
                      : adminCasesRedesignedContent.list.emptyDefaultDescription
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCasesRedesignedPage;
