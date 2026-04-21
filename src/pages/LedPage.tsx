import { Helmet } from 'react-helmet-async';
import EditableList from '../components/admin/EditableList';
import { RequestForm } from '../components/RequestForm';
import Section from '../components/Section';
import { useI18n } from '../context/I18nContext';
import { useEditableBinding } from '../hooks/useEditableBinding';
import { usePageLed } from '../hooks/usePageLed';
import type { PageLedSelectionCard } from '../lib/content/pageLed';

interface LedSelectionCardProps {
  card: PageLedSelectionCard;
  index: number;
  onSaveCard: (next: PageLedSelectionCard) => Promise<void>;
}

const LedSelectionCard = ({ card, index, onSaveCard }: LedSelectionCardProps) => {
  const captionEdit = useEditableBinding({
    value: card.caption,
    onSave: (next) => onSaveCard({ ...card, caption: next }),
    label: `Selection card ${index + 1} — caption`,
  });
  const titleEdit = useEditableBinding({
    value: card.title,
    onSave: (next) => onSaveCard({ ...card, title: next }),
    label: `Selection card ${index + 1} — title`,
  });
  const descEdit = useEditableBinding({
    value: card.description,
    onSave: (next) => onSaveCard({ ...card, description: next }),
    label: `Selection card ${index + 1} — description`,
    kind: 'multiline',
  });
  return (
    <div className="card">
      <div className="text-sm text-slate-400">
        <span {...captionEdit.bindProps}>{captionEdit.value}</span>
      </div>
      <div className="text-lg font-semibold text-white">
        <span {...titleEdit.bindProps}>{titleEdit.value}</span>
      </div>
      <p className="text-sm text-slate-300">
        <span {...descEdit.bindProps}>{descEdit.value}</span>
      </p>
    </div>
  );
};

const LedPage = () => {
  const { siteLocale } = useI18n();
  const { data, save } = usePageLed(siteLocale, true);

  const savePatch = async (patch: Partial<typeof data>) => {
    const ok = await save({ ...data, ...patch });
    if (!ok) throw new Error('Failed to save LED content');
  };

  const heroTitleEdit = useEditableBinding({
    value: data.hero.title,
    onSave: (next) => savePatch({ hero: { ...data.hero, title: next } }),
    label: 'LED — hero title',
  });
  const heroSubtitleEdit = useEditableBinding({
    value: data.hero.subtitle,
    onSave: (next) => savePatch({ hero: { ...data.hero, subtitle: next } }),
    label: 'LED — hero subtitle',
  });
  const benefitsTitleEdit = useEditableBinding({
    value: data.benefitsTitle,
    onSave: (next) => savePatch({ benefitsTitle: next }),
    label: 'LED — benefits title',
  });
  const configsTitleEdit = useEditableBinding({
    value: data.configsTitle,
    onSave: (next) => savePatch({ configsTitle: next }),
    label: 'LED — configs title',
  });
  const selectionTitleEdit = useEditableBinding({
    value: data.selection.title,
    onSave: (next) => savePatch({ selection: { ...data.selection, title: next } }),
    label: 'LED — selection title',
  });
  const selectionSubtitleEdit = useEditableBinding({
    value: data.selection.subtitle,
    onSave: (next) => savePatch({ selection: { ...data.selection, subtitle: next } }),
    label: 'LED — selection subtitle',
  });
  const faqTitleEdit = useEditableBinding({
    value: data.faqTitle,
    onSave: (next) => savePatch({ faqTitle: next }),
    label: 'LED — FAQ title',
  });
  const includedTitleEdit = useEditableBinding({
    value: data.included.title,
    onSave: (next) => savePatch({ included: { ...data.included, title: next } }),
    label: 'LED — included title',
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
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3">
            <div className="text-lg font-semibold text-white">
              <span {...benefitsTitleEdit.bindProps}>{benefitsTitleEdit.value}</span>
            </div>
            <EditableList
              items={data.benefits}
              onSave={(next) => savePatch({ benefits: next })}
              label="LED — benefits"
              placeholder="One benefit per line"
            >
              <ul className="space-y-2 text-sm text-slate-200">
                {data.benefits.map((item, i) => (
                  <li key={`${i}-${item.slice(0, 16)}`} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </EditableList>
          </div>

          <div className="card space-y-3">
            <div className="text-lg font-semibold text-white">
              <span {...configsTitleEdit.bindProps}>{configsTitleEdit.value}</span>
            </div>
            <EditableList
              items={data.configs}
              onSave={(next) => savePatch({ configs: next })}
              label="LED — configs"
              placeholder="One configuration per line"
            >
              <ul className="space-y-2 text-sm text-slate-200">
                {data.configs.map((item, i) => (
                  <li key={`${i}-${item.slice(0, 16)}`} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </EditableList>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            <span {...selectionTitleEdit.bindProps}>{selectionTitleEdit.value}</span>
          </h2>
          <p className="text-slate-300 md:text-lg">
            <span {...selectionSubtitleEdit.bindProps}>{selectionSubtitleEdit.value}</span>
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {data.selection.cards.map((card, i) => (
            <LedSelectionCard
              key={`${i}-${card.title.slice(0, 16)}`}
              card={card}
              index={i}
              onSaveCard={async (next) => {
                const cards = [...data.selection.cards];
                cards[i] = next;
                await savePatch({ selection: { ...data.selection, cards } });
              }}
            />
          ))}
        </div>
      </Section>

      <Section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            <span {...faqTitleEdit.bindProps}>{faqTitleEdit.value}</span>
          </h2>
        </div>
        <EditableList
          items={data.faq}
          onSave={(next) => savePatch({ faq: next })}
          label="LED — FAQ items"
          placeholder="One Q/A per line"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {data.faq.map((item, i) => (
              <div key={`${i}-${item.slice(0, 16)}`} className="card text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </EditableList>
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <div className="text-lg font-semibold text-white">
              <span {...includedTitleEdit.bindProps}>{includedTitleEdit.value}</span>
            </div>
            <EditableList
              items={data.included.items}
              onSave={(next) => savePatch({ included: { ...data.included, items: next } })}
              label="LED — included items"
              placeholder="One item per line"
            >
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {data.included.items.map((item, i) => (
                  <li key={`${i}-${item.slice(0, 16)}`} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </EditableList>
          </div>

          <RequestForm
            title={data.form.title}
            subtitle={data.form.subtitle}
            ctaText={data.form.ctaText}
          />
        </div>
      </Section>
    </div>
  );
};

export default LedPage;
