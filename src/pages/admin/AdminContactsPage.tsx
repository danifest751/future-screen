import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminFieldError from '../../components/admin/AdminFieldError';
import { useContacts } from '../../hooks/useContacts';
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    reset({
      phonesText: contacts.phones.join('\n'),
      emailsText: contacts.emails.join('\n'),
      address: contacts.address,
      workingHours: contacts.workingHours,
    });
  }, [contacts, reset]);

  const onSubmit = async (values: FormValues) => {
    const ok = await update({
      phones: splitLines(values.phonesText),
      emails: splitLines(values.emailsText),
      address: values.address.trim(),
      workingHours: values.workingHours.trim(),
    });

    if (ok) toast.success('Контакты сохранены');
    else toast.error('Ошибка сохранения контактов');
  };

  return (
    <AdminLayout title="Контакты" subtitle="Телефоны, email, адрес и рабочие часы">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Редактирование контактов</h2>
            {isDirty && (
              <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
                Есть несохраненные изменения
              </span>
            )}
            <button
              type="button"
              onClick={async () => {
                await resetToDefault();
                toast.success('Контакты сброшены к дефолту');
              }}
              className="text-sm text-slate-300 hover:text-white"
            >
              Сброс к дефолту
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <label className="text-sm text-slate-200">
              Телефоны (каждый с новой строки)
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={4} {...register('phonesText')} />
              <AdminFieldError message={errors.phonesText?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Email (каждый с новой строки)
              <textarea className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" rows={3} {...register('emailsText')} />
              <AdminFieldError message={errors.emailsText?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Адрес
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('address')} />
              <AdminFieldError message={errors.address?.message} />
            </label>

            <label className="text-sm text-slate-200">
              Время работы
              <input className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2" {...register('workingHours')} />
              <AdminFieldError message={errors.workingHours?.message} />
            </label>

            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-60">
              {isSubmitting ? 'Сохраняем...' : 'Сохранить контакты'}
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-800 p-6 text-sm text-slate-200">
          <h2 className="mb-4 text-xl font-semibold text-white">Текущие данные</h2>
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContactsPage;
