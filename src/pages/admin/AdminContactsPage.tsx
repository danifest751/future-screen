import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Button, ConfirmModal, EmptyState, Field, Input, Textarea } from '../../components/admin/ui';
import { Phone } from 'lucide-react';
import { useContacts } from '../../hooks/useContacts';
import { useFormDraftPersistence } from '../../hooks/useFormDraftPersistence';
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

const schema = z.object({
  phonesText: z.string().min(3, 'Введите хотя бы один телефон'),
  emailsText: z.string().min(3, 'Введите хотя бы один email'),
  address: z.string().min(5, 'Адрес обязателен'),
  workingHours: z.string().min(2, 'Укажите рабочее время'),
});

type FormValues = z.infer<typeof schema>;

const defaultValues: FormValues = {
  phonesText: '',
  emailsText: '',
  address: '',
  workingHours: '',
};

const splitLines = (value: string) =>
  value
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);

const AdminContactsPage = () => {
  const { contacts, update, resetToDefault } = useContacts();
  const [resetModalOpen, setResetModalOpen] = useState(false);

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

  const { clearDraft: clearContactsDraft, hasDraft: hasContactsDraft, isHydrated } = useFormDraftPersistence<FormValues>({
    enabled: true,
    storageKey: 'admin-contacts-draft',
    reset,
    watch,
  });

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!isHydrated || hasContactsDraft) return;

    reset({
      phonesText: contacts.phones.join('\n'),
      emailsText: contacts.emails.join('\n'),
      address: contacts.address,
      workingHours: contacts.workingHours,
    });
  }, [contacts, hasContactsDraft, isHydrated, reset]);

  const onSubmit = async (values: FormValues) => {
    const ok = await update({
      phones: splitLines(values.phonesText),
      emails: splitLines(values.emailsText),
      address: values.address.trim(),
      workingHours: values.workingHours.trim(),
    });

    if (ok) toast.success('Контакты сохранены');
    else toast.error('Ошибка сохранения контактов');

    if (ok) clearContactsDraft();
  };

  const handleResetDefaults = async () => {
    await resetToDefault();
    toast.success('Контакты сброшены к дефолту');
    clearContactsDraft();
  };

  return (
    <AdminLayout title="Контакты" subtitle="Телефоны, email, адрес и рабочие часы">
      <ConfirmModal
        open={resetModalOpen}
        danger
        title="Сбросить контакты к дефолту?"
        description="Текущие контакты будут перезаписаны демо-значениями."
        confirmText="Сбросить"
        cancelText="Отмена"
        confirmDisabled={isSubmitting}
        onCancel={() => setResetModalOpen(false)}
        onConfirm={handleResetDefaults}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Редактирование контактов</h2>
            {isHydrated && hasContactsDraft && (
              <span className="rounded-full border border-brand-500/40 bg-brand-500/10 px-2 py-0.5 text-xs text-brand-100">
                Восстановлен черновик
              </span>
            )}
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                Есть несохраненные изменения
              </span>
            )}
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              disabled={isSubmitting}
              className="text-sm text-slate-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Сброс к дефолту
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field
              label="Телефоны"
              required
              hint="Каждый телефон с новой строки"
              error={errors.phonesText?.message}
            >
              <Textarea rows={4} {...register('phonesText')} />
            </Field>

            <Field
              label="Email"
              required
              hint="Каждый email с новой строки"
              error={errors.emailsText?.message}
            >
              <Textarea rows={3} {...register('emailsText')} />
            </Field>

            <Field label="Адрес" required error={errors.address?.message}>
              <Input {...register('address')} />
            </Field>

            <Field label="Время работы" required error={errors.workingHours?.message}>
              <Input {...register('workingHours')} />
            </Field>

            <Button type="submit" loading={isSubmitting} className="w-full">
              Сохранить контакты
            </Button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6 text-sm text-slate-200">
          <h2 className="mb-4 text-xl font-semibold text-white">Текущие данные</h2>
          {!contacts.phones.length && !contacts.emails.length ? (
            <EmptyState
                icon={<Phone size={32} className="text-brand-400" />}
              title="Контакты пока не заполнены"
              description="Заполните форму слева и сохраните изменения."
            />
          ) : (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400">Телефоны</div>
                <div>{contacts.phones.join(', ')}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Email</div>
                <div>{contacts.emails.join(', ')}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Адрес</div>
                <div>{contacts.address}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Время работы</div>
                <div>{contacts.workingHours}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContactsPage;
