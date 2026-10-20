import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { auditSite } from '../scripts/lib/audit.mjs';
test('audit resolves relative output roots and checks local links/assets and remote dependencies', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dlf-audit-'));
  try {
    await mkdir(path.join(dir, 'nested'));
    await writeFile(
      path.join(dir, 'index.html'),
      '<main id="content"><a href="/nested/#ok">Nested</a><img src="/logo.svg"></main>',
    );
    await writeFile(path.join(dir, 'nested/index.html'), '<h1 id="ok">Page</h1>');
    await writeFile(path.join(dir, 'logo.svg'), '<svg/>');
    const manifest = {
      documents: [{ path: '/' }, { path: '/nested/' }],
      assets: [],
    };
    const good = await auditSite(path.relative(process.cwd(), dir), manifest);
    assert.deepEqual(good.errors, []);
    assert.deepEqual(good.warnings, []);
    await writeFile(
      path.join(dir, 'index.html'),
      '<img src="https://example.com/logo.png"><a href="/missing/">Missing</a>',
    );
    const bad = await auditSite(dir, manifest);
    assert.ok(bad.errors.some((e) => e.includes('Remote rendering dependency')));
    assert.ok(bad.errors.some((e) => e.includes('/missing/')));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('audit rejects directories without an index and broken fragments', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dlf-audit-'));
  try {
    await mkdir(path.join(dir, 'empty'));
    await writeFile(
      path.join(dir, 'index.html'),
      '<a href="/empty/">Empty</a><a href="#missing">Anchor</a>',
    );
    const result = await auditSite(dir, {
      documents: [{ path: '/' }],
      assets: [],
    });
    assert.ok(result.errors.some((e) => e.includes('/empty/')));
    assert.ok(result.errors.some((e) => e.includes('#missing')));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test('audit maps the deployment prefix and rejects URLs escaping it', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'dlf-prefix-'));
  try {
    await writeFile(
      path.join(dir, 'index.html'),
      '<a href="/archive/">Home</a><img src="/archive/logo.svg">',
    );
    await writeFile(path.join(dir, 'logo.svg'), '<svg/>');
    const result = await auditSite(
      dir,
      { documents: [{ path: '/' }], assets: [] },
      { pathPrefix: '/archive/' },
    );
    assert.deepEqual(result.errors, []);
    await writeFile(path.join(dir, 'index.html'), '<img src="/logo.svg">');
    const bad = await auditSite(
      dir,
      { documents: [{ path: '/' }], assets: [] },
      { pathPrefix: '/archive/' },
    );
    assert.ok(bad.errors.some((e) => e.includes('prefix')));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
