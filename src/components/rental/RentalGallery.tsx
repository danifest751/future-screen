import { memo } from 'react';
import { getRentalComponentContent } from '../../content/components/rental';
import { useI18n } from '../../context/I18nContext';

interface GalleryItem {
  image: string;
  alt: string;
  caption?: string;
}

interface RentalGalleryProps {
  items: GalleryItem[];
  title?: string;
}

const RentalGallery = memo(function RentalGallery({ items, title }: RentalGalleryProps) {
  const { siteLocale } = useI18n();
  const rentalComponentContent = getRentalComponentContent(siteLocale);

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
          {title ?? rentalComponentContent.galleryTitle}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] aspect-[4/3]"
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.alt || ''}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
                  <span className="text-slate-500 text-sm">
                    {rentalComponentContent.galleryEmptyLabel}
                  </span>
                </div>
              )}

              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-sm text-white">{item.caption}</p>
                </div>
              )}

              <div className="absolute inset-0 bg-brand-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export { RentalGallery };
export default RentalGallery;
