import { FormEvent, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { usePackages } from '../../hooks/usePackages';
import { useCategories } from '../../hooks/useCategories';
import { useContacts } from '../../hooks/useContacts';
import { useCases } from '../../hooks/useCases';
import { useCalculatorConfig } from '../../hooks/useCalculatorConfig';
import type { PitchOption, ScreenSizePreset, ScreenProduct, CostParams, Location } from '../../data/calculatorConfig';
import type { Package } from '../../data/packages';
import type { Category } from '../../data/categories';
import type { CaseItem } from '../../data/cases';
import { contacts as baseContacts } from '../../data/contacts';
import { slugify } from '../../utils/slugify';

const emptyPackage: Package = {
  id: 'light',
  name: '',
  forFormats: [],
  includes: [],
  options: [],
  priceHint: '',
};

const emptyCategory: Category = {
  id: 'light',
  title: '',
  shortDescription: '',
  bullets: [],
  pagePath: '/rent/light',
};

type Tab = 'packages' | 'categories' | 'contacts' | 'calculator';

const tabs: { key: Tab; label: string }[] = [
  { key: 'packages', label: 'Пакеты' },
  { key: 'categories', label: 'Категории' },
  { key: 'contacts', label: 'Контакты' },
  { key: 'calculator', label: 'Калькулятор' },
];

type CaseFormState = Omit<CaseItem, 'services' | 'images'> & { services: string; imagesText: string; images: string[] };

const emptyCaseForm: CaseFormState = {
  slug: '', title: '', city: '', date: '', format: '', summary: '', metrics: '', imagesText: '', images: [], services: '',
};

const AdminContentPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('packages');

  // Calculator config
  const { config: calcConfig, updateConfig: updateCalcConfig, resetConfig: resetCalcConfig } = useCalculatorConfig();
  const [pitchList, setPitchList] = useState<PitchOption[]>(calcConfig.pitchOptions);
  const [sizePresets, setSizePresets] = useState<ScreenSizePreset[]>(calcConfig.sizePresets);
  const [screenProducts, setScreenProducts] = useState<ScreenProduct[]>(calcConfig.screenProducts);
  const [costParams, setCostParams] = useState<CostParams>(calcConfig.costParams);

  useEffect(() => {
    setPitchList(calcConfig.pitchOptions);
    setSizePresets(calcConfig.sizePresets);
    setScreenProducts(calcConfig.screenProducts);
    setCostParams(calcConfig.costParams);
  }, [calcConfig]);

  const addPitch = () => {
    setPitchList((list) => [...list, { label: 'Новый', value: 3.9, minDistance: 3, maxDistance: 6, description: '', stockArea: 0 }]);
  };

  const updatePitchField = (idx: number, field: keyof PitchOption, value: string) => {
    setPitchList((list) =>
      list.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: field === 'label' || field === 'description' ? value : Number(value),
            }
          : item
      )
    );
  };

  const removePitch = (idx: number) => {
    setPitchList((list) => list.filter((_, i) => i !== idx));
  };

  const addSizePreset = () => {
    setSizePresets((list) => [...list, { label: 'Новый', width: 4, height: 2 }]);
  };

  const updateSizeField = (idx: number, field: keyof ScreenSizePreset, value: string) => {
    setSizePresets((list) =>
      list.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: field === 'label' ? value : Number(value),
            }
          : item
      )
    );
  };

  const removeSize = (idx: number) => {
    setSizePresets((list) => list.filter((_, i) => i !== idx));
  };

  const saveCalculatorConfig = () => {
    updateCalcConfig({ pitchOptions: pitchList, sizePresets, screenProducts, costParams });
  };

  const addProduct = () => {
    setScreenProducts((list) => [
      ...list,
      {
        id: `product-${list.length + 1}`,
        label: 'Новый экран',
        location: 'indoor',
        pitch: 2.6,
        cabinetW: 0.5,
        cabinetH: 0.5,
        powerWPerM2: 700,
        pricePerM2: 6000,
        availableArea: 100,
      },
    ]);
  };

  const updateProductField = (idx: number, field: keyof ScreenProduct, value: string) => {
    setScreenProducts((list) =>
      list.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]: field === 'label' || field === 'id' ? value : field === 'location' ? (value as Location) : Number(value),
            }
          : item
      )
    );
  };

  const removeProduct = (idx: number) => {
    setScreenProducts((list) => list.filter((_, i) => i !== idx));
  };

  const updateCostField = (field: keyof CostParams, value: string) => {
    if (field === 'discountFactors') {
      const factors = value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => Number(v))
        .filter((v) => !Number.isNaN(v) && v > 0);
      setCostParams((c) => ({ ...c, discountFactors: factors.length ? factors : c.discountFactors }));
      return;
    }
    setCostParams((c) => ({ ...c, [field]: Number(value) }));
  };

  // Packages
  const { packages, upsert: upsertPackage, remove: removePackage, resetToDefault: resetPackages } = usePackages();
  const [pkgForm, setPkgForm] = useState<Package>(emptyPackage);
  const [pkgEditing, setPkgEditing] = useState<Package['id'] | null>(null);
  const pkgCanSubmit = useMemo(() => pkgForm.id.trim() && pkgForm.name.trim(), [pkgForm]);

  const submitPackage = (e: FormEvent) => {
    e.preventDefault();
    if (!pkgCanSubmit) return;
    upsertPackage(pkgForm);
    setPkgForm(emptyPackage);
    setPkgEditing(null);
  };

  // Categories
  const { categories, upsert: upsertCategory, remove: removeCategory, resetToDefault: resetCategories } = useCategories();
  const [catForm, setCatForm] = useState<Category>(emptyCategory);
  const [catEditing, setCatEditing] = useState<Category['id'] | null>(null);
  const catCanSubmit = useMemo(() => catForm.id.trim() && catForm.title.trim(), [catForm]);

  const submitCategory = (e: FormEvent) => {
    e.preventDefault();
    if (!catCanSubmit) return;
    upsertCategory(catForm);
    setCatForm(emptyCategory);
    setCatEditing(null);
  };

  // Contacts
  const { contacts, update: updateContacts, resetToDefault: resetContacts } = useContacts();
  const [contactsDraft, setContactsDraft] = useState(contacts);

  useEffect(() => {
    setContactsDraft(contacts);
  }, [contacts]);

  const submitContacts = (e: FormEvent) => {
    e.preventDefault();
    updateContacts(contactsDraft);
  };

  // Cases
  const { cases, addCase, updateCase, deleteCase, resetToDefault: resetCases } = useCases();
  const [caseForm, setCaseForm] = useState<CaseFormState>(emptyCaseForm);
  const [caseEditing, setCaseEditing] = useState<string | null>(null);
  const caseCanSubmit = useMemo(() => caseForm.slug.trim() && caseForm.title.trim(), [caseForm.slug, caseForm.title]);

  const submitCase = (e: FormEvent) => {
    e.preventDefault();
    if (!caseCanSubmit) return;
    const payload = {
      ...caseForm,
      services: caseForm.services.split(',').map((s) => s.trim()),
      images: [...caseForm.images, ...caseForm.imagesText.split(',').map((s) => s.trim()).filter(Boolean)],
    };
    if (caseEditing) {
      updateCase(caseEditing, payload);
    } else {
      addCase(payload);
    }
    setCaseForm(emptyCaseForm);
    setCaseEditing(null);
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

  return (
    <AdminLayout title="Контент" subtitle="Управление пакетами, категориями, контактами и кейсами">
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
          📊 Лента заявок
        </a>
      </div>

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
                  <button type="button" className="text-sm text-slate-300 hover:text-white" onClick={() => { setPkgForm(emptyPackage); setPkgEditing(null); }}>
                    Сбросить
                  </button>
                )}
              </div>
              <label className="text-sm text-slate-200">
                ID*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={pkgForm.id}
                  onChange={(e) => setPkgForm((f) => ({ ...f, id: e.target.value as Package['id'] }))}
                  required
                  disabled={!!pkgEditing}
                />
              </label>
              <label className="text-sm text-slate-200">
                Название*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="text-sm text-slate-200">
                Для форматов (через запятую или строки)
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={pkgForm.forFormats.join(', ')}
                  onChange={(e) => setPkgForm((f) => ({ ...f, forFormats: e.target.value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean) }))}
                  rows={2}
                />
              </label>
              <label className="text-sm text-slate-200">
                Включает (список)
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={pkgForm.includes.join('\n')}
                  onChange={(e) => setPkgForm((f) => ({ ...f, includes: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) }))}
                  rows={3}
                />
              </label>
              <label className="text-sm text-slate-200">
                Опции (опционально)
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={pkgForm.options?.join('\n') || ''}
                  onChange={(e) => setPkgForm((f) => ({ ...f, options: e.target.value ? e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) : [] }))}
                  rows={2}
                />
              </label>
              <label className="text-sm text-slate-200">
                Подсказка цены
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={pkgForm.priceHint || ''}
                  onChange={(e) => setPkgForm((f) => ({ ...f, priceHint: e.target.value }))}
                />
              </label>
              <button type="submit" disabled={!pkgCanSubmit} className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-50">
                {pkgEditing ? 'Сохранить' : 'Добавить'}
              </button>
            </form>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Список пакетов</div>
                <button type="button" className="text-sm text-slate-300 hover:text-white" onClick={resetPackages}>
                  Сброс к дефолту
                </button>
              </div>
              <div className="space-y-2 text-sm text-slate-200">
                {packages.map((p) => (
                  <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.id}</div>
                    </div>
                    <div className="text-xs text-slate-400">Для: {p.forFormats.join(', ')}</div>
                    <div className="mt-1 text-xs text-slate-300">{p.includes.join(' · ')}</div>
                    {p.options && p.options.length > 0 && <div className="text-xs text-slate-400">Опции: {p.options.join(', ')}</div>}
                    {p.priceHint && <div className="text-xs text-brand-100">{p.priceHint}</div>}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setPkgForm(p); setPkgEditing(p.id); }}
                        className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => removePackage(p.id)}
                        className="rounded-lg border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
                {packages.length === 0 && <div className="text-slate-400">Нет пакетов.</div>}
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
                  <button type="button" className="text-sm text-slate-300 hover:text-white" onClick={() => { setCatForm(emptyCategory); setCatEditing(null); }}>
                    Сбросить
                  </button>
                )}
              </div>
              <label className="text-sm text-slate-200">
                ID*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={catForm.id}
                  onChange={(e) => setCatForm((f) => ({ ...f, id: e.target.value as Category['id'] }))}
                  required
                  disabled={!!catEditing}
                />
              </label>
              <label className="text-sm text-slate-200">
                Заголовок*
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={catForm.title}
                  onChange={(e) => setCatForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </label>
              <label className="text-sm text-slate-200">
                Краткое описание
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={catForm.shortDescription}
                  onChange={(e) => setCatForm((f) => ({ ...f, shortDescription: e.target.value }))}
                  rows={2}
                />
              </label>
              <label className="text-sm text-slate-200">
                Буллеты (каждый с новой строки или через запятую)
                <textarea
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={catForm.bullets.join('\n')}
                  onChange={(e) => setCatForm((f) => ({ ...f, bullets: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) }))}
                  rows={3}
                />
              </label>
              <label className="text-sm text-slate-200">
                Путь страницы
                <input
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  value={catForm.pagePath}
                  onChange={(e) => setCatForm((f) => ({ ...f, pagePath: e.target.value }))}
                />
              </label>
              <button type="submit" disabled={!catCanSubmit} className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400 disabled:opacity-50">
                {catEditing ? 'Сохранить' : 'Добавить'}
              </button>
            </form>

            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Список категорий</div>
                <button type="button" className="text-sm text-slate-300 hover:text-white" onClick={resetCategories}>
                  Сброс к дефолту
                </button>
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
                      <button
                        type="button"
                        onClick={() => { setCatForm(c); setCatEditing(c.id); }}
                        className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-white/40"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCategory(c.id)}
                        className="rounded-lg border border-red-400/40 px-3 py-1 text-xs font-semibold text-red-200 hover:border-red-400"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
                {categories.length === 0 && <div className="text-slate-400">Нет категорий.</div>}
              </div>
            </div>
          </div>
      </div>
      )}

      {activeTab === 'contacts' && (
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Контакты</h2>
          <p className="mb-6 text-sm text-slate-400">Телефоны, email, адрес, время</p>
          <div className="grid gap-6 md:grid-cols-2">
            <form className="card space-y-3" onSubmit={submitContacts}>
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-white">Редактирование контактов</div>
              <button type="button" className="text-sm text-slate-300 hover:text-white" onClick={() => { setContactsDraft(baseContacts); resetContacts(); }}>
                Сброс к дефолту
              </button>
            </div>
            <label className="text-sm text-slate-200">
              Телефоны (каждый с новой строки)
              <textarea
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={contactsDraft.phones.join('\n')}
                onChange={(e) => setContactsDraft((f) => ({ ...f, phones: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) }))}
                rows={3}
              />
            </label>
            <label className="text-sm text-slate-200">
              Email (каждый с новой строки)
              <textarea
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={contactsDraft.emails.join('\n')}
                onChange={(e) => setContactsDraft((f) => ({ ...f, emails: e.target.value.split(/\n/).map((s) => s.trim()).filter(Boolean) }))}
                rows={2}
              />
            </label>
            <label className="text-sm text-slate-200">
              Адрес
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={contactsDraft.address}
                onChange={(e) => setContactsDraft((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <label className="text-sm text-slate-200">
              Время работы
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                value={contactsDraft.workingHours}
                onChange={(e) => setContactsDraft((f) => ({ ...f, workingHours: e.target.value }))}
              />
            </label>
            <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400">
              Сохранить контакты
            </button>
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-white">Модели экранов</div>
                <button
                  type="button"
                  onClick={addProduct}
                  className="rounded-lg border border-white/15 px-3 py-1 text-xs text-white hover:border-white/30"
                >
                  Добавить
                </button>
              </div>
              <div className="space-y-3">
                {screenProducts.map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <input
                        className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm"
                        value={p.label}
                        onChange={(e) => updateProductField(idx, 'label', e.target.value)}
                        placeholder="Название"
                      />
                      <select
                        className="rounded-md border border-white/10 bg-white/5 px-2 py-1"
                        value={p.location}
                        onChange={(e) => updateProductField(idx, 'location', e.target.value)}
                      >
                        <option value="indoor">Indoor</option>
                        <option value="outdoor">Outdoor</option>
                      </select>
                      <button type="button" onClick={() => removeProduct(idx)} className="text-red-300 hover:text-red-200">✕</button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
                      <label>
                        Pitch (мм)
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.pitch}
                          onChange={(e) => updateProductField(idx, 'pitch', e.target.value)}
                        />
                      </label>
                      <label>
                        Каб. ширина
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.cabinetW}
                          onChange={(e) => updateProductField(idx, 'cabinetW', e.target.value)}
                        />
                      </label>
                      <label>
                        Каб. высота
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.cabinetH}
                          onChange={(e) => updateProductField(idx, 'cabinetH', e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
                      <label>
                        Мощн. Вт/м²
                        <input
                          type="number"
                          step="10"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.powerWPerM2}
                          onChange={(e) => updateProductField(idx, 'powerWPerM2', e.target.value)}
                        />
                      </label>
                      <label>
                        Цена ₽/м²
                        <input
                          type="number"
                          step="100"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.pricePerM2}
                          onChange={(e) => updateProductField(idx, 'pricePerM2', e.target.value)}
                        />
                      </label>
                      <label>
                        Доступно м²
                        <input
                          type="number"
                          step="1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.availableArea ?? ''}
                          onChange={(e) => updateProductField(idx, 'availableArea', e.target.value)}
                          placeholder="не ограничено"
                        />
                      </label>
                    </div>
                  </div>
                ))}
                {screenProducts.length === 0 && <div className="text-sm text-slate-400">Нет моделей. Добавьте.</div>}
              </div>
            </div>

            <div className="card space-y-3">
              <div className="text-lg font-semibold text-white">Стоимость и скидки</div>
              <div className="grid gap-3 text-sm text-slate-300">
                <label className="flex items-center gap-3">
                  <span className="w-40 text-slate-400">Сборка ₽/м²</span>
                  <input
                    type="number"
                    step="100"
                    className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1"
                    value={costParams.assemblyCostPerM2}
                    onChange={(e) => updateCostField('assemblyCostPerM2', e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-3">
                  <span className="w-40 text-slate-400">Техник ₽/день</span>
                  <input
                    type="number"
                    step="500"
                    className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1"
                    value={costParams.technicianPerDay}
                    onChange={(e) => updateCostField('technicianPerDay', e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-3">
                  <span className="w-40 text-slate-400">Инженер ₽/день</span>
                  <input
                    type="number"
                    step="500"
                    className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1"
                    value={costParams.engineerPerDay}
                    onChange={(e) => updateCostField('engineerPerDay', e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-3">
                  <span className="w-40 text-slate-400">Скидки по дням</span>
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1"
                    value={costParams.discountFactors.join(', ')}
                    onChange={(e) => updateCostField('discountFactors', e.target.value)}
                    placeholder="1, 0.5, 0.4, 0.3"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'calculator' && (
        <div className="rounded-xl border border-white/10 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Калькулятор</h2>
          <p className="mb-6 text-sm text-slate-400">Настройки шагов пикселя и типовых размеров</p>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addPitch}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:border-white/30"
            >
              Добавить шаг пикселя
            </button>
            <button
              type="button"
              onClick={addSizePreset}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:border-white/30"
            >
              Добавить размер
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={resetCalcConfig}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 hover:text-white"
            >
              Сбросить к дефолту
            </button>
            <button
              type="button"
              onClick={saveCalculatorConfig}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-400"
            >
              Сохранить
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card space-y-3">
              <div className="text-lg font-semibold text-white">Шаги пикселя</div>
              <div className="space-y-3">
                {pitchList.map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm"
                        value={p.label}
                        onChange={(e) => updatePitchField(idx, 'label', e.target.value)}
                        placeholder="Label"
                      />
                      <button type="button" onClick={() => removePitch(idx)} className="text-xs text-red-300 hover:text-red-200">Удалить</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="text-slate-300">
                        Значение (мм)
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.value}
                          onChange={(e) => updatePitchField(idx, 'value', e.target.value)}
                        />
                      </label>
                      <label className="text-slate-300">
                        Min дистанция
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.minDistance}
                          onChange={(e) => updatePitchField(idx, 'minDistance', e.target.value)}
                        />
                      </label>
                      <label className="text-slate-300">
                        Max дистанция
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.maxDistance === Infinity ? '' : p.maxDistance}
                          onChange={(e) => updatePitchField(idx, 'maxDistance', e.target.value || `${Infinity}`)}
                          placeholder="∞"
                        />
                      </label>
                      <label className="text-slate-300">
                        М² на складе
                        <input
                          type="number"
                          step="1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.stockArea ?? ''}
                          onChange={(e) => updatePitchField(idx, 'stockArea', e.target.value)}
                          placeholder="0"
                        />
                      </label>
                      <label className="text-slate-300 col-span-2">
                        Описание
                        <input
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={p.description}
                          onChange={(e) => updatePitchField(idx, 'description', e.target.value)}
                          placeholder="Подсказка пользователю"
                        />
                      </label>
                    </div>
                  </div>
                ))}
                {pitchList.length === 0 && <div className="text-sm text-slate-400">Пусто. Добавьте шаг.</div>}
              </div>
            </div>

            <div className="card space-y-3">
              <div className="text-lg font-semibold text-white">Типовые размеры</div>
              <div className="space-y-3">
                {sizePresets.map((s, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm"
                        value={s.label}
                        onChange={(e) => updateSizeField(idx, 'label', e.target.value)}
                        placeholder="Label"
                      />
                      <button type="button" onClick={() => removeSize(idx)} className="text-xs text-red-300 hover:text-red-200">Удалить</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <label className="text-slate-300">
                        Ширина (м)
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={s.width}
                          onChange={(e) => updateSizeField(idx, 'width', e.target.value)}
                        />
                      </label>
                      <label className="text-slate-300">
                        Высота (м)
                        <input
                          type="number"
                          step="0.1"
                          className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-1"
                          value={s.height}
                          onChange={(e) => updateSizeField(idx, 'height', e.target.value)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
                {sizePresets.length === 0 && <div className="text-sm text-slate-400">Пусто. Добавьте размер.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default AdminContentPage;
