import { accessibleHtml } from './accessibility.mjs';
import { optimizeHtml } from './images.mjs';
import { prefixHtml } from './paths.mjs';

// Correct captured markup first, add retained image sources, then prefix every generated URL.
export function renderHtml(html, { imageManifest, pathPrefix = '/' } = {}) {
  return prefixHtml(optimizeHtml(accessibleHtml(html), imageManifest), pathPrefix);
}
