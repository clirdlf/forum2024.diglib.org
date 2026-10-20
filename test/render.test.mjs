import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { load } from 'cheerio';
import { readContent, assembleBody } from '../scripts/lib/content.mjs';
import { loadImageManifest } from '../scripts/lib/images.mjs';
import { auditAccessibility } from '../scripts/lib/accessibility-audit.mjs';
import { renderHtml } from '../scripts/lib/render.mjs';
test('complete render pipeline corrects every captured page and prefixes retained pictures after markup changes', async () => {
  const [pages, header, footer, imageManifest] = await Promise.all([
    readContent('src/content'),
    readFile('src/_includes/header.html', 'utf8'),
    readFile('src/_includes/footer.html', 'utf8'),
    loadImageManifest(),
  ]);
  let pictures = 0;
  for (const page of pages) {
    const html = `<!doctype html><html lang="en"><head>${page.head}</head><body>${assembleBody(page.body, { header, footer }, page.route)}</body></html>`;
    const output = renderHtml(html, { imageManifest, pathPrefix: '/archive-preview/' });
    const $ = load(output);
    assert.deepEqual(auditAccessibility(output), [], page.route);
    assert.equal($('a[href="/archive-preview/"]').length > 0, true, page.route);
    $('picture source').each((_, e) => {
      pictures++;
      assert.match($(e).attr('srcset'), /^\/archive-preview\/assets\/images\//);
    });
  }
  assert.equal(pages.length, 34);
  assert.ok(pictures > 0);
});
