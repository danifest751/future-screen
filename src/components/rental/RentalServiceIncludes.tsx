import { Check } from 'lucide-react';

interface RentalServiceIncludesProps {
  title?: string;
  items: string[];
}

export const RentalServiceIncludes = ({ 
  title = 'Что входит в услугу',
  items 
}: RentalServiceIncludesProps) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-6 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
            {title}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 transition hover:bg-white/[0.05] hover:border-white/10"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                  <Check className="h-4 w-4" />
                </span>
                <span className="text-slate-300 text-sm leading-relaxed">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
