import { memo, type PropsWithChildren } from 'react';
import clsx from 'clsx';

type SectionProps = PropsWithChildren<{
  id?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}>;

const Section = memo(function Section({ id, title, subtitle, className, children }: SectionProps) {
  return (
    <section id={id} className={clsx('container-page py-10 md:py-14', className)}>
      {(title || subtitle) && (
        <div className="mb-6 space-y-2">
          {title && <h2 className="text-2xl font-semibold text-white md:text-3xl">{title}</h2>}
          {subtitle && <p className="text-slate-300 md:text-lg">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
});

export default Section;
