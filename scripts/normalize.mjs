import { normalizeCapture } from './lib/normalize.mjs';
const result = await normalizeCapture();
console.log(
  `Normalized ${result.documents} pages and ${result.assets} asset references from local captures.`,
);
