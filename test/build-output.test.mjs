import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, access, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { outputDirectory, cleanOutput } from '../scripts/lib/build-output.mjs';
test('output selection isolates Pages builds and rejects source or external cleanup targets', () => {
  assert.equal(outputDirectory({}, '/project'), '/project/_site');
  assert.equal(
    outputDirectory({ SITE_OUTPUT_DIR: '.cache/pages-site' }, '/project'),
    '/project/.cache/pages-site',
  );
  for (const unsafe of [
    'src',
    'data',
    '.cache',
    '../elsewhere',
    '/tmp/site',
    '.cache/../src',
    '_site/../src',
  ])
    assert.throws(() => outputDirectory({ SITE_OUTPUT_DIR: unsafe }, '/project'), /output/i);
});
test('clean build removes stale generated files without changing other output or source', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dlf-build-'));
  try {
    for (const dir of ['src', '_site', '.cache/pages-site']) {
      await mkdir(path.join(root, dir), { recursive: true });
      await writeFile(path.join(root, dir, 'keep.txt'), 'example');
    }
    await cleanOutput({ SITE_OUTPUT_DIR: '.cache/pages-site' }, root);
    await assert.rejects(access(path.join(root, '.cache/pages-site/keep.txt')));
    await access(path.join(root, '_site/keep.txt'));
    await access(path.join(root, 'src/keep.txt'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
