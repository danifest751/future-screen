import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, EmptyState, Field, Input, Textarea } from '../../components/admin/ui';
import { FileText } from 'lucide-react';
import { usePrivacyPolicy } from '../../hooks/usePrivacyPolicy';
import { useFormDraftPersistence } from '../../hooks/useFormDraftPersistence';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

const schema = z.object({
  title: z.string().min(1, 'Заголовок обязателен'),
  content: z.string().min(1, 'Контент обязателен'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  title: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
};

const AdminPrivacyPolicyPage = () => {
  const { content, loading, saving, save, reload } = usePrivacyPolicy();
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { clearDraft: clearFormDraft, hasDraft: hasFormDraft, isHydrated } = useFormDraftPersistence<FormValues>({
    enabled: true,
    storageKey: 'admin-privacy-policy-draft',
    reset,
    watch,
  });

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!isHydrated || hasFormDraft || !content) return;

    reset({
      title: content.title || '',
      content: content.content || '',
      metaTitle: content.metaTitle || '',
      metaDescription: content.metaDescription || '',
    });

    if (content.updatedAt) {
      setLastSaved(new Date(content.updatedAt).toLocaleString('ru-RU'));
    }
  }, [content, hasFormDraft, isHydrated, reset]);

  const onSubmit = async (values: FormValues) => {
    const ok = await save({
      title: values.title.trim(),
      content: values.content,
      metaTitle: values.metaTitle?.trim() || null,
      metaDescription: values.metaDescription?.trim() || null,
    });

    if (ok) {
      toast.success('Политика конфиденциальности сохранена');
      clearFormDraft();
      setLastSaved(new Date().toLocaleString('ru-RU'));
    } else {
      toast.error('Ошибка сохранения');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Политика конфиденциальности" subtitle="Загрузка...">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Политика конфиденциальности"
      subtitle={lastSaved ? `Последнее сохранение: ${lastSaved}` : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Редактирование</h2>
            {isHydrated && hasFormDraft && (
              <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
                Восстановлен черновик
              </span>
            )}
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                Есть несохраненные изменения
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field
              label="Заголовок страницы (H1)"
              required
              error={errors.title?.message}
            >
              <Input {...register('title')} placeholder="Политика конфиденциальности" />
            </Field>

            <Field
              label="Контент (Markdown)"
              required
              error={errors.content?.message}
            >
              <Textarea
                rows={20}
                {...register('content')}
                className="font-mono text-sm"
                placeholder="# Заголовок&#10;&#10;Ваш контент здесь..."
              />
            </Field>

            <div className="border-t border-white/10 pt-4">
              <h3 className="mb-3 text-sm font-medium text-slate-300">SEO настройки</h3>
              <Field
                label="Meta Title"
                hint="До 60 символов"
                error={errors.metaTitle?.message}
              >
                <Input
                  {...register('metaTitle')}
                  placeholder="Политика конфиденциальности — Фьючер Скрин"
                />
              </Field>

              <Field
                label="Meta Description"
                hint="До 160 символов"
                error={errors.metaDescription?.message}
              >
                <Textarea
                  rows={2}
                  {...register('metaDescription')}
                  placeholder="Описание страницы для поисковых систем..."
                />
              </Field>
            </div>

            <Button type="submit" loading={isSubmitting || saving} className="w-full">
              Сохранить
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Предпросмотр</h2>
            <button
              type="button"
              onClick={() => window.open('/privacy', '_blank')}
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              Открыть на сайте →
            </button>
          </div>

          {content?.content ? (
            <div className="prose prose-invert prose-sm max-w-none overflow-auto rounded-lg bg-slate-900/50 p-4 text-slate-200">
              <div className="text-xs text-slate-500">
                Markdown контент рендерится на странице /privacy
              </div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-400">
                {watch('content')?.slice(0, 500)}
                {(watch('content')?.length || 0) > 500 && '...'}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<FileText size={32} className="text-brand-400" />}
              title="Контент не загружен"
              description="Заполните форму слева и сохраните."
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPrivacyPolicyPage;
