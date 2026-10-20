import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { auditSite } from '../scripts/lib/audit.mjs';
test('audit checks imported browser modules and search-result URLs', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dlf-modules-'));
  try {
    await mkdir(path.join(root, 'assets'));
    await writeFile(
      path.join(root, 'index.html'),
      '<script type="module" src="/assets/app.js"></script>',
    );
    await writeFile(path.join(root, 'assets/app.js'), "import './missing.js';");
    await writeFile(
      path.join(root, 'search-index.json'),
      JSON.stringify([{ url: '/missing-page/' }]),
    );
    const r = await auditSite(root, { documents: [{ path: '/' }], assets: [] });
    assert.ok(r.errors.some((e) => e.includes('missing.js')));
    assert.ok(r.errors.some((e) => e.includes('missing-page')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
