import { Helmet } from 'react-helmet-async';
import Markdown from 'markdown-to-jsx';
import { usePrivacyPolicyQuery } from '../queries';
import { sanitizeMarkdown } from '../lib/sanitize';
import { useI18n } from '../context/I18nContext';
import { getPrivacyPageContent } from '../content/pages/privacy';

const PrivacyPolicyPage = () => {
  const { siteLocale } = useI18n();
  const privacyPageContent = getPrivacyPageContent(siteLocale);
  const { data: content, isLoading, error } = usePrivacyPolicyQuery(siteLocale);

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl">
          <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-white/5" style={{ width: `${100 - i * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !content?.content) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold text-white">{privacyPageContent.fallbackTitle}</h1>
          <p className="mt-4 text-slate-400">
            {privacyPageContent.fallbackDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{content.meta_title || content.title || privacyPageContent.fallbackTitle}</title>
        {content.meta_description && <meta name="description" content={content.meta_description} />}
      </Helmet>

      <div className="container-page py-12 md:py-20">
        <article
          className="prose prose-invert prose-lg mx-auto max-w-3xl"
          style={content.font_size ? { fontSize: content.font_size } : undefined}
        >
          <h1 className="text-4xl font-bold text-white">{content.title}</h1>
          <Markdown>{sanitizeMarkdown(content.content)}</Markdown>
        </article>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
