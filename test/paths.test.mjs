import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prefixHtml, prefixCss, normalizePrefix } from '../scripts/lib/paths.mjs';
import { searchIndex } from '../scripts/lib/search.mjs';
test('Pages prefix rewrites HTML, inline CSS, responsive images, and form actions exactly once', () => {
  const source =
    '<a href="/about/#team">About</a><a href="https://example.com/">External</a><img src="/a.png" srcset="/a.png 1x, /b.png 2x"><form action="/search/"></form><div style="background:url(/a.png)"></div>';
  const output = prefixHtml(source, '/repo/');
  assert.match(output, /href="\/repo\/about\/#team"/);
  assert.match(output, /https:\/\/example.com/);
  assert.match(output, /\/repo\/a.png 1x, \/repo\/b.png 2x/);
  assert.match(output, /action="\/repo\/search\/"/);
  assert.match(output, /url\(&quot;\/repo\/a.png&quot;\)/);
  assert.equal(
    prefixCss('a{background:url(/a.png)}', '/repo/'),
    'a{background:url("/repo/a.png")}',
  );
  assert.equal(normalizePrefix('repo'), '/repo/');
  assert.throws(() => normalizePrefix('https://example.com/'));
});
test('search index uses the same Pages prefix and normalizes whitespace', () => {
  const json = searchIndex(
    [
      {
        sourceTitle: 'About',
        route: '/about/',
        body: '<header>Ignore</header><main> Words\n\n and   more </main>',
      },
    ],
    '/repo/',
  );
  assert.deepEqual(JSON.parse(json), [
    { title: 'About', url: '/repo/about/', text: 'Words and more' },
  ]);
});
test('repository names matching original routes still receive their deployment prefix', () => {
  assert.match(prefixHtml('<a href="/about/">About</a>', '/about/'), /href="\/about\/about\/"/);
  assert.equal(
    JSON.parse(
      searchIndex([{ sourceTitle: 'About', route: '/about/', body: 'About' }], '/about/'),
    )[0].url,
    '/about/about/',
  );
});
test('repeated stylesheet builds read unprefixed source and cannot accumulate prefixes', async () => {
  const { mkdtemp, writeFile, readFile, rm } = await import('node:fs/promises');
  const { default: os } = await import('node:os');
  const { default: path } = await import('node:path');
  const { writePrefixedCss } = await import('../scripts/lib/paths.mjs');
  const root = await mkdtemp(path.join(os.tmpdir(), 'dlf-css-'));
  try {
    const source = path.join(root, 'source.css'),
      output = path.join(root, 'output.css');
    await writeFile(source, 'a{background:url(/about/image.png)}');
    await writePrefixedCss(source, output, '/about/');
    const first = await readFile(output, 'utf8');
    assert.match(first, /\/about\/about\/image.png/);
    await writePrefixedCss(source, output, '/about/');
    assert.equal(await readFile(output, 'utf8'), first);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
