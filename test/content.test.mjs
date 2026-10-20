import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { splitDocument, assembleBody } from '../scripts/lib/content.mjs';

test('shared chrome is extracted while page content and active navigation survive assembly', () => {
  const doc = {
    title: 'About',
    route: '/about/',
    bodyClasses: 'page',
    body: '<a href="#content">Skip</a><header class="elementor-location-header"><nav><a class="elementor-item elementor-item-active" aria-current="page" href="/">Home</a><a class="elementor-item" href="/about/">About</a></nav></header><main id="content"><h1>About</h1></main><footer class="elementor-location-footer">Contact</footer>',
  };
  const result = splitDocument(doc);
  assert.doesNotMatch(result.page.body, /Contact|<header/);
  assert.match(result.page.body, /archive:header/);
  assert.match(result.page.body, /<h1>About/);
  const $ = load(assembleBody(result.page.body, result, doc.route));
  assert.equal($('header').length, 1);
  assert.equal($('footer').length, 1);
  assert.equal($('a[aria-current="page"]').attr('href'), '/about/');
  assert.equal($('a[href="/"]').hasClass('elementor-item-active'), false);
});
