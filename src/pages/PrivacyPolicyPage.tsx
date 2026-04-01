import { Helmet } from 'react-helmet-async';
import Markdown from 'markdown-to-jsx';
import { usePrivacyPolicy } from '../hooks/usePrivacyPolicy';

const PrivacyPolicyPage = () => {
  const { content, loading, error } = usePrivacyPolicy();

  if (loading) {
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
          <h1 className="text-3xl font-bold text-white">Политика конфиденциальности</h1>
          <p className="mt-4 text-slate-400">
            Политика конфиденциальности временно недоступна. Пожалуйста, попробуйте позже.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{content.metaTitle || content.title || 'Политика конфиденциальности'}</title>
        {content.metaDescription && <meta name="description" content={content.metaDescription} />}
      </Helmet>

      <div className="container-page py-12 md:py-20">
        <article className="prose prose-invert prose-lg mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold text-white">{content.title}</h1>
          <div className="mt-8 text-slate-300">
            <Markdown>{content.content}</Markdown>
          </div>
        </article>
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
