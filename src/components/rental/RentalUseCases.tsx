import { memo } from 'react';
import { rentalComponentContent } from '../../content/components/rental';

interface UseCase {
  title: string;
  description: string;
}

interface RentalUseCasesProps {
  title?: string;
  items: UseCase[];
  slug?: string;
}

const RentalUseCases = memo(function RentalUseCases({
  title = rentalComponentContent.useCasesTitle,
  items,
  slug,
}: RentalUseCasesProps) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
          {title}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const imgSrc = slug
              ? `/images/usecases/${slug}-${index + 1}.png`
              : null;

            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
              >
                {imgSrc && (
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                  </div>
                )}

                <div className="p-5">
                  <h3 className="text-base font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export { RentalUseCases };
export default RentalUseCases;
