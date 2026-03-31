import { Lightbulb, Users, Music, Building2, PartyPopper, Tent } from 'lucide-react';

interface UseCase {
  title: string;
  description: string;
}

interface RentalUseCasesProps {
  title?: string;
  items: UseCase[];
}

// Default icons mapped by common use case keywords
const getIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('корпоратив') || lower.includes('делов')) return Building2;
  if (lower.includes('концерт') || lower.includes('фестивал') || lower.includes('music')) return Music;
  if (lower.includes('выставк') || lower.includes('стенд')) return Lightbulb;
  if (lower.includes('свадьб') || lower.includes('частн') || lower.includes('юбилей')) return PartyPopper;
  if (lower.includes('конференц') || lower.includes('форум')) return Users;
  if (lower.includes('уличн') || lower.includes('открыт')) return Tent;
  return Lightbulb;
};

export const RentalUseCases = ({ 
  title = 'Сценарии использования',
  items 
}: RentalUseCasesProps) => {
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
            const Icon = getIcon(item.title);
            return (
              <div
                key={index}
                className="card group"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
