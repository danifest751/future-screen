import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { useCategories } from '../hooks/useCategories';
import { rentCategoriesContent } from '../data/rentCategoriesContent';
import { RequestForm } from '../components/RequestForm';
import { rentalCategoryPageContent } from '../content/pages/rentalCategory';
import type { Category } from '../data/categories';

type Props = {
  categoryId: Category['id'];
};

const RentCategoryPage = ({ categoryId }: Props) => {
  const { categories } = useCategories();
  const category = categories.find((c) => c.id === categoryId);
  const content = rentCategoriesContent.find((c) => c.id === categoryId);

  if (!category || !content) return <Navigate to="/rent" replace />;

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{`${category.title} - ${rentalCategoryPageContent.seoTitleSuffix}`}</title>
        <meta name="description" content={`${category.shortDescription} ${content.description}`} />
      </Helmet>
      <Section title={category.title} subtitle={content.description}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <div className="text-lg font-semibold text-white">{rentalCategoryPageContent.factsTitle}</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {content.facts.map((fact) => (
                <li key={fact} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="text-lg font-semibold text-white">{rentalCategoryPageContent.itemsTitle}</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              {content.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-brand-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        title={rentalCategoryPageContent.tipsTitle}
        subtitle={rentalCategoryPageContent.tipsSubtitle}
        className="pb-4"
      >
        <div className="grid gap-3 md:grid-cols-3">
          {content.tips.map((tip) => (
            <div key={tip} className="card text-sm text-slate-200">
              {tip}
            </div>
          ))}
        </div>
      </Section>

      <Section className="pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <RequestForm
            title={rentalCategoryPageContent.requestTitle}
            subtitle={rentalCategoryPageContent.requestSubtitle}
            ctaText={rentalCategoryPageContent.requestCtaText}
          />
          <div className="card space-y-3 text-sm text-slate-200">
            <div className="text-lg font-semibold text-white">{rentalCategoryPageContent.alternativeTitle}</div>
            <p>{rentalCategoryPageContent.alternativeDescription}</p>
            <div className="flex flex-wrap gap-2">
              {categories
                .filter((c) => c.id !== categoryId)
                .map((c) => (
                  <Link key={c.id} to={c.pagePath} className="badge hover:border-brand-500/60">
                    {c.title}
                  </Link>
                ))}
            </div>
            <Link to="/rent" className="inline-flex items-center text-brand-200 hover:text-brand-100">
              {rentalCategoryPageContent.backLink}
            </Link>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default RentCategoryPage;
