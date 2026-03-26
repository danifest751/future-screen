import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Play, Image as ImageIcon } from 'lucide-react';
import Section from '../components/Section';
import { useCases } from '../hooks/useCases';
import type { CaseItem } from '../data/cases';
import { LazyImage } from '../components/LazyImage';

const CasesPage = () => {
  const { cases } = useCases();

  const getPreviewMedia = (item: CaseItem & { videos?: string[] }) => {
    const images = item.images || [];
    const videos = item.videos || [];
    const hasVideo = videos.length > 0;
    
    // Take up to 4 preview items
    const previewImages = images.slice(0, 4);
    
    return { previewImages, hasVideo, videoCount: videos.length, imageCount: images.length };
  };

  return (
    <div className="space-y-2">
      <Helmet>
        <title>Кейсы — реализованные проекты | Фьючер Скрин</title>
        <meta name="description" content="Портфолио реализованных проектов: форумы, концерты, выставки. Цифры, состав работ и фото." />
      </Helmet>
      <Section title="Кейсы" subtitle="Реализованные проекты с цифрами и составом работ">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((item) => {
            const { previewImages, hasVideo, videoCount, imageCount } = getPreviewMedia(item as CaseItem & { videos?: string[] });
            
            return (
              <Link 
                key={item.slug} 
                to={`/cases/${item.slug}`} 
                className="card group block overflow-hidden p-0 hover:border-brand-500/40"
              >
                {/* Preview Gallery */}
                {previewImages.length > 0 && (
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
                    {previewImages.length === 1 ? (
                      // Single image - full cover
                      <LazyImage
                        src={previewImages[0]}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        placeholderClassName="h-full w-full"
                      />
                    ) : previewImages.length === 2 ? (
                      // Two images - side by side
                      <div className="flex h-full gap-0.5">
                        {previewImages.map((src, idx) => (
                          <div key={src} className="relative flex-1 overflow-hidden">
                            <LazyImage
                              src={src}
                              alt={`${item.title} ${idx + 1}`}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              placeholderClassName="h-full w-full"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      // 3+ images - grid layout
                      <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
                        {previewImages.map((src, idx) => (
                          <div 
                            key={src} 
                            className={`relative overflow-hidden ${
                              idx === 0 && previewImages.length >= 3 ? 'row-span-2' : ''
                            }`}
                          >
                            <LazyImage
                              src={src}
                              alt={`${item.title} ${idx + 1}`}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              placeholderClassName="h-full w-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Video indicator overlay */}
                    {hasVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
                          <Play size={16} fill="currentColor" />
                          {videoCount > 1 ? `${videoCount} видео` : 'Смотреть видео'}
                        </div>
                      </div>
                    )}
                    
                    {/* More images indicator */}
                    {imageCount > previewImages.length && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                        <ImageIcon size={14} />
                        +{imageCount - previewImages.length}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Content */}
                <div className="p-4">
                  {/* Tags row */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs text-brand-300">
                      {item.format}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.city} · {item.date}
                    </span>
                  </div>
                  
                  {/* Title */}
                  <div className="text-lg font-semibold text-white transition-colors group-hover:text-brand-300">
                    {item.title}
                  </div>
                  
                  {/* Summary */}
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {item.summary}
                  </p>
                  
                  {/* Metrics - prominent */}
                  {item.metrics && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.metrics.split(',').map((m, i) => (
                        <span 
                          key={i} 
                          className="rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-xs text-brand-200"
                        >
                          {m.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Services tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {item.services.slice(0, 4).map((s, idx) => (
                      <span key={s} className="text-[10px] uppercase text-slate-500">
                        {s}
                        {idx < Math.min(item.services.length, 4) - 1 && (
                          <span className="ml-1 text-slate-600">·</span>
                        )}
                      </span>
                    ))}
                    {item.services.length > 4 && (
                      <span className="text-[10px] text-slate-600">
                        +{item.services.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        {cases.length === 0 && (
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-12 text-center">
            <div className="text-slate-500">Кейсы пока не добавлены</div>
          </div>
        )}
      </Section>
    </div>
  );
};

export default CasesPage;
