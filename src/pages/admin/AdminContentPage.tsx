import { FormEvent, useMemo, useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { usePackages } from '../../hooks/usePackages';
import { useCategories } from '../../hooks/useCategories';
import { useContacts } from '../../hooks/useContacts';
import { useCases } from '../../hooks/useCases';
import type { Package as PackageData } from '../../data/packages';
import type { Category } from '../../data/categories';
import type { CaseItem } from '../../data/cases';
import toast from 'react-hot-toast';
import { Button, ConfirmModal, EmptyState, Field, Input, Textarea } from '../../components/admin/ui';
import { Package, Tag, FolderOpen } from 'lucide-react';

const emptyPackage: PackageData = {
  id: 1,
  name: '',
  forFormats: [],
  includes: [],
  options: [],
  priceHint: '',
};

const emptyCategory: Category = {
  id: 1,
  title: '',
  shortDescription: '',
  bullets: [],
  pagePath: '/rent/light',
};

type Tab = 'packages' | 'categories' | 'contacts' | 'cases';

const tabs: { key: Tab; label: string }[] = [
  { key: 'packages', label: 'Пакеты' },
  { key: 'categories', label: 'Категории' },
  { key: 'contacts', label: 'Контакты' },
  { key: 'cases', label: 'Кейсы' },
];

type CaseFormState = Omit<CaseItem, 'services' | 'images'> & { services: string; imagesText: string; images: string[] };

const emptyCaseForm: CaseFormState = {
  slug: '', title: '', city: '', date: '', format: '', summary: '', metrics: '', imagesText: '', images: [], services: '',
};

type AdminContentPageProps = {
  initialTab?: Tab;
  tabsMode?: 'all' | 'single';
  title?: string;
  subtitle?: string;
};

const AdminContentPage = ({
  initialTab = 'packages',
  tabsMode = 'all',
  title = 'Контент',
  subtitle = 'Управление пакетами, категориями, контактами и кейсами',
}: AdminContentPageProps) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [pkgDeleteTarget, setPkgDeleteTarget] = useState<PackageData | null>(null);
  const [catDeleteTarget, setCatDeleteTarget] = useState<Category | null>(null);
  const [caseDeleteTarget, setCaseDeleteTarget] = useState<Pick<CaseItem, 'slug' | 'title'> | null>(null);
  const [resetTarget, setResetTarget] = useState<Tab | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Packages
  const { packages, upsert: upsertPackage, remove: removePackage, resetToDefault: resetPackages } = usePackages();
  const [pkgForm, setPkgForm] = useState<PackageData>(emptyPackage);
  const [pkgEditing, setPkgEditing] = useState<PackageData['id'] | null>(null);
  const pkgCanSubmit = useMemo(() => String(pkgForm.id).trim() && pkgForm.name.trim(), [pkgForm]);

  const submitPackage = async (e: FormEvent) => {
    e.preventDefault();
    if (!pkgCanSubmit) return;
    const ok = await upsertPackage(pkgForm);
    if (ok) {
      toast.success(pkgEditing ? 'Пакет успешно обновлён' : 'Пакет успешно добавлен');
      setPkgForm(emptyPackage);
      setPkgEditing(null);
    } else {
      toast.error('Ошибка при сохранении пакета');
    }
  };

  // Categories
  const { categories, upsert: upsertCategory, remove: removeCategory, resetToDefault: resetCategories } = useCategories();
  const [catForm, setCatForm] = useState<Category>(emptyCategory);
  const [catEditing, setCatEditing] = useState<Category['id'] | null>(null);

  const catCanSubmit = useMemo(() => (catForm.id as number | string).toString().trim() && catForm.title.trim(), [catForm]);

  const submitCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catCanSubmit) return;
    const ok = await upsertCategory(catForm);
    if (ok) {
      toast.success(catEditing ? 'Категория обновлена' : 'Категория добавлена');
      setCatForm(emptyCategory);
      setCatEditing(null);
    } else {
      toast.error('Ошибка при сохранении категории');
    }
  };

  // Contacts
  const { contacts, loading: contactsLoading, update: updateContacts, resetToDefault: resetContacts } = useContacts();
  const [contactsDraft, setContactsDraft] = useState<{ phones: string[]; emails: string[]; address: string; workingHours: string }>({
    phones: [],
    emails: [],
    address: '',
    workingHours: '',
  });

  useEffect(() => {
    if (contacts) {
      setContactsDraft({
        phones: contacts.phones,
        emails: contacts.emails,
        address: contacts.address,
        workingHours: contacts.workingHours,
      });
    }
  }, [contacts]);

  const submitContacts = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactsDraft) return;
    const ok = await updateContacts(contactsDraft as Parameters<typeof updateContacts>[0]);
    if (ok) {
      toast.success('Контакты успешно сохранены');
    } else {
      toast.error('Ошибка при сохранении контактов');
    }
  };

  // Cases
  const { cases, addCase, updateCase, deleteCase, resetToDefault: resetCases } = useCases();
  const [caseForm, setCaseForm] = useState<CaseFormState>(emptyCaseForm);
  const [caseEditing, setCaseEditing] = useState<string | null>(null);
  const caseCanSubmit = useMemo(() => caseForm.slug.trim() && caseForm.title.trim(), [caseForm.slug, caseForm.title]);

  const submitCase = async (e: FormEvent) => {
    e.preventDefault();
    if (!caseCanSubmit) return;
    const payload = {
      ...caseForm,
      services: caseForm.services.split(',').map((s) => s.trim()),
      images: [...caseForm.images, ...caseForm.imagesText.split(',').map((s) => s.trim()).filter(Boolean)],
    };
    
    let ok = false;
    if (caseEditing) {
      ok = await updateCase(caseEditing, payload);
    } else {
      ok = await addCase(payload);
    }
    
    if (ok) {
      toast.success(caseEditing ? 'Кейс обновлен' : 'Кейс добавлен');
      setCaseForm(emptyCaseForm);
      setCaseEditing(null);
    } else {
      toast.error('Ошибка сохранения кейса');
    }
  };

  const startEditCase = (item: CaseItem) => {
    setCaseForm({
      ...item,
      services: item.services.join(', '),
      imagesText: item.images?.join(', ') ?? '',
      images: item.images ?? [],
    });
    setCaseEditing(item.slug);
  };

  const handleDeletePackage = async () => {
    if (!pkgDeleteTarget) return;
    const ok = await removePackage(pkgDeleteTarget.id);
    if (ok) toast.success('Пакет удалён');
    else toast.error('Ошибка удаления пакета');
  };

  const handleDeleteCategory = async () => {
    if (!catDeleteTarget) return;
    const ok = await removeCategory(catDeleteTarget.id);
    if (ok) toast.success('Категория удалена');
    else toast.error('Ошибка удаления категории');
  };

  const handleDeleteCase = async () => {
    if (!caseDeleteTarget) return;
    const ok = await deleteCase(caseDeleteTarget.slug);
    if (ok) toast.success('Кейс удален');
    else toast.error('Ошибка удаления кейса');
  };

  const handleResetTarget = async () => {
    if (!resetTarget) return;
    if (resetTarget === 'packages') {
      await resetPackages();
      toast.success('Пакеты сброшены к дефолту');
      return;
    }
    if (resetTarget === 'categories') {
      await resetCategories();
      toast.success('Категории сброшены к дефолту');
      return;
    }
    if (resetTarget === 'contacts') {
      await resetContacts();
      setContactsDraft({ phones: [], emails: [], address: '', workingHours: '' });
      toast.success('Контакты сброшены к дефолту');
      return;
    }
    if (resetTarget === 'cases') {
      await resetCases();
      toast.success('Кейсы сброшены к дефолту');
    }
  };

  const resetModalTitle: Record<Tab, string> = {
    packages: 'Сбросить пакеты к дефолту?',
    categories: 'Сбросить категории к дефолту?',
    contacts: 'Сбросить контакты к дефолту?',
    cases: 'Сбросить кейсы к дефолту?',
  };

  const resetModalDescription: Record<Tab, string> = {
    packages: 'Текущий список пакетов будет перезаписан демо-данными.',
    categories: 'Текущий список категорий будет перезаписан демо-данными.',
    contacts: 'Контакты будут восстановлены из базового набора.',
    cases: 'Текущий список кейсов будет перезаписан демо-данными.',
  };

  return (
    <AdminLayout title={title} subtitle={subtitle}>
      <ConfirmModal
        open={Boolean(pkgDeleteTarget)}
        danger
        title="Удалить пакет?"
        description={pkgDeleteTarget ? `Пакет "${pkgDeleteTarget.name}" будет удален без возможности восстановления.` : ''}
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setPkgDeleteTarget(null)}
        onConfirm={handleDeletePackage}
      />
      <ConfirmModal
        open={Boolean(catDeleteTarget)}
        danger
        title="Удалить категорию?"
        description={catDeleteTarget ? `Категория "${catDeleteTarget.title}" будет удалена без возможности восстановления.` : ''}
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setCatDeleteTarget(null)}
        onConfirm={handleDeleteCategory}
      />
      <ConfirmModal
        open={Boolean(caseDeleteTarget)}
        danger
        title="Удалить кейс?"
        description={caseDeleteTarget ? `Кейс "${caseDeleteTarget.title}" будет удален без возможности восстановления.` : ''}
        confirmText="Удалить"
        cancelText="Отмена"
        onCancel={() => setCaseDeleteTarget(null)}
        onConfirm={handleDeleteCase}
      />
      <ConfirmModal
        open={Boolean(resetTarget)}
        danger
        title={resetTarget ? resetModalTitle[resetTarget] : ''}
        description={resetTarget ? resetModalDescription[resetTarget] : ''}
        confirmText="Сбросить"
        cancelText="Отмена"
        onCancel={() => setResetTarget(null)}
        onConfirm={handleResetTarget}
      />

      {tabsMode === 'all' && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === t.key
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                    : 'border border-white/15 text-slate-300 hover:border-white/30 hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <a
            href="/admin/leads"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:border-emerald-500/60"
          >
            Лента заявок
          </a>
        </div>
      )}

      <div className="space-y-6">

      {activeTab === 'packages' && (
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Пакеты</h2>
          <p className="mb-6 text-sm text-slate-400">Лайт / Медиум / Биг</p>
          <div className="grid gap-6 md:grid-cols-2">
            <form className="card space-y-3" onSubmit={submitPackage}>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">{pkgEditing ? 'Редактировать пакет' : 'Создать пакет'}</div>
                {pkgEditing && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setPkgForm(emptyPackage); setPkgEditing(null); }}>
                    Сбросить
                  </Button>
                )}
              </div>
              <Field label="ID" required>
                <Input
                  value={pkgForm.id}
                  onChange={(e) => setPkgForm((f) => ({ ...f, id: Number(e.target.value) || 0 }))}
                  required
                  disabled={!!pkgEditing}
                  type="number"
                />
              </Field>
              <Field label="Название" required>
                <Input
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Для форматов" hint="Через запятую или новую строку">
                <Textarea
                  value={pkgForm.forFormats.join(', ')}
                  onChange={(e) => setPkgForm((f) => ({ ...f, forFormats: e.target.value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) }))}
                  rows={2}
                />
              </Field>
              <Field label="Состав" hint="Каждый пункт с новой строки">
                <Textarea
                  value={pkgForm.includes.join('\n')}
                  onChange={(e) => setPkgForm((f) => ({ ...f, includes: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) }))}
                  rows={3}
                />
              </Field>
              <Field label="Опции" hint="Необязательно">
                <Textarea
                  value={pkgForm.options?.join('\n') || ''}
                  onChange={(e) => setPkgForm((f) => ({ ...f, options: e.target.value ? e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) : [] }))}
                  rows={2}
                />
              </Field>
              <Field label="Подсказка цены">
                <Input
                  value={pkgForm.priceHint || ''}
                  onChange={(e) => setPkgForm((f) => ({ ...f, priceHint: e.target.value }))}
                />
              </Field>
              <Button type="submit" disabled={!pkgCanSubmit} className="w-full">
                {pkgEditing ? 'Сохранить' : 'Добавить'}
              </Button>
            </form>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Список пакетов</div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setResetTarget('packages')}>
                  Сброс к дефолту
                </Button>
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                {packages.map((p) => (
                  <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.id}</div>
                    </div>
                    <div className="text-xs text-slate-400">Для: {p.forFormats?.join(', ') || '—'}</div>
                    <div className="mt-1 text-xs text-slate-300">{p.includes?.join(' · ') || '—'}</div>
                    {p.options && p.options.length > 0 && <div className="text-xs text-slate-400">Опции: {p.options.join(', ')}</div>}
                    {p.priceHint && <div className="text-xs text-brand-100">{p.priceHint}</div>}
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => { setPkgForm(p); setPkgEditing(p.id); }}
                      >
                        Редактировать
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setPkgDeleteTarget(p)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
                {packages.length === 0 && (
                  <EmptyState
                    icon={<Package size={32} className="text-brand-400" />}
                    title="Нет пакетов"
                    description="Создайте первый пакет через форму слева."
                  />
                )}
              </div>
            </div>
          </div>
      </div>
      )}

      {activeTab === 'categories' && (
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Категории аренды</h2>
          <p className="mb-6 text-sm text-slate-400">Свет, видео, звук, сцены, инструменты</p>
          <div className="grid gap-6 md:grid-cols-2">
            <form className="card space-y-3" onSubmit={submitCategory}>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">{catEditing ? 'Редактировать категорию' : 'Создать категорию'}</div>
                {catEditing && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setCatForm(emptyCategory); setCatEditing(null); }}>
                    Сбросить
                  </Button>
                )}
              </div>
              <Field label="ID" required>
                <Input
                  value={catForm.id}
                  onChange={(e) => setCatForm((f) => ({ ...f, id: Number(e.target.value) || 0 }))}
                  required
                  disabled={!!catEditing}
                  type="number"
                />
              </Field>
              <Field label="Заголовок" required>
                <Input
                  value={catForm.title}
                  onChange={(e) => setCatForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </Field>
              <Field label="Краткое описание">
                <Textarea
                  value={catForm.shortDescription}
                  onChange={(e) => setCatForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  rows={2}
                />
              </Field>
              <Field label="Буллеты" hint="Каждый с новой строки или через запятую">
                <Textarea
                  value={catForm.bullets.join('\n')}
                  onChange={(e) => setCatForm((f) => ({ ...f, bullets: e.target.value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) }))}
                  rows={3}
                />
              </Field>
              <Field label="Путь страницы">
                <Input
                  value={catForm.pagePath}
                  onChange={(e) => setCatForm((f) => ({ ...f, pagePath: e.target.value }))}
                />
              </Field>
              <Button type="submit" disabled={!catCanSubmit} className="w-full">
                {catEditing ? 'Сохранить' : 'Добавить'}
              </Button>
            </form>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Список категорий</div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setResetTarget('categories')}>
                  Сброс к дефолту
                </Button>
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                {categories.map((c) => (
                  <div key={c.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-white">{c.title}</div>
                      <div className="text-xs text-slate-400">{c.id}</div>
                    </div>
                    <div className="text-xs text-slate-400">{c.pagePath}</div>
                    <div className="mt-1 text-xs text-slate-300">{c.shortDescription}</div>
                    <div className="text-xs text-slate-400">Буллеты: {c.bullets.join(' · ')}</div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => { setCatForm(c); setCatEditing(c.id); }}
                      >
                        Редактировать
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setCatDeleteTarget(c)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && (
                  <EmptyState
                    icon={<Tag size={32} className="text-brand-400" />}
                    title="Нет категорий"
                    description="Создайте первую категорию через форму слева."
                  />
                )}
              </div>
            </div>
          </div>
      </div>
      )}

      {activeTab === 'contacts' && (
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Контакты</h2>
          <p className="mb-6 text-sm text-slate-400">Телефоны, email, адрес, время</p>
          {contactsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : !contacts ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              Контакты не загружены. Попробуйте обновить страницу.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <form className="card space-y-3" onSubmit={submitContacts}>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-white">Редактирование контактов</div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setResetTarget('contacts')}>
                    Сброс к дефолту
                  </Button>
                </div>
                <Field label="Телефоны" hint="Каждый с новой строки">
                  <Textarea
                    value={contactsDraft.phones.join('\n')}
                    onChange={(e) => setContactsDraft((f) => ({ ...f, phones: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) }))}
                    rows={3}
                  />
                </Field>
                <Field label="Email" hint="Каждый с новой строки">
                  <Textarea
                    value={contactsDraft.emails.join('\n')}
                    onChange={(e) => setContactsDraft((f) => ({ ...f, emails: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) }))}
                    rows={2}
                  />
                </Field>
                <Field label="Адрес">
                  <Input
                    value={contactsDraft.address}
                    onChange={(e) => setContactsDraft((f) => ({ ...f, address: e.target.value }))}
                  />
                </Field>
                <Field label="Время работы">
                  <Input
                    value={contactsDraft.workingHours}
                    onChange={(e) => setContactsDraft((f) => ({ ...f, workingHours: e.target.value }))}
                  />
                </Field>
                <Button type="submit" className="w-full">
                  Сохранить контакты
                </Button>
              </form>

              <div className="card space-y-3 text-sm text-slate-200">
                <div className="text-lg font-semibold text-white">Текущее значение</div>
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
                  <div className="text-xs text-slate-400">Время</div>
                  <div>{contacts.workingHours}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cases' && (
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Кейсы</h2>
              <p className="text-sm text-slate-400">Портфолио проектов</p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setResetTarget('cases')}
            >
              Сброс
            </Button>
          </div>
          
          <div className="grid gap-6 lg:grid-cols-2">
            <form className="card space-y-3" onSubmit={submitCase}>
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">{caseEditing ? 'Редактировать кейс' : 'Добавить кейс'}</div>
                {caseEditing && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setCaseForm(emptyCaseForm); setCaseEditing(null); }}>
                    Сбросить
                  </Button>
                )}
              </div>
              <Field label="Slug" required hint="Латиницей, без пробелов">
                <Input
                  value={caseForm.slug}
                  onChange={(e) => setCaseForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  required
                  disabled={!!caseEditing}
                />
              </Field>
              <Field label="Заголовок" required>
                <Input
                  value={caseForm.title}
                  onChange={(e) => setCaseForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Город">
                  <Input
                    value={caseForm.city}
                    onChange={(e) => setCaseForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </Field>
                <Field label="Дата/Год">
                  <Input
                    value={caseForm.date}
                    onChange={(e) => setCaseForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Формат мероприятия">
                <Input
                  value={caseForm.format}
                  onChange={(e) => setCaseForm((f) => ({ ...f, format: e.target.value }))}
                  placeholder="Концерт, Форум..."
                />
              </Field>
              <Field label="Услуги" hint="Через запятую: led, sound, light, video, stage, support">
                <Input
                  value={caseForm.services}
                  onChange={(e) => setCaseForm((f) => ({ ...f, services: e.target.value }))}
                  placeholder="led, sound"
                />
              </Field>
              <Field label="Краткое описание">
                <Textarea
                  rows={2}
                  value={caseForm.summary}
                  onChange={(e) => setCaseForm((f) => ({ ...f, summary: e.target.value }))}
                />
              </Field>
              <Field label="Метрики (результат)">
                <Input
                  value={caseForm.metrics}
                  onChange={(e) => setCaseForm((f) => ({ ...f, metrics: e.target.value }))}
                />
              </Field>
              <Field label="Ссылки на фото" hint="Через запятую">
                <Textarea
                  rows={2}
                  className="text-xs"
                  value={caseForm.imagesText}
                  onChange={(e) => setCaseForm((f) => ({ ...f, imagesText: e.target.value }))}
                  placeholder="https://..."
                />
              </Field>
              <Button
                type="submit"
                disabled={!caseCanSubmit}
                className="w-full"
              >
                {caseEditing ? 'Сохранить изменения' : 'Добавить кейс'}
              </Button>
            </form>

            <div className="space-y-3">
              {cases.map((c) => (
                <div key={c.slug} className="card group flex items-start justify-between p-4">
                  <div>
                    <div className="font-semibold text-white">{c.title}</div>
                    <div className="text-xs text-slate-400">{c.city} · {c.date}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.services.map((s) => (
                        <span key={s} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-brand-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 transition group-hover:opacity-100">
                    <Button type="button" variant="secondary" size="sm" onClick={() => startEditCase(c)}>
                      Ред.
                    </Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => setCaseDeleteTarget({ slug: c.slug, title: c.title })}>
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
              {cases.length === 0 && (
                <EmptyState
                  icon={<FolderOpen size={32} className="text-brand-400" />}
                  title="Нет кейсов"
                  description="Добавьте первый кейс через форму слева."
                />
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminContentPage;