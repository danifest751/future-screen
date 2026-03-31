interface RentalAboutProps {
  data: {
    title?: string;
    text?: string;
    items?: string[];
  };
}

export const RentalAbout = ({ data }: RentalAboutProps) => {
  const { title, text, items } = data;
  const hasItems = Array.isArray(items) && items.length > 0;
  const hasText = text && text.trim().length > 0;

  if (!title && !hasText && !hasItems) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left column - Title and text */}
          <div>
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                {title}
              </h2>
            )}
            {hasText && (
              <div className="prose prose-invert prose-slate max-w-none">
                {text.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-slate-300 leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Right column - Items list */}
          {hasItems && (
            <div className="lg:pl-8">
              <ul className="space-y-4">
                {items.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
