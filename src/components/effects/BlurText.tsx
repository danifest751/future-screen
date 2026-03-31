import { useEffect, useRef, useState } from 'react';

interface BlurTextProps {
  text: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  delay?: number;
  stepDuration?: number;
  className?: string;
}

export const BlurText = ({
  text,
  animateBy = 'words',
  direction = 'top',
  delay = 200,
  stepDuration = 0.35,
  className = '',
}: BlurTextProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const items = animateBy === 'words' 
    ? text.split(' ') 
    : text.split('');

  return (
    <div ref={ref} className={className}>
      <span aria-label={text}>
        {items.map((item, index) => {
          const transform = direction === 'top' ? 'translateY(-20px)' : 'translateY(20px)';
          const isAnimating = isVisible;
          
          return (
            <span
              key={index}
              className="inline-block"
              style={{
                filter: isAnimating ? 'blur(0px)' : 'blur(12px)',
                opacity: isAnimating ? 1 : 0,
                transform: isAnimating ? 'translateY(0)' : transform,
                transition: `filter ${stepDuration}s ease-out, opacity ${stepDuration}s ease-out, transform ${stepDuration}s ease-out`,
                transitionDelay: `${index * delay}ms`,
                willChange: 'filter, opacity, transform',
              }}
            >
              {item === ' ' ? '\u00A0' : item}
              {animateBy === 'words' && index < items.length - 1 && '\u00A0'}
            </span>
          );
        })}
      </span>
      
      <style>{`
        @keyframes blur-text-in {
          from {
            filter: blur(12px);
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            filter: blur(0px);
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
