import type { ComponentPropsWithoutRef } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import EditableList from '../components/admin/EditableList';
import Section from '../components/Section';
import { RequestForm } from '../components/RequestForm';
import { useOptionalEditMode } from '../context/EditModeContext';
import { useI18n } from '../context/I18nContext';
import { useEditableBinding } from '../hooks/useEditableBinding';
import { usePageRent } from '../hooks/usePageRent';
import {
  type RentalCategory,
  upsertRentalCategory,
  useRentalCategories,
} from '../services/rentalCategories';
import type { Locale } from '../i18n/types';

interface RentalCardProps {
  cat: RentalCategory;
  locale: Locale;
  onSaved: () => void;
}

const RentalCard = ({ cat, locale, onSaved }: RentalCardProps) => {
  const { isEditing } = useOptionalEditMode();

  const saveField = (field: 'name' | 'shortName') => async (next: string) => {
    await upsertRentalCategory({ ...cat, [field]: next }, locale);
    onSaved();
  };

  const nameEdit = useEditableBinding({
    value: cat.name,
    onSave: saveField('name'),
    label: 'Rental category name',
  });
  const shortNameEdit = useEditableBinding({
    value: cat.shortName,
    onSave: saveField('shortName'),
    label: 'Rental category short name',
  });

  const wrapperClass = 'card block hover:border-brand-500/40';
  const wrapperProps: ComponentPropsWithoutRef<typeof Link> | ComponentPropsWithoutRef<'div'> = isEditing
    ? { className: wrapperClass }
    : { className: wrapperClass, to: `/rent/${cat.slug}` };
  const Wrapper = (isEditing ? 'div' : Link) as typeof Link;

  return (
    <Wrapper {...(wrapperProps as ComponentPropsWithoutRef<typeof Link>)}>
      <div className="text-xl font-semibold text-white">
        <span {...nameEdit.bindProps}>{nameEdit.value}</span>
      </div>
      <p className="text-sm text-slate-300">
        <span {...shortNameEdit.bindProps}>{shortNameEdit.value}</span>
      </p>
    </Wrapper>
  );
};

const RentPage = () => {
  const { siteLocale } = useI18n();
  const { items, loading, error, reload } = useRentalCategories(siteLocale, false);
  const { data, save } = usePageRent(siteLocale, true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const savePatch = async (patch: Partial<typeof data>) => {
    const ok = await save({ ...data, ...patch });
    if (!ok) throw new Error('Failed to save Rent content');
  };

  const heroTitleEdit = useEditableBinding({
    value: data.hero.title,
    onSave: (next) => savePatch({ hero: { ...data.hero, title: next } }),
    label: 'Rent — hero title',
  });
  const heroSubtitleEdit = useEditableBinding({
    value: data.hero.subtitle,
    onSave: (next) => savePatch({ hero: { ...data.hero, subtitle: next } }),
    label: 'Rent — hero subtitle',
  });
  const checklistTitleEdit = useEditableBinding({
    value: data.checklist.title,
    onSave: (next) => savePatch({ checklist: { ...data.checklist, title: next } }),
    label: 'Rent — checklist title',
  });

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{data.seo.title}</title>
        <meta name="description" content={data.seo.description} />
      </Helmet>
      <Section>
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            <span {...heroTitleEdit.bindProps}>{heroTitleEdit.value}</span>
          </h2>
          <p className="text-slate-300 md:text-lg">
            <span {...heroSubtitleEdit.bindProps}>{heroSubtitleEdit.value}</span>
          </p>
        </div>
        {loading && (
          <div className="col-span-3 text-center text-slate-400">{data.hero.loading}</div>
        )}
        {error && (
          <div className="col-span-3 text-center text-red-400">{data.hero.error}</div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((cat) => (
              <RentalCard
                key={cat.id}
                cat={cat}
                locale={siteLocale}
                onSaved={() => void reload()}
              />
            ))}
          </div>
        )}
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <div className="text-lg font-semibold text-white">
              <span {...checklistTitleEdit.bindProps}>{checklistTitleEdit.value}</span>
            </div>
            <EditableList
              items={data.checklist.items}
              onSave={(next) => savePatch({ checklist: { ...data.checklist, items: next } })}
              label="Rent — checklist items"
              placeholder="One item per line"
            >
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {data.checklist.items.map((item, i) => (
                  <li key={`${i}-${item.slice(0, 16)}`} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </EditableList>
          </div>
          <RequestForm title={data.form.title} subtitle={data.form.subtitle} ctaText={data.form.ctaText} />
        </div>
      </Section>
    </div>
  );
};

export default RentPage;
