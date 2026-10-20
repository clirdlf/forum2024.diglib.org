import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import { createSnapshot } from '../scripts/lib/snapshot.mjs';
import { digest } from '../scripts/lib/files.mjs';
test('snapshot contains a deployable site, per-file checksums, metadata and external integrity sums', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dlf-snapshot-'));
  try {
    const site = path.join(root, 'site'),
      output = path.join(root, 'snapshot');
    await mkdir(site);
    await writeFile(path.join(site, 'index.html'), '<h1>Archive</h1>');
    await writeFile(path.join(site, 'CNAME'), 'forum2024.diglib.org\n');
    await writeFile(path.join(site, '.nojekyll'), '');
    const result = await createSnapshot({
      siteDir: site,
      outputDir: output,
      revision: 'archive-test',
      pathPrefix: '/',
    });
    assert.equal(typeof result.archive, 'string');
    const zip = await readFile(result.archive);
    const entries = unzipSync(zip);
    assert.equal(strFromU8(entries['index.html']), '<h1>Archive</h1>');
    assert.ok(entries['.nojekyll']);
    const manifest = JSON.parse(await readFile(path.join(output, 'snapshot.json'), 'utf8'));
    assert.equal(manifest.revision, 'archive-test');
    assert.equal(manifest.pathPrefix, '/');
    assert.equal(manifest.domain, 'forum2024.diglib.org');
    for (const file of manifest.files) assert.equal(digest(entries[file.path]), file.sha256);
    assert.match(
      strFromU8(entries.SHA256SUMS),
      new RegExp(digest(entries['index.html']) + '  index.html'),
    );
    assert.match(
      await readFile(path.join(output, 'SHA256SUMS'), 'utf8'),
      new RegExp(digest(zip) + '  forum2024-archive-test.zip'),
    );
    const again = await createSnapshot({
      siteDir: site,
      outputDir: output,
      revision: 'archive-test',
    });
    assert.equal(digest(await readFile(again.archive)), digest(zip));
    await assert.rejects(
      createSnapshot({ siteDir: site, outputDir: output, revision: '../bad' }),
      /revision/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
