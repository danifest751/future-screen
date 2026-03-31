import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

interface RentalFaqProps {
  title?: string;
  items: FaqItem[];
}

export const RentalFaq = ({ 
  title = 'Частые вопросы',
  items 
}: RentalFaqProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 md:py-16">
      <div className="container-page">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <HelpCircle className="h-7 w-7 text-brand-400" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {title}
            </h2>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-xl border transition-all duration-200 ${
                    isOpen 
                      ? 'border-brand-500/30 bg-brand-500/[0.03]' 
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-white">
                      {item.question}
                    </span>
                    <ChevronDown 
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  <div 
                    className={`overflow-hidden transition-all duration-200 ${
                      isOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="px-5 pb-5">
                      <p className="text-slate-400 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
