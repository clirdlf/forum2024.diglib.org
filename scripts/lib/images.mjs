// Rendering and validation use committed metadata only; native encoders are not imported here.
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { checksum, exists, within } from './files.mjs';

export function isPhotograph(url) {
  if (!/^\/(?!\/)/.test(url || '') || !/\.jpe?g$/i.test(url)) return false;
  return /\/(?:CLIR[MTW]-|SummerExterior-|joshua-rodriguez-|KFphoto|GHphoto|ANDREA-Headshot|jferretti_by_)/i.test(
    url,
  );
}
export function selectMaster(original, candidates) {
  const ratio = original.width / original.height;
  return [original, ...candidates]
    .filter((c) => Math.abs(c.width / c.height / ratio - 1) < 0.01)
    .sort((a, b) => b.width - a.width || a.url.localeCompare(b.url))[0];
}
export function backgroundSources(css) {
  return [
    ...css.matchAll(
      /background-image\s*:\s*url\(\s*(['"]?)([^'"()]+)\1\s*\)(?:\s*!important)?(?=\s*[;}]|\s*$)/gi,
    ),
  ].map((m) => m[2].trim());
}
export function optimizeCss(css, manifest) {
  return css.replace(
    /(background-image\s*:\s*)url\(\s*(['"]?)([^'"()]+)\2\s*\)(\s*!important)?(\s*;|(?=\s*}|$))/gi,
    (whole, property, quote, url, important = '', ending, offset) => {
      const record = manifest.images[url.trim()];
      if (!record) return whole;
      if (/^\s*background-image\s*:\s*image-set\(/i.test(css.slice(offset + whole.length)))
        return whole;
      const choices = [];
      for (const format of ['avif', 'webp']) {
        const v = record.formats[format]?.at(-1);
        if (v) choices.push(`url("${v.url}") type("image/${format}")`);
      }
      if (!choices.length) return whole;
      choices.push(`url("${url.trim()}") type("image/jpeg")`);
      return (
        whole + (ending ? '' : ';') + `${property}image-set(${choices.join(', ')})${important};`
      );
    },
  );
}
export function optimizeHtml(html, manifest) {
  const full = /<!doctype|<html[\s>]/i.test(html),
    $ = load(html, null, full);
  $('img[src]').each((_, el) => {
    const image = $(el),
      record = manifest.images[image.attr('src')];
    if (!record || image.parent('picture').length) return;
    const formats = ['avif', 'webp'].filter((f) => record.formats[f]?.length);
    if (!formats.length) return;
    const picture = $('<picture class="archive-picture">');
    image.replaceWith(picture);
    for (const format of formats)
      picture.append(
        $('<source>').attr({
          type: `image/${format}`,
          srcset: record.formats[format].map((v) => `${v.url} ${v.width}w`).join(', '),
          sizes: image.attr('sizes') || '100vw',
        }),
      );
    if (!image.attr('width')) image.attr('width', record.width);
    if (!image.attr('height')) image.attr('height', record.height);
    picture.append(image);
  });
  $('[style]').each((_, el) => $(el).attr('style', optimizeCss($(el).attr('style'), manifest)));
  $('style').each((_, el) => $(el).html(optimizeCss($(el).html(), manifest)));
  return $.html();
}
export async function loadImageManifest(file = 'data/image-optimization.json') {
  return JSON.parse(await readFile(file, 'utf8'));
}
export async function validateImageManifest(
  manifest,
  { assetRoot = 'src/assets/site', imageRoot = 'src/assets/images' } = {},
) {
  const checked = new Map();
  async function matches(file, hash) {
    if (!checked.has(file)) checked.set(file, await checksum(file));
    return checked.get(file) === hash;
  }
  const derivatives = new Set();
  for (const [url, record] of Object.entries(manifest.images)) {
    for (const [input, hash] of [
      [url, record.originalSha256],
      [record.source, record.sourceSha256],
    ]) {
      const file = within(assetRoot, decodeURIComponent(input).replace(/^\//, ''));
      if (!(await exists(file)) || !(await matches(file, hash)))
        throw Error(`Stale optimized image source ${input}; run pnpm images:generate.`);
    }
    for (const variants of Object.values(record.formats))
      for (const variant of variants) {
        if (!variant.url.startsWith('/assets/images/'))
          throw Error('Invalid optimized image URL: ' + variant.url);
        const file = within(imageRoot, variant.url.slice('/assets/images/'.length));
        if (!(await exists(file)))
          throw Error(`Missing optimized image ${variant.url}; run pnpm images:generate.`);
        if (!(await matches(file, variant.sha256)))
          throw Error('Optimized image checksum mismatch: ' + variant.url);
        derivatives.add(file);
      }
  }
  return { sources: Object.keys(manifest.images).length, derivatives: derivatives.size };
}

export function photoFamily(url) {
  return url.replace(/-(?:scaled|\d+x\d+)(?=\.jpe?g$)/i, '').toLowerCase();
}
