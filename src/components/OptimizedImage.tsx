import type { ImgHTMLAttributes } from 'react';
import { getModernImageSrc } from '../lib/optimizedImages';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export default function OptimizedImage({
  src,
  alt,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: OptimizedImageProps) {
  const avif = getModernImageSrc(src, 'avif');
  const webp = getModernImageSrc(src, 'webp');

  if (!avif || !webp) {
    return <img src={src} alt={alt} loading={loading} decoding={decoding} {...props} />;
  }

  return (
    <picture>
      <source srcSet={avif} type="image/avif" />
      <source srcSet={webp} type="image/webp" />
      <img src={webp} alt={alt} loading={loading} decoding={decoding} {...props} />
    </picture>
  );
}
