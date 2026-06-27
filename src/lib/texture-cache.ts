/**
 * Shared texture cache.
 * Pages preload images here during loading overlay.
 * Scene3D reads from the same cache — zero duplicate network requests.
 */

// Store loaded HTMLImageElements
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Preload an image URL into the shared cache.
 * Call this during the loading phase in page components.
 * Once loaded, Scene3D can create Three.js textures from it instantly.
 */
export function preloadTexture(url: string): Promise<void> {
  return new Promise((resolve) => {
    const cached = imageCache.get(url);
    if (cached) { resolve(); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imageCache.set(url, img); resolve(); };
    img.onerror = () => { resolve(); }; // Don't block on error
    img.src = url;
  });
}

/**
 * Preload multiple images in parallel.
 */
export function preloadTextures(urls: string[]): Promise<void> {
  return Promise.all(urls.map(preloadTexture)).then(() => {});
}

/**
 * Get a cached image if available.
 */
export function getCachedImage(url: string): HTMLImageElement | undefined {
  return imageCache.get(url);
}
