const OPTIMIZABLE_PUBLIC_IMAGE = /^\/images\/.+\.(png|jpe?g)$/i;

export function getModernImageSrc(src: string, extension: 'avif' | 'webp') {
  if (!OPTIMIZABLE_PUBLIC_IMAGE.test(src)) return null;
  return src.replace(/\.(png|jpe?g)$/i, `.${extension}`);
}

export function getOptimizedBackgroundImage(src: string) {
  const avif = getModernImageSrc(src, 'avif');
  const webp = getModernImageSrc(src, 'webp');

  if (!avif || !webp) return `url("${src}")`;

  return [
    'image-set(',
    `url("${avif}") type("image/avif"),`,
    `url("${webp}") type("image/webp"),`,
    `url("${src}") type("image/png")`,
    ')',
  ].join(' ');
}
