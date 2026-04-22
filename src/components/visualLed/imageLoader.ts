/**
 * Tiny image / file helpers shared by the visualizer UI.
 * Mirrors the legacy `createImage` / `fileToDataUrl` behaviour, minus
 * canvas-tainting workarounds (`crossOrigin` for non-data URLs) that
 * only matter when we start loading backgrounds from remote Supabase
 * storage in phase 4.
 */

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    // Cross-origin backgrounds (e.g. signed Supabase URLs on project
    // restore) otherwise taint the canvas and break toDataURL when
    // exporting the report.
    if (!src.startsWith('data:')) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });
}
