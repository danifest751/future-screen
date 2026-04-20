import { useRef, useEffect } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

interface PrefetchLinkProps extends LinkProps {
  prefetch?: boolean;
}

/**
 * Link component with automatic prefetch on hover
 * Preloads the route chunk when user hovers over the link
 */
export const PrefetchLink = ({ 
  to, 
  prefetch = true,
  children,
  ...props 
}: PrefetchLinkProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const prefetched = useRef(false);

  useEffect(() => {
    if (!prefetch || prefetched.current) return;

    const link = linkRef.current;
    if (!link) return;

    const prefetchRoute = () => {
      if (prefetched.current) return;
      
      // Create a link element to prefetch the route
      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.href = to as string;
      document.head.appendChild(prefetchLink);
      
      prefetched.current = true;
    };

    // Prefetch on mouse enter
    link.addEventListener('mouseenter', prefetchRoute, { once: true });

    return () => {
      link.removeEventListener('mouseenter', prefetchRoute);
    };
  }, [to, prefetch]);

  return (
    <Link ref={linkRef} to={to} {...props}>
      {children}
    </Link>
  );
};

/**
 * Hook to prefetch routes programmatically
 */
// eslint-disable-next-line react-refresh/only-export-components
export const usePrefetch = () => {
  const prefetch = (path: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
  };

  return { prefetch };
};
