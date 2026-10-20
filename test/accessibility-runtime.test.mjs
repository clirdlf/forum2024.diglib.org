import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { accessibleHtml } from '../scripts/lib/accessibility.mjs';
import { initializeMenus } from '../src/assets/runtime/navigation.js';
import { initializeCarousels } from '../src/assets/runtime/carousels.js';
import { initializeDisclosures } from '../src/assets/runtime/disclosures.js';
function dom(html, run) {
  const { window, document } = parseHTML(accessibleHtml('<html><body>' + html + '</body></html>'));
  const names = ['window', 'document', 'matchMedia', 'setInterval'];
  const original = new Map(names.map((n) => [n, globalThis[n]]));
  const intervals = [];
  Object.assign(globalThis, {
    window,
    document,
    matchMedia: () => ({ matches: false }),
    setInterval: (fn) => intervals.push(fn),
  });
  try {
    run({ window, document, intervals });
  } finally {
    for (const [n, v] of original) {
      if (v === undefined) delete globalThis[n];
      else globalThis[n] = v;
    }
  }
}
test('submenu buttons expose children without hijacking parent links and Escape closes them', () => {
  dom(
    '<div class="elementor-widget-nav-menu"><nav><ul><li class="menu-item-has-children"><a href="/about/">About</a><ul class="sub-menu"><li><a href="/team/">Team</a></li></ul></li></ul></nav></div>',
    ({ document, window }) => {
      initializeMenus();
      const button = document.querySelector('.archive-submenu-toggle');
      button.click();
      assert.equal(button.getAttribute('aria-expanded'), 'true');
      const link = document.querySelector('a');
      const click = new window.Event('click', { bubbles: true, cancelable: true });
      link.dispatchEvent(click);
      assert.equal(click.defaultPrevented, false);
      const escape = new window.Event('keydown', { bubbles: true, cancelable: true });
      escape.key = 'Escape';
      button.dispatchEvent(escape);
      assert.equal(button.getAttribute('aria-expanded'), 'false');
    },
  );
});
test('keyboard focus permanently pauses carousel rotation until explicitly resumed', () => {
  dom(
    '<div data-archive-delay="5000"><div class="elementor-image-carousel-wrapper"><div class="swiper-wrapper"><div class="swiper-slide">First</div><div class="swiper-slide">Second</div></div></div></div>',
    ({ document, window, intervals }) => {
      initializeCarousels();
      const carousel = document.querySelector('.archive-carousel'),
        slides = carousel.querySelectorAll('.swiper-slide');
      carousel.dispatchEvent(new window.Event('focusin', { bubbles: true }));
      carousel.dispatchEvent(new window.Event('focusout', { bubbles: true }));
      intervals[0]();
      assert.equal(slides[0].hidden, false);
      assert.equal(slides[1].hidden, true);
      const play = carousel.querySelector('[aria-label="Play slideshow"]');
      assert.ok(play);
      assert.equal(carousel.querySelector('button'), play);
      play.click();
      intervals[0]();
      assert.equal(slides[1].hidden, false);
    },
  );
});
test('native disclosure controls toggle once and mobile panels are labelled by their visible control', () => {
  dom(
    '<main><h1>Page</h1><div class="elementor-toggle"><h4 id="q" class="elementor-tab-title" role="button" aria-controls="a" aria-expanded="false">Question</h4><div id="a">Answer</div></div><div class="elementor-tabs"><div class="elementor-tabs-wrapper" role="tablist"><div class="elementor-tab-title elementor-tab-desktop-title" data-tab="1">Title</div></div><div class="elementor-tabs-content-wrapper"><div class="elementor-tab-title elementor-tab-mobile-title" data-tab="1">Title</div><div class="elementor-tab-content" data-tab="1">Panel</div></div></div></main>',
    ({ document }) => {
      globalThis.matchMedia = () => ({ matches: true });
      initializeDisclosures();
      const button = document.querySelector('.archive-disclosure-button');
      button.click();
      assert.equal(button.getAttribute('aria-expanded'), 'true');
      assert.equal(document.getElementById('a').hidden, false);
      const mobile = document.querySelector('.elementor-tab-mobile-title'),
        panel = document.querySelector('.elementor-tab-content');
      assert.equal(panel.getAttribute('aria-labelledby'), mobile.id);
      assert.equal(mobile.getAttribute('aria-expanded'), 'true');
      assert.equal(mobile.hasAttribute('aria-selected'), false);
    },
  );
});

test('table of contents builds heading links and its native button collapses and expands them', async () => {
  const { initializeTableOfContents } = await import('../src/assets/runtime/toc.js');
  dom(
    '<main><h1>Guide</h1><div class="elementor-widget-table-of-contents"><h4>Contents</h4><div class="elementor-toc__toggle-button elementor-toc__toggle-button--expand" role="button" aria-controls="contents"></div><div class="elementor-toc__toggle-button elementor-toc__toggle-button--collapse" role="button"></div><div class="elementor-toc__body" id="contents"></div></div><h2>Travel</h2><h2>Food</h2><div class="elementor-tab-content" hidden><h2>Hidden subsection</h2></div></main>',
    ({ document }) => {
      initializeTableOfContents();
      const toggle = document.querySelector('button.elementor-toc__toggle-button');
      assert.ok(toggle);
      assert.deepEqual(
        [...document.querySelectorAll('.elementor-toc__body a')].map((a) => a.textContent),
        ['Travel', 'Food'],
      );
      toggle.click();
      assert.equal(document.getElementById('contents').hidden, true);
      assert.equal(toggle.getAttribute('aria-expanded'), 'false');
      toggle.click();
      assert.equal(document.getElementById('contents').hidden, false);
    },
  );
});

test('mobile guide disclosure can close its active panel', () => {
  dom(
    '<main><h1>Guide</h1><div class="elementor-tabs"><div class="elementor-tabs-wrapper"><div class="elementor-tab-title elementor-tab-desktop-title" data-tab="1">News</div></div><div class="elementor-tabs-content-wrapper"><div class="elementor-tab-title elementor-tab-mobile-title" data-tab="1">News</div><div class="elementor-tab-content" data-tab="1">News text</div></div></div></main>',
    ({ document }) => {
      globalThis.matchMedia = () => ({ matches: true });
      initializeDisclosures();
      const button = document.querySelector('button.elementor-tab-mobile-title');
      button.click();
      assert.equal(button.getAttribute('aria-expanded'), 'false');
      assert.equal(document.querySelector('.elementor-tab-content').hidden, true);
    },
  );
});
