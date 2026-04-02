import { memo, type SVGProps } from 'react';

export const PhoneIcon = memo(function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.63 10.74a15.05 15.05 0 0 0 6.63 6.63l2.21-2.21a1.1 1.1 0 0 1 1.05-.29 12.36 12.36 0 0 0 3.86.62 1.1 1.1 0 0 1 1.1 1.1v3.48a1.1 1.1 0 0 1-1.1 1.1A19.1 19.1 0 0 1 2 4.1 1.1 1.1 0 0 1 3.1 3h3.48a1.1 1.1 0 0 1 1.1 1.1c0 1.33.22 2.65.62 3.86a1.1 1.1 0 0 1-.28 1.05l-2.39 2.73Z" />
    </svg>
  );
});
