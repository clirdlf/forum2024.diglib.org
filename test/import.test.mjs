import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readInventory } from '../scripts/lib/inventory.mjs';
import { localizeUrl, normalizeDocument, localizeCss } from '../scripts/lib/localize.mjs';

// These assertions catch leaking draft/admin content and breaking original paths.
test('inventory includes only published pages/posts and attachment metadata', () => {
  const xml = `<rss xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>${[
    ['page', 'publish', 'https://forum2024.diglib.org/about/team/'],
    ['post', 'publish', 'https://forum2024.diglib.org/2024/01/01/news/'],
    ['page', 'draft', 'https://forum2024.diglib.org/draft/'],
    ['wpa-stats', 'publish', 'https://forum2024.diglib.org/stats/'],
  ]
    .map(
      ([type, status, url], i) =>
        `<item><title>Page ${i}</title><link>${url}</link><wp:post_id>${i}</wp:post_id><wp:post_type>${type}</wp:post_type><wp:status>${status}</wp:status><content:encoded><![CDATA[<p>Content</p>]]></content:encoded></item>`,
    )
    .join('')}</channel></rss>`;
  const r = readInventory(xml);
  assert.deepEqual(
    r.documents.map((d) => d.path),
    ['/about/team/', '/2024/01/01/news/'],
  );
  assert.equal(r.documents[0].content, '<p>Content</p>');
});
test('URLs preserve fragments/queries and external services while localizing assets', () => {
  const m = new Map([['https://forum2024.diglib.org/wp-content/x.png', '/assets/x.png']]);
  assert.equal(
    localizeUrl('//forum2024.diglib.org/about/?view=all#team', 'https://forum2024.diglib.org/', m),
    '/about/?view=all#team',
  );
  assert.equal(
    localizeUrl('/wp-content/x.png?ver=1', 'https://forum2024.diglib.org/', m),
    '/assets/x.png',
  );
  assert.equal(
    localizeUrl('https://youtube.com/watch?v=abc', 'https://forum2024.diglib.org/', m),
    'https://youtube.com/watch?v=abc',
  );
  assert.equal(localizeUrl('#schedule', 'https://forum2024.diglib.org/about/', m), '#schedule');
});
test('normalization removes widget/runtime, preserves content, localizes CSS and responsive images', () => {
  const m = new Map([
    ['https://forum2024.diglib.org/a.jpg', '/assets/a.jpg'],
    ['https://forum2024.diglib.org/b.jpg', '/assets/b.jpg'],
  ]);
  const r = normalizeDocument(
    `<html><head><title>Example</title><script src="/wp.js"></script></head><body class="elementor-page"><div id="pojo-a11y-toolbar">Tools</div><main id="content"><a href="https://forum2024.diglib.org/about/#team">Team</a><img src="/a.jpg" srcset="/a.jpg 400w, /b.jpg 800w"><div style="background:url('/b.jpg')">Visible</div></main></body></html>`,
    'https://forum2024.diglib.org/example/',
    m,
  );
  assert.equal(r.route, '/example/');
  assert.match(r.body, /\/assets\/a.jpg 400w, \/assets\/b.jpg 800w/);
  assert.match(r.body, /href="\/about\/#team"/);
  assert.match(r.body, /\/assets\/b.jpg/);
  assert.doesNotMatch(r.body, /pojo-a11y/);
  assert.doesNotMatch(r.head, /<script/);
  assert.match(r.body, /Visible/);
});
test('CSS localizes relative background images and fonts', () => {
  const m = new Map([['https://forum2024.diglib.org/fonts/a.woff2', '/assets/font.woff2']]);
  assert.equal(
    localizeCss(
      '@font-face{src:url(../fonts/a.woff2)}',
      'https://forum2024.diglib.org/css/style.css',
      m,
    ),
    '@font-face{src:url("/assets/font.woff2")}',
  );
});
test('responsive URLs retain non-ASCII filename spaces and carousel presentation settings', () => {
  const url = 'https://forum2024.diglib.org/2024/Logo\u202fPM.png';
  const map = new Map([[new URL(url).href, '/assets/logo.png']]);
  const r = normalizeDocument(
    `<html><body><img srcset="${url} 300w, ${url} 600w"><div class="elementor-widget-image-carousel" data-settings='{"slides_to_show":"4","autoplay":"yes","autoplay_speed":5000}'></div></body></html>`,
    'https://forum2024.diglib.org/',
    map,
  );
  assert.match(r.body, /\/assets\/logo.png 300w, \/assets\/logo.png 600w/);
  assert.match(r.body, /data-archive-slides="4"/);
});
test('Cloudflare email protection becomes a single functional mailto link', () => {
  const r = normalizeDocument(
    '<html><body><a href="/cdn-cgi/l/email-protection#abc"><span data-cfemail="016041632f626e6c">[email protected]</span></a></body></html>',
    'https://forum2024.diglib.org/',
    new Map(),
  );
  assert.doesNotMatch(r.body, /cdn-cgi|cfemail/);
  assert.equal((r.body.match(/<a /g) || []).length, 1);
  assert.match(r.body, /mailto:a@b.com/);
});
test('protected email buttons and skip links work without plugin scripts', () => {
  const r = normalizeDocument(
    '<html><body><a href="#content">Skip</a><div data-elementor-type="wp-page"><h2>Rates</h2><a href="/cdn-cgi/l/email-protection#016041632f626e6c">Email us</a></div></body></html>',
    'https://forum2024.diglib.org/',
    new Map(),
  );
  assert.match(r.body, /id="content"/);
  assert.match(r.body, /href="mailto:a@b.com"/);
  assert.match(r.body, /Email us/);
});
test('counters retain their final numbers in the static archive', () => {
  const r = normalizeDocument(
    '<html><body><span class="elementor-counter-number" data-to-value="1250" data-delimiter=",">0</span></body></html>',
    'https://forum2024.diglib.org/',
    new Map(),
  );
  assert.match(r.body, />1,250<\/span>/);
});
test('static backgrounds bypass the removed Elementor lazyload observer', () => {
  const r = normalizeDocument(
    '<html><body><div class="e-con e-parent"><h2>Visible background</h2></div></body></html>',
    'https://forum2024.diglib.org/',
    new Map(),
  );
  assert.match(r.body, /class="e-con e-parent e-lazyloaded"/);
});
