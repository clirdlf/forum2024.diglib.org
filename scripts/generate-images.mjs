// Explicit one-time generation. No build module imports this file or Eleventy Image.
import Image from '@11ty/eleventy-img';
import { readFile, writeFile, readdir, stat, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import { format, resolveConfig } from 'prettier';
import { readContent } from './lib/content.mjs';
import { isPhotograph, selectMaster, backgroundSources, photoFamily } from './lib/images.mjs';
import { checksum, digest, within, exists, replacePaths } from './lib/files.mjs';

const imageVersion = JSON.parse(
  await readFile('node_modules/@11ty/eleventy-img/package.json', 'utf8'),
).version;
const policy = {
  generator: `@11ty/eleventy-img@${imageVersion}`,
  version: 1,
  widths: [480, 960, 1440, 1920, 'auto'],
  formats: ['avif', 'webp'],
  avif: { quality: 50, effort: 4 },
  webp: { quality: 78 },
  minimumWidth: 600,
  minimumBytes: 30720,
};
const assetRoot = path.resolve('src/assets/site');
const inputs = new Map(),
  probes = new Map();
function add(url, candidates = []) {
  if (!isPhotograph(url)) return;
  if (!inputs.has(url)) inputs.set(url, new Set());
  for (const candidate of candidates) if (isPhotograph(candidate)) inputs.get(url).add(candidate);
}
for (const doc of await readContent('src/content')) {
  const $ = load(doc.head + doc.body);
  $('img[src]').each((_, el) =>
    add(
      $(el).attr('src'),
      ($(el).attr('srcset') || '').split(',').map((c) => c.trim().split(/[ \t\n\r\f]+/)[0]),
    ),
  );
  $('style').each((_, el) => backgroundSources($(el).html()).forEach((url) => add(url)));
  $('[style]').each((_, el) => backgroundSources($(el).attr('style')).forEach((url) => add(url)));
}
async function visitCss(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await visitCss(file);
    else if (file.endsWith('.css'))
      for (const url of backgroundSources(await readFile(file, 'utf8'))) add(url);
  }
}
await visitCss(assetRoot);
async function probe(url) {
  if (!probes.has(url)) {
    const file = within(assetRoot, decodeURIComponent(url).replace(/^\//, ''));
    const metadata = await Image(file, { widths: ['auto'], formats: ['jpeg'], statsOnly: true });
    probes.set(url, {
      url,
      file,
      width: metadata.jpeg[0].width,
      height: metadata.jpeg[0].height,
      bytes: (await stat(file)).size,
      sha256: await checksum(file),
    });
  }
  return probes.get(url);
}
const families = new Map();
for (const [url, candidates] of inputs) {
  for (const candidate of [url, ...candidates]) {
    const key = photoFamily(candidate);
    if (!families.has(key)) families.set(key, new Set());
    families.get(key).add(candidate);
  }
}
for (const [url, candidates] of inputs)
  for (const candidate of families.get(photoFamily(url)) || []) candidates.add(candidate);
const selections = [];
for (const [url, candidateUrls] of [...inputs].sort(([a], [b]) => a.localeCompare(b))) {
  const original = await probe(url),
    candidates = [];
  for (const candidate of [...candidateUrls].sort()) {
    const file = within(assetRoot, decodeURIComponent(candidate).replace(/^\//, ''));
    if (await exists(file)) candidates.push(await probe(candidate));
  }
  const master = selectMaster(original, candidates);
  if (master.width >= policy.minimumWidth && master.bytes >= policy.minimumBytes)
    selections.push({ url, original, master });
}
await mkdir('.cache', { recursive: true });
const workspace = await mkdtemp(path.resolve('.cache/image-generation-'));
try {
  const outputDir = path.join(workspace, 'images');
  await mkdir(outputDir);
  const images = {},
    masters = new Map(),
    retained = new Map();
  const policyHash = digest(JSON.stringify(policy)).slice(0, 8);
  Image.concurrency = 2;
  for (const { url, original, master } of selections) {
    if (!masters.has(master.url)) {
      console.log('Optimizing', master.url);
      const metadata = await Image(master.file, {
        widths: policy.widths,
        formats: policy.formats,
        outputDir,
        urlPath: '/assets/images/',
        useCache: false,
        sharpAvifOptions: policy.avif,
        sharpWebpOptions: policy.webp,
        filenameFormat: (_id, _src, width, format) =>
          `${master.sha256.slice(0, 16)}-${policyHash}-${width}.${format}`,
      });
      const formats = {};
      for (const name of policy.formats) {
        const variants = [];
        for (const variant of metadata[name] || []) {
          const file = path.join(outputDir, variant.filename);
          variants.push({
            url: variant.url,
            width: variant.width,
            height: variant.height,
            bytes: (await stat(file)).size,
            sha256: await checksum(file),
          });
        }
        variants.sort((a, b) => a.width - b.width);
        // A source format must retain the native width; omit formats that cost more than the JPEG.
        if (variants.length && variants.at(-1).bytes < master.bytes) {
          formats[name] = variants;
          for (const variant of variants) retained.set(path.basename(variant.url), variant.bytes);
        }
      }
      masters.set(master.url, { master, formats });
    }
    const { formats } = masters.get(master.url);
    if (!Object.keys(formats).length) continue;
    images[url] = {
      source: master.url,
      sourceSha256: master.sha256,
      originalSha256: original.sha256,
      width: master.width,
      height: master.height,
      formats,
    };
  }
  for (const file of await readdir(outputDir))
    if (!retained.has(file)) await rm(path.join(outputDir, file));
  const comparisons = {};
  for (const name of policy.formats) {
    let originalBytes = 0,
      optimizedBytes = 0,
      count = 0;
    for (const { master, formats } of masters.values()) {
      if (formats[name]) {
        count++;
        originalBytes += master.bytes;
        optimizedBytes += formats[name].at(-1).bytes;
      }
    }
    comparisons[name] = {
      photographs: count,
      originalBytes,
      optimizedBytes,
      reductionPercent: originalBytes
        ? Math.round(1000 * (1 - optimizedBytes / originalBytes)) / 10
        : 0,
    };
  }
  const manifest = {
    policy,
    images,
    report: {
      mappedSources: Object.keys(images).length,
      masterPhotographs: [...masters.values()].filter((m) => Object.keys(m.formats).length).length,
      derivatives: retained.size,
      retainedBytes: [...retained.values()].reduce((a, b) => a + b, 0),
      comparisons,
    },
  };
  const staged = path.join(workspace, 'manifest.json');
  await writeFile(
    staged,
    await format(JSON.stringify(manifest), {
      ...(await resolveConfig('data/image-optimization.json')),
      parser: 'json',
    }),
  );
  await replacePaths(
    [
      { staged: outputDir, target: path.resolve('src/assets/images') },
      { staged, target: path.resolve('data/image-optimization.json') },
    ],
    workspace,
  );
  console.log(JSON.stringify(manifest.report, null, 2));
} finally {
  await rm(workspace, { recursive: true, force: true });
}
