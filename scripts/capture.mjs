// Explicit online migration. Routine builds and normalization never use this command.
import { readFile, writeFile, mkdir, mkdtemp, copyFile, rename, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { readInventory } from './lib/inventory.mjs';
import { ORIGIN, canonical, prepareDocument, collectAssets, localizeCss } from './lib/localize.mjs';
import { digest, exists, fingerprintInputs, within, replacePaths } from './lib/files.mjs';
import { normalizeCapture } from './lib/normalize.mjs';
const exec = promisify(execFile);
const xml = 'data/dlfforum2024.WordPress.2026-10-20.xml',
  tarball = 'site50-uploads-20261020.tar.gz';
const identity = await fingerprintInputs([xml, tarball]);
const cache = path.resolve('.cache/capture', identity.key);
await mkdir(cache, { recursive: true });
const workspace = await mkdtemp(path.resolve('.cache/capture-stage-'));
try {
  const captureDir = path.join(workspace, 'capture'),
    sourceDir = path.join(workspace, 'src');
  await mkdir(path.join(captureDir, 'pages'), { recursive: true });
  await mkdir(path.join(captureDir, 'styles'));
  const assetRoot = path.join(sourceDir, 'assets/site');
  await mkdir(assetRoot, { recursive: true });
  async function download(url) {
    const file = path.join(cache, digest(url));
    if (process.argv.includes('--refresh') || !(await exists(file))) {
      const partial = file + '.partial';
      try {
        await exec('curl', [
          '--fail',
          '--location',
          '--silent',
          '--show-error',
          '--retry',
          '2',
          '--max-time',
          '60',
          url,
          '-o',
          partial,
        ]);
        await rename(partial, file);
      } finally {
        await rm(partial, { force: true });
      }
    }
    return file;
  }
  const uploads = path.join(cache, 'uploads');
  if (!(await exists(path.join(uploads, '.complete')))) {
    const { stdout } = await exec('tar', ['-tzf', tarball], {
      maxBuffer: 8 * 1024 * 1024,
    });
    for (const member of stdout.split('\n').filter(Boolean))
      if (!member.startsWith('50/') || member.split('/').includes('..'))
        throw Error('Unsafe archive member: ' + member);
    const extracted = await mkdtemp(path.join(cache, 'extract-'));
    try {
      await exec('tar', ['-xzf', tarball, '-C', extracted]);
      await writeFile(path.join(extracted, '.complete'), identity.key);
      await rm(uploads, { recursive: true, force: true });
      await rename(extracted, uploads);
    } finally {
      await rm(extracted, { recursive: true, force: true });
    }
  }
  const inventory = readInventory(await readFile(xml, 'utf8'));
  const capture = {
    origin: ORIGIN,
    capturedAt: new Date().toISOString(),
    inputs: identity.inputs,
    documents: [],
    assets: [],
    styles: [],
  };
  const queue = [...inventory.documents];
  const known = new Set(queue.map((d) => d.path)),
    sources = new Set();
  for (let i = 0; i < queue.length; i += 5) {
    await Promise.all(
      queue.slice(i, i + 5).map(async (doc) => {
        const raw = await readFile(await download(doc.url), 'utf8');
        if (!raw.includes('<body')) throw Error('No HTML body: ' + doc.url);
        const file = 'pages/' + digest(doc.url).slice(0, 20) + '.html';
        await writeFile(within(captureDir, file), raw);
        const { content, ...metadata } = doc;
        capture.documents.push({ ...metadata, file, sha256: digest(raw) });
        const $ = prepareDocument(raw);
        for (const asset of collectAssets($, doc.url)) sources.add(asset);
        $('a[href]').each((_, el) => {
          try {
            const u = new URL($(el).attr('href'), doc.url);
            if (
              u.origin === ORIGIN &&
              /^\/(?:category\/[^/]+\/(?:page\/\d+\/)?|news\/page\/\d+\/)$/.test(u.pathname) &&
              !known.has(u.pathname)
            ) {
              known.add(u.pathname);
              queue.push({
                id: digest(u.pathname).slice(0, 12),
                url: u.href,
                path: u.pathname,
                type: 'archive',
                title: u.pathname,
              });
            }
          } catch {}
        });
      }),
    );
  }
  const processed = new Set(),
    assetMap = new Map();
  function assetPath(url) {
    const u = new URL(url);
    return u.origin === ORIGIN
      ? decodeURI(u.pathname)
      : '/assets/external/' + u.hostname + decodeURI(u.pathname);
  }
  while ([...sources].some((url) => !processed.has(url))) {
    const batch = [...sources]
      .filter((url) => !processed.has(url))
      .sort()
      .slice(0, 8);
    await Promise.all(
      batch.map(async (url) => {
        processed.add(url);
        const destination = assetPath(url);
        assetMap.set(url, destination);
        const upload = new URL(url).pathname.match(/^\/wp-content\/uploads\/sites\/50\/(.+)$/);
        const supplied = upload
          ? within(path.join(uploads, '50'), decodeURIComponent(upload[1]))
          : null;
        const fromArchive = supplied && (await exists(supplied));
        const source = fromArchive ? supplied : await download(url);
        const target = within(assetRoot, destination.replace(/^\//, ''));
        await mkdir(path.dirname(target), { recursive: true });
        await copyFile(source, target);
        capture.assets.push({
          url,
          path: destination,
          source: fromArchive ? 'supplied-uploads' : 'public-site',
        });
        if (new URL(url).pathname.endsWith('.css')) {
          const raw = await readFile(source, 'utf8'),
            file = 'styles/' + digest(url).slice(0, 20) + '.css';
          await writeFile(within(captureDir, file), raw);
          capture.styles.push({
            url,
            path: destination,
            file,
            sha256: digest(raw),
          });
          for (const match of raw.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi))
            if (match[2] && !/^(data:|#)/.test(match[2])) sources.add(canonical(match[2], url));
        }
      }),
    );
    console.log(`Captured ${processed.size}/${sources.size} assets`);
  }
  capture.documents.sort((a, b) => a.path.localeCompare(b.path));
  capture.assets.sort((a, b) => a.url.localeCompare(b.url));
  capture.styles.sort((a, b) => a.url.localeCompare(b.url));
  await writeFile(path.join(captureDir, 'index.json'), JSON.stringify(capture, null, 2) + '\n');
  const manifest = path.join(workspace, 'manifest.json');
  await normalizeCapture({ captureDir, sourceDir, manifestFile: manifest });
  await replacePaths(
    [
      { staged: captureDir, target: path.resolve('data/capture') },
      {
        staged: path.join(sourceDir, 'content'),
        target: path.resolve('src/content'),
      },
      { staged: assetRoot, target: path.resolve('src/assets/site') },
      ...['header', 'footer'].map((name) => ({
        staged: path.join(sourceDir, '_includes', name + '.html'),
        target: path.resolve('src/_includes', name + '.html'),
      })),
      { staged: manifest, target: path.resolve('data/archive-manifest.json') },
    ],
    workspace,
  );
  console.log(
    `Published complete capture: ${capture.documents.length} pages, ${capture.assets.length} assets.`,
  );
} finally {
  await rm(workspace, { recursive: true, force: true });
}
