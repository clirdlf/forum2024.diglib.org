import { loadImageManifest, validateImageManifest } from './lib/images.mjs';
import { readFile } from 'node:fs/promises';
import { auditSite } from './lib/audit.mjs';
import { readInventory } from './lib/inventory.mjs';
const retainedImages = await validateImageManifest(await loadImageManifest());
const manifest = JSON.parse(await readFile('data/archive-manifest.json', 'utf8'));
const source = readInventory(await readFile('data/dlfforum2024.WordPress.2026-10-20.xml', 'utf8'));
const missing = source.documents.filter((d) => !manifest.documents.some((m) => m.path === d.path));
const result = await auditSite('_site', manifest, {
  pathPrefix: process.env.SITE_PATH_PREFIX || '/',
});
result.errors.push(...missing.map((d) => 'Published source document omitted: ' + d.path));
console.log(
  `${result.pages} HTML pages; ${result.assets} captured assets; ${result.references} references checked.`,
);
if (result.warnings.length) console.log('Fragment warnings:\n' + result.warnings.join('\n'));
if (result.errors.length) {
  console.error(result.errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    'All published routes, internal links, and local assets pass. No widget or remote rendering dependencies.',
  );

console.log(`Retained optimized image files verified: ${retainedImages.derivatives}.`);
