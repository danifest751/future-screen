import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { trackEvent } from '../lib/analytics';
import { useI18n } from '../context/I18nContext';
import { getHomePageContent } from '../content/pages/home';
import { useHomeEquipmentSection } from '../hooks/useHomeEquipmentSection';
import { useHomeHero } from '../hooks/useHomeHero';
import { useHomeWorks } from '../hooks/useHomeWorks';
import { useHomeEventTypes } from '../hooks/useHomeEventTypes';
import { useHomeProcess } from '../hooks/useHomeProcess';
import { useHomeCta } from '../hooks/useHomeCta';
import { useEditableBinding } from '../hooks/useEditableBinding';
import type { HomeEquipmentSectionContent } from '../lib/content/homeEquipmentSection';
import type { HomeHeroContent } from '../lib/content/homeHero';
import type { HomeWorksContent, HomeWorksItem } from '../lib/content/homeWorks';
import type { HomeEventTypesContent } from '../lib/content/homeEventTypes';
import type { HomeProcessContent } from '../lib/content/homeProcess';
import type { HomeCtaContent } from '../lib/content/homeCta';
import { getOptimizedBackgroundImage } from '../lib/optimizedImages';
import { RevealSection } from './home/RevealSection';
import { WorksSlider } from './home/WorksSection';
import { EventsSlider, type EventItem } from './home/EventsSection';
import { CtaForm } from './home/CtaForm';
import { HeroStatCard } from './home/HeroStatCard';
import { ProcessStepCard } from './home/ProcessStepCard';
import { EquipmentCard, EquipmentExtraCard } from './home/EquipmentCard';

type HomeEquipmentItem = HomeEquipmentSectionContent['items'][number];
type HomeEquipmentExtraItem = HomeEquipmentSectionContent['extraItems'][number];

const HomePage = () => {
  const { siteLocale } = useI18n();
  const homePageContent = getHomePageContent(siteLocale);
  const { data: equipmentSectionOverride, save: saveEquipmentSection } =
    useHomeEquipmentSection(siteLocale, true);
  const { data: hero, save: saveHero } = useHomeHero(siteLocale, true);
  const { data: works, save: saveWorks } = useHomeWorks(siteLocale, true);
  const { data: eventTypesSection, save: saveEventTypes } = useHomeEventTypes(siteLocale, true);
  const { data: processSection, save: saveProcess } = useHomeProcess(siteLocale, true);
  const { data: ctaSection, save: saveCta } = useHomeCta(siteLocale, true);
  const { seo, equipmentSection } = homePageContent;
  const effectiveEquipmentSection = equipmentSectionOverride ?? equipmentSection;
  const equipment = effectiveEquipmentSection.items;
  const extraEquipment = effectiveEquipmentSection.extraItems;

  // Inline-edit bindings for the Equipment section header (admin-only in
  // edit mode; inert for everyone else).
  const makeEqFieldSaver = (field: keyof HomeEquipmentSectionContent) => async (next: string) => {
    const base = equipmentSectionOverride ?? effectiveEquipmentSection;
    const ok = await saveEquipmentSection({ ...base, [field]: next });
    if (!ok) throw new Error('Failed to save equipment section');
  };

  const eqBadgeEdit = useEditableBinding({
    value: effectiveEquipmentSection.badge,
    onSave: makeEqFieldSaver('badge'),
    label: 'Equipment section — badge',
  });
  const eqTitleEdit = useEditableBinding({
    value: effectiveEquipmentSection.title,
    onSave: makeEqFieldSaver('title'),
    label: 'Equipment section — title',
  });
  const eqAccentTitleEdit = useEditableBinding({
    value: effectiveEquipmentSection.accentTitle,
    onSave: makeEqFieldSaver('accentTitle'),
    label: 'Equipment section — accent title',
  });
  const eqSubtitleEdit = useEditableBinding({
    value: effectiveEquipmentSection.subtitle,
    onSave: makeEqFieldSaver('subtitle'),
    label: 'Equipment section — subtitle',
    kind: 'multiline',
  });

  // Hero (migrated from bundled content to site_content.home_hero in Phase 5a).
  const saveHeroField = async (patch: Partial<HomeHeroContent>) => {
    const ok = await saveHero({ ...hero, ...patch });
    if (!ok) throw new Error('Failed to save hero');
  };
  const heroBadgeEdit = useEditableBinding({
    value: hero.badge,
    onSave: (next) => saveHeroField({ badge: next }),
    label: 'Home hero — badge',
  });
  const heroLine0Edit = useEditableBinding({
    value: hero.titleLines[0] ?? '',
    onSave: (next) =>
      saveHeroField({ titleLines: [next, hero.titleLines[1] ?? '', hero.titleLines[2] ?? ''] }),
    label: 'Home hero — title line 1',
  });
  const heroLine1Edit = useEditableBinding({
    value: hero.titleLines[1] ?? '',
    onSave: (next) =>
      saveHeroField({ titleLines: [hero.titleLines[0] ?? '', next, hero.titleLines[2] ?? ''] }),
    label: 'Home hero — title line 2 (accent)',
  });
  const heroLine2Edit = useEditableBinding({
    value: hero.titleLines[2] ?? '',
    onSave: (next) =>
      saveHeroField({ titleLines: [hero.titleLines[0] ?? '', hero.titleLines[1] ?? '', next] }),
    label: 'Home hero — title line 3',
  });
  const heroSubtitleEdit = useEditableBinding({
    value: hero.subtitle,
    onSave: (next) => saveHeroField({ subtitle: next }),
    label: 'Home hero — subtitle',
    kind: 'multiline',
  });
  const heroPrimaryCtaEdit = useEditableBinding({
    value: hero.primaryCta,
    onSave: (next) => saveHeroField({ primaryCta: next }),
    label: 'Home hero — primary CTA',
  });
  const heroSecondaryCtaEdit = useEditableBinding({
    value: hero.secondaryCta,
    onSave: (next) => saveHeroField({ secondaryCta: next }),
    label: 'Home hero — secondary CTA',
  });

  // Works section (migrated in Phase 5b).
  const saveWorksField = async (patch: Partial<HomeWorksContent>) => {
    const ok = await saveWorks({ ...works, ...patch });
    if (!ok) throw new Error('Failed to save works section');
  };
  const worksBadgeEdit = useEditableBinding({
    value: works.badge,
    onSave: (next) => saveWorksField({ badge: next }),
    label: 'Works — badge',
  });
  const worksTitleEdit = useEditableBinding({
    value: works.title,
    onSave: (next) => saveWorksField({ title: next }),
    label: 'Works — title',
  });
  const worksAccentTitleEdit = useEditableBinding({
    value: works.accentTitle,
    onSave: (next) => saveWorksField({ accentTitle: next }),
    label: 'Works — accent title',
  });
  const worksAllCasesLinkEdit = useEditableBinding({
    value: works.allCasesLink,
    onSave: (next) => saveWorksField({ allCasesLink: next }),
    label: 'Works — all cases link',
  });

  // Event types section.
  const saveEventTypesField = async (patch: Partial<HomeEventTypesContent>) => {
    const ok = await saveEventTypes({ ...eventTypesSection, ...patch });
    if (!ok) throw new Error('Failed to save event types section');
  };
  const eventTypesBadgeEdit = useEditableBinding({
    value: eventTypesSection.badge,
    onSave: (next) => saveEventTypesField({ badge: next }),
    label: 'Event types — badge',
  });
  const eventTypesTitleEdit = useEditableBinding({
    value: eventTypesSection.title,
    onSave: (next) => saveEventTypesField({ title: next }),
    label: 'Event types — title',
  });
  const eventTypesAccentTitleEdit = useEditableBinding({
    value: eventTypesSection.accentTitle,
    onSave: (next) => saveEventTypesField({ accentTitle: next }),
    label: 'Event types — accent title',
  });

  // Process section.
  const saveProcessField = async (patch: Partial<HomeProcessContent>) => {
    const ok = await saveProcess({ ...processSection, ...patch });
    if (!ok) throw new Error('Failed to save process section');
  };
  const processBadgeEdit = useEditableBinding({
    value: processSection.badge,
    onSave: (next) => saveProcessField({ badge: next }),
    label: 'Process — badge',
  });
  const processTitleEdit = useEditableBinding({
    value: processSection.title,
    onSave: (next) => saveProcessField({ title: next }),
    label: 'Process — title',
  });
  const processAccentTitleEdit = useEditableBinding({
    value: processSection.accentTitle,
    onSave: (next) => saveProcessField({ accentTitle: next }),
    label: 'Process — accent title',
  });

  // CTA section.
  const saveCtaField = async (patch: Partial<HomeCtaContent>) => {
    const ok = await saveCta({ ...ctaSection, ...patch });
    if (!ok) throw new Error('Failed to save CTA section');
  };
  const ctaTitleEdit = useEditableBinding({
    value: ctaSection.title,
    onSave: (next) => saveCtaField({ title: next }),
    label: 'CTA — title',
  });
  const ctaAccentTitleEdit = useEditableBinding({
    value: ctaSection.accentTitle,
    onSave: (next) => saveCtaField({ accentTitle: next }),
    label: 'CTA — accent title',
  });
  const ctaSubtitleEdit = useEditableBinding({
    value: ctaSection.subtitle,
    onSave: (next) => saveCtaField({ subtitle: next }),
    label: 'CTA — subtitle',
    kind: 'multiline',
  });

  const eventTypes = eventTypesSection.items;
  const processSteps = processSection.steps;
  const worksItems = works.items;

  // Equipment items (big cards) — save by index back to the full section.
  const saveEquipmentItem = async (index: number, next: HomeEquipmentItem) => {
    const base = equipmentSectionOverride ?? effectiveEquipmentSection;
    const nextItems = [...base.items];
    nextItems[index] = next;
    const ok = await saveEquipmentSection({ ...base, items: nextItems });
    if (!ok) throw new Error('Failed to save equipment item');
  };

  // Extra equipment items (small bottom-row cards) — same pattern.
  const saveEquipmentExtraItem = async (index: number, next: HomeEquipmentExtraItem) => {
    const base = equipmentSectionOverride ?? effectiveEquipmentSection;
    const nextItems = [...base.extraItems];
    nextItems[index] = next;
    const ok = await saveEquipmentSection({ ...base, extraItems: nextItems });
    if (!ok) throw new Error('Failed to save extra equipment item');
  };

  // Works slider items — replace entire array.
  const replaceWorksItems = async (next: HomeWorksItem[]) => {
    const ok = await saveWorks({ ...works, items: next });
    if (!ok) throw new Error('Failed to save works items');
  };

  // Event type items — replace entire array. Cast back to HomeEventTypeItem
  // (slider uses narrower iconKey union).
  const replaceEventTypeItems = async (next: EventItem[]) => {
    const ok = await saveEventTypes({
      ...eventTypesSection,
      items: next as HomeEventTypesContent['items'],
    });
    if (!ok) throw new Error('Failed to save event type items');
  };

  return (
    <div>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        <meta name="keywords" content={seo.keywords} />
      </Helmet>

      {/* Hero */}
      <section
        className="relative flex h-screen items-center justify-center overflow-hidden -mt-16 lg:-mt-20"
        style={{
          backgroundImage: getOptimizedBackgroundImage('/images/hero-led-wall-2.png'),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay and gradient fade to site background */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

        <div className="container-page relative z-10 text-center pt-16 lg:pt-20">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-gray-200 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span {...heroBadgeEdit.bindProps}>{heroBadgeEdit.value}</span>
          </div>

          {/* Title */}
          <h1 className="font-display mb-6 text-balance text-5xl font-bold leading-tight text-white drop-shadow-lg md:text-7xl lg:text-8xl">
            <span {...heroLine0Edit.bindProps}>{heroLine0Edit.value}</span>
            <br />
            <span className="gradient-text" {...heroLine1Edit.bindProps}>
              {heroLine1Edit.value}
            </span>
            <br />
            <span {...heroLine2Edit.bindProps}>{heroLine2Edit.value}</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-gray-200 md:text-xl">
            <span {...heroSubtitleEdit.bindProps}>{heroSubtitleEdit.value}</span>
          </p>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#contacts"
              onClick={(e) => { e.preventDefault(); document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' }); trackEvent('click_cta_hero'); }}
              className="btn-primary text-base"
            >
              <span {...heroPrimaryCtaEdit.bindProps}>{heroPrimaryCtaEdit.value}</span>
            </a>
            <Link to="/cases" className="btn-secondary text-base">
              <span {...heroSecondaryCtaEdit.bindProps}>{heroSecondaryCtaEdit.value}</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
            {hero.stats.map((stat, i) => (
              <HeroStatCard
                key={`${stat.label}-${i}`}
                stat={stat}
                index={i}
                onSaveStat={async (nextStat) => {
                  const nextStats = [...hero.stats];
                  nextStats[i] = nextStat;
                  await saveHeroField({ stats: nextStats });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Our work */}
      <section className="py-24 md:py-32 bg-[#0a0a0a]">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                  <span {...worksBadgeEdit.bindProps}>{worksBadgeEdit.value}</span>
                </div>
                <h2 className="font-display text-balance text-4xl font-bold text-white md:text-5xl">
                  <span {...worksTitleEdit.bindProps}>{worksTitleEdit.value}</span>{' '}
                  <span className="gradient-text" {...worksAccentTitleEdit.bindProps}>
                    {worksAccentTitleEdit.value}
                  </span>
                </h2>
              </div>
              <Link to="/cases" className="text-brand-400 hover:text-brand-300 transition-colors text-sm font-medium whitespace-nowrap">
                <span {...worksAllCasesLinkEdit.bindProps}>{worksAllCasesLinkEdit.value}</span>
              </Link>
            </div>
          </RevealSection>

          <RevealSection>
            <WorksSlider
              items={worksItems}
              prevLabel={works.prevLabel}
              nextLabel={works.nextLabel}
              onReplaceItems={replaceWorksItems}
            />
          </RevealSection>
        </div>
      </section>

      {/* Equipment */}
      <section id="equipment" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                <span {...eqBadgeEdit.bindProps}>{eqBadgeEdit.value}</span>
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                <span {...eqTitleEdit.bindProps}>{eqTitleEdit.value}</span>{' '}
                <span className="gradient-text" {...eqAccentTitleEdit.bindProps}>
                  {eqAccentTitleEdit.value}
                </span>
              </h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                <span {...eqSubtitleEdit.bindProps}>{eqSubtitleEdit.value}</span>
              </p>
            </div>
          </RevealSection>

          <RevealSection className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item, i) => (
              <EquipmentCard
                key={`${i}-${item.title}`}
                item={item}
                index={i}
                onSaveItem={(next) => saveEquipmentItem(i, next)}
              />
            ))}
          </RevealSection>

          <RevealSection className="mt-5 grid gap-5 sm:grid-cols-3">
            {extraEquipment.map((item, i) => (
              <EquipmentExtraCard
                key={`${i}-${item.title}`}
                item={item}
                index={i}
                onSaveItem={(next) => saveEquipmentExtraItem(i, next)}
              />
            ))}
          </RevealSection>
        </div>
      </section>

      {/* Event types */}
      <section id="services" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                <span {...eventTypesBadgeEdit.bindProps}>{eventTypesBadgeEdit.value}</span>
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                <span {...eventTypesTitleEdit.bindProps}>{eventTypesTitleEdit.value}</span>{' '}
                <span className="gradient-text" {...eventTypesAccentTitleEdit.bindProps}>
                  {eventTypesAccentTitleEdit.value}
                </span>
              </h2>
            </div>
          </RevealSection>

          <RevealSection>
            <EventsSlider
              items={eventTypes as readonly EventItem[]}
              prevLabel={eventTypesSection.prevLabel}
              nextLabel={eventTypesSection.nextLabel}
              onReplaceItems={replaceEventTypeItems}
            />
          </RevealSection>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-400">
                <span {...processBadgeEdit.bindProps}>{processBadgeEdit.value}</span>
              </div>
              <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                <span {...processTitleEdit.bindProps}>{processTitleEdit.value}</span>{' '}
                <span className="gradient-text" {...processAccentTitleEdit.bindProps}>
                  {processAccentTitleEdit.value}
                </span>
              </h2>
            </div>
          </RevealSection>

          <RevealSection className="relative grid gap-6 md:grid-cols-4">
            <div
              className="absolute left-0 right-0 top-10 hidden h-px md:block"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(102,126,234,0.4), transparent)' }}
            />
            {processSteps.map((step, i) => (
              <ProcessStepCard
                key={`${step.num}-${i}`}
                step={step}
                index={i}
                onSaveStep={async (next) => {
                  const steps = [...processSection.steps];
                  steps[i] = next;
                  await saveProcessField({ steps });
                }}
              />
            ))}
          </RevealSection>
        </div>
      </section>

      {/* CTA */}
      <section id="contacts" className="py-24 md:py-32">
        <div className="container-page">
          <RevealSection>
            <div className="relative overflow-hidden rounded-3xl p-10 text-center md:p-16">
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.25) 0%, rgba(118,75,162,0.25) 100%)' }}
              />
              <div className="absolute inset-0" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'inherit' }} />
              <div
                className="animate-pulse-slow absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
                style={{ background: 'radial-gradient(circle, rgba(102,126,234,0.6) 0%, transparent 70%)', filter: 'blur(60px)' }}
              />
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                  borderRadius: 'inherit',
                }}
              />
              <div className="relative z-10">
                <h2 className="font-display mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
                  <span {...ctaTitleEdit.bindProps}>{ctaTitleEdit.value}</span>{' '}
                  <span className="gradient-text" {...ctaAccentTitleEdit.bindProps}>
                    {ctaAccentTitleEdit.value}
                  </span>
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-gray-400">
                  <span {...ctaSubtitleEdit.bindProps}>{ctaSubtitleEdit.value}</span>
                </p>
                <CtaForm />
              </div>
            </div>
          </RevealSection>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
