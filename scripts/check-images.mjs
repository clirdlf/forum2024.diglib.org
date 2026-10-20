import { loadImageManifest, validateImageManifest } from './lib/images.mjs';
const result = await validateImageManifest(await loadImageManifest());
console.log(
  `Retained image checks pass: ${result.sources} source mappings, ${result.derivatives} derivatives.`,
);
