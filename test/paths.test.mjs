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
  assert.equal(prefixHtml(output, '/repo/'), output);
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
