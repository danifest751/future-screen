import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useRentalCategory } from '../services/rentalCategories';
import { RentalHero } from '../components/rental/RentalHero';
import { RentalAbout } from '../components/rental/RentalAbout';
import { RentalUseCases } from '../components/rental/RentalUseCases';
import { RentalServiceIncludes } from '../components/rental/RentalServiceIncludes';
import { RentalBenefits } from '../components/rental/RentalBenefits';
import { RentalGallery } from '../components/rental/RentalGallery';
import { RentalFaq } from '../components/rental/RentalFaq';
import { RentalCta } from '../components/rental/RentalCta';
import { useI18n } from '../context/I18nContext';
import { getRentalCategoryPageContent } from '../content/pages/rentalCategory';

const RentalCategoryPage = () => {
  const { siteLocale } = useI18n();
  const { slug } = useParams<{ slug: string }>();
  const { item: category, loading, error } = useRentalCategory(slug ?? '', siteLocale);
  const rentalCategoryPageContent = getRentalCategoryPageContent(siteLocale);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="py-12 text-center">
        <h2 className="mb-2 text-xl font-semibold text-white">
          {error ? rentalCategoryPageContent.errorTitle : rentalCategoryPageContent.notFoundTitle}
        </h2>
        <p className="text-slate-400">
          {error ? error : rentalCategoryPageContent.fallbackDescription}
        </p>
      </div>
    );
  }

  const seo = category.seo;
  const hero = category.hero;
  const about = category.about;
  const useCases = category.useCases;
  const serviceIncludes = category.serviceIncludes;
  const benefits = category.benefits;
  const gallery = category.gallery;
  const faq = category.faq;
  const bottomCta = category.bottomCta;

  return (
    <div className="container-page py-8">
      <Helmet>
        <title>{(seo.metaTitle as string) || category.name}</title>
        <meta name="description" content={(seo.metaDescription as string) || ''} />
        {(seo.ogTitle as string) && <meta property="og:title" content={seo.ogTitle as string} />}
        {(seo.ogDescription as string) && <meta property="og:description" content={seo.ogDescription as string} />}
        {(seo.canonical as string) && <link rel="canonical" href={seo.canonical as string} />}
      </Helmet>

        <RentalHero
        title={(hero.title as string) || category.name}
        subtitle={(hero.subtitle as string) || ''}
        primaryCtaText={hero.cta as string}
        primaryCtaLink={hero.ctaLink as string}
        secondaryCtaText={hero.secondaryCta as string}
        secondaryCtaLink={hero.secondaryCtaLink as string}
        highlights={Array.isArray(hero.highlights) ? hero.highlights : []}
        showBlurTitle={(hero.showBlurTitle as boolean) || false}
      />

      {about && (about.text || (Array.isArray(about.items) && about.items.length > 0)) && (
        <RentalAbout data={about as { title: string; text: string; items?: string[] }} />
      )}

      {Array.isArray(useCases) && useCases.length > 0 && (
        <RentalUseCases
          slug={slug}
          items={useCases.map((uc) => ({
            title: uc.title,
            description: uc.description,
          }))}
        />
      )}

      {serviceIncludes.items && serviceIncludes.items.length > 0 && (
        <RentalServiceIncludes
          title={serviceIncludes.title}
          items={serviceIncludes.items}
        />
      )}

      {benefits.items && benefits.items.length > 0 && (
        <RentalBenefits
          title={benefits.title}
          items={benefits.items}
        />
      )}

      {Array.isArray(gallery) && gallery.length > 0 && (
        <RentalGallery items={gallery} />
      )}

      {faq.items && faq.items.length > 0 && (
        <RentalFaq
          title={faq.title}
          items={faq.items}
        />
      )}

      {bottomCta && (bottomCta.title as string || bottomCta.text as string) && (
        <RentalCta
          data={bottomCta as { title: string; text: string; primaryCta?: string; primaryCtaLink?: string; secondaryCta?: string; secondaryCtaLink?: string }}
          showForm={true}
          formCtaText={rentalCategoryPageContent.formCtaText}
        />
      )}
    </div>
  );
};

export default RentalCategoryPage;
