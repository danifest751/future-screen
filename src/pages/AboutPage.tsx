import { Helmet } from 'react-helmet-async';
import EditableList from '../components/admin/EditableList';
import Section from '../components/Section';
import { useOptionalEditMode } from '../context/EditModeContext';
import { useI18n } from '../context/I18nContext';
import { useEditableBinding } from '../hooks/useEditableBinding';
import { usePageAbout } from '../hooks/usePageAbout';

const AboutPage = () => {
  const { siteLocale } = useI18n();
  const { isEditing } = useOptionalEditMode();
  const { data, save } = usePageAbout(siteLocale, true);
  const { seo, section, paragraphs, factsTitle, facts } = data;

  const savePatch = async (patch: Partial<typeof data>) => {
    const ok = await save({ ...data, ...patch });
    if (!ok) throw new Error('Failed to save About content');
  };

  const sectionTitleEdit = useEditableBinding({
    value: section.title,
    onSave: (next) => savePatch({ section: { ...section, title: next } }),
    label: 'About — section title',
  });
  const sectionSubtitleEdit = useEditableBinding({
    value: section.subtitle,
    onSave: (next) => savePatch({ section: { ...section, subtitle: next } }),
    label: 'About — section subtitle',
  });
  const factsTitleEdit = useEditableBinding({
    value: factsTitle,
    onSave: (next) => savePatch({ factsTitle: next }),
    label: 'About — facts title',
  });

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
      </Helmet>
      <Section>
        <div className="mb-6 space-y-2">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            <span {...sectionTitleEdit.bindProps}>{sectionTitleEdit.value}</span>
          </h2>
          <p className="text-slate-300 md:text-lg">
            <span {...sectionSubtitleEdit.bindProps}>{sectionSubtitleEdit.value}</span>
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card space-y-3 text-sm text-slate-200">
            <EditableList
              items={paragraphs}
              onSave={(next) => savePatch({ paragraphs: next })}
              label="About — paragraphs"
              placeholder="Paragraph text"
            >
              <>
                {paragraphs.map((paragraph, i) => (
                  <p key={`${i}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
                ))}
              </>
            </EditableList>
          </div>
          <div className="card space-y-2 text-sm text-slate-200">
            <div className="text-lg font-semibold text-white">
              <span {...factsTitleEdit.bindProps}>{factsTitleEdit.value}</span>
            </div>
            <EditableList
              items={facts}
              onSave={(next) => savePatch({ facts: next })}
              label="About — facts"
              placeholder="Fact text"
            >
              <ul className="space-y-2">
                {facts.map((fact, i) => (
                  <li key={`${i}-${fact.slice(0, 16)}`} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-400"></span>
                    {isEditing ? <span>{fact}</span> : fact}
                  </li>
                ))}
              </ul>
            </EditableList>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default AboutPage;
