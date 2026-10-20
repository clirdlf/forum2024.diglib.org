import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { normalizeCapture } from '../scripts/lib/normalize.mjs';
async function tree(root) {
  const result = {};
  async function walk(dir) {
    for (const e of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else result[path.relative(root, p)] = await readFile(p, 'utf8');
    }
  }
  await walk(root);
  return result;
}
test('offline normalization is deterministic and invalid captures leave source untouched', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dlf-normalize-'));
  const captureDir = path.join(root, 'capture'),
    sourceDir = path.join(root, 'src'),
    manifestFile = path.join(root, 'manifest.json');
  try {
    await mkdir(captureDir);
    await mkdir(sourceDir);
    const html =
      '<html><head><title>Home</title></head><body><header class="elementor-location-header"><nav><a href="/">Home</a></nav></header><main><h1>Offline</h1></main><footer class="elementor-location-footer">Contact</footer></body></html>';
    await writeFile(path.join(captureDir, 'home.html'), html);
    const index = {
      origin: 'https://forum2024.diglib.org',
      capturedAt: '2026-10-20',
      inputs: [],
      documents: [
        {
          id: '1',
          title: 'Home',
          type: 'page',
          path: '/',
          url: 'https://forum2024.diglib.org/',
          file: 'home.html',
          sha256: createHash('sha256').update(html).digest('hex'),
        },
      ],
      assets: [],
      styles: [],
    };
    await writeFile(path.join(captureDir, 'index.json'), JSON.stringify(index));
    await normalizeCapture({ captureDir, sourceDir, manifestFile });
    const first = await tree(sourceDir),
      manifest = await readFile(manifestFile, 'utf8');
    assert.match(first['content/home/body.html'], /Offline/);
    assert.doesNotMatch(first['content/home/body.html'], /Contact/);
    await normalizeCapture({ captureDir, sourceDir, manifestFile });
    assert.deepEqual(await tree(sourceDir), first);
    assert.equal(await readFile(manifestFile, 'utf8'), manifest);
    await writeFile(path.join(captureDir, 'home.html'), 'incomplete');
    await assert.rejects(normalizeCapture({ captureDir, sourceDir, manifestFile }), /checksum/);
    assert.deepEqual(await tree(sourceDir), first);
    assert.equal(await readFile(manifestFile, 'utf8'), manifest);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
