import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';
import { canonical, normalizeDocument, localizeCss } from './localize.mjs';
import { splitDocument } from './content.mjs';
import { readVerified, within, replacePaths, exists } from './files.mjs';
export async function normalizeCapture({
  captureDir = 'data/capture',
  sourceDir = 'src',
  manifestFile = 'data/archive-manifest.json',
} = {}) {
  const capture = JSON.parse(await readFile(path.join(captureDir, 'index.json'), 'utf8'));
  const assetMap = new Map(capture.assets.map((a) => [canonical(a.url), a.path]));
  const formatting = await resolveConfig(path.resolve(sourceDir, 'content/home/body.html'));
  const htmlFormat = (html) =>
    format(html, {
      ...formatting,
      parser: 'html',
      htmlWhitespaceSensitivity: 'strict',
      printWidth: 100,
    });
  const json = (value) => JSON.stringify(value, null, 2) + '\n';
  await mkdir(path.dirname(sourceDir), { recursive: true });
  const workspace = await mkdtemp(path.join(path.dirname(sourceDir), '.normalize-'));
  try {
    const contentDir = path.join(workspace, 'content');
    await mkdir(contentDir);
    const entries = [];
    const shared = {};
    for (const document of capture.documents.toSorted((a, b) => a.path.localeCompare(b.path))) {
      const raw = await readVerified(captureDir, document);
      const normalized = {
        ...normalizeDocument(raw, document.url, assetMap),
        sourceTitle: document.title,
        type: document.type,
        id: document.id,
      };
      const split = splitDocument(normalized);
      for (const name of ['header', 'footer']) {
        const html = await htmlFormat(split[name]);
        if (shared[name] && shared[name] !== html)
          throw Error(`Inconsistent shared ${name} on ${document.path}`);
        shared[name] = html;
      }
      const { head, body, ...metadata } = split.page;
      const directory = within(
        contentDir,
        document.path === '/' ? 'home' : document.path.replace(/^\//, ''),
      );
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, 'page.json'), json(metadata));
      await writeFile(path.join(directory, 'head.html'), await htmlFormat(head));
      await writeFile(path.join(directory, 'body.html'), await htmlFormat(body));
    }
    entries.push({
      staged: contentDir,
      target: path.resolve(sourceDir, 'content'),
    });
    for (const name of ['header', 'footer']) {
      const staged = path.join(workspace, name + '.html');
      await writeFile(staged, shared[name]);
      entries.push({
        staged,
        target: path.resolve(sourceDir, '_includes', name + '.html'),
      });
    }
    for (const [i, style] of capture.styles.entries()) {
      const raw = await readVerified(captureDir, style);
      const staged = path.join(workspace, `style-${i}.css`);
      await writeFile(staged, localizeCss(raw, style.url, assetMap));
      entries.push({
        staged,
        target: within(path.resolve(sourceDir, 'assets/site'), style.path.replace(/^\//, '')),
      });
    }
    for (const asset of capture.assets) {
      const target = within(path.resolve(sourceDir, 'assets/site'), asset.path.replace(/^\//, ''));
      if (!(await exists(target))) throw Error('Missing local asset: ' + asset.path);
    }
    const manifest = {
      origin: capture.origin,
      capturedAt: capture.capturedAt,
      inputs: capture.inputs,
      documents: capture.documents
        .map(({ file, sha256, ...d }) => d)
        .toSorted((a, b) => a.path.localeCompare(b.path)),
      assets: capture.assets.toSorted((a, b) => a.url.localeCompare(b.url)),
      failures: [],
    };
    const staged = path.join(workspace, 'manifest.json');
    await writeFile(staged, json(manifest));
    entries.push({ staged, target: path.resolve(manifestFile) });
    await replacePaths(entries, workspace);
    return {
      documents: capture.documents.length,
      assets: capture.assets.length,
    };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
