import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import { accessibleHtml, accessibleCss } from '../scripts/lib/accessibility.mjs';

test('rendered archive has labelled landmarks and a navigable heading outline without restyling tags', () => {
  const html =
    '<html><body><div class="elementor-location-header"><nav aria-label="Menu"></nav></div><div id="content"><h1>Page</h1><h4 class="styled">Section</h4><h1>Another section</h1></div><div class="elementor-location-footer"><nav aria-label="Menu"></nav><h4>Contact</h4></div></body></html>';
  const $ = load(accessibleHtml(html));
  assert.equal($('#content').attr('role'), 'main');
  assert.equal($('#content').attr('tabindex'), '-1');
  assert.equal($('.elementor-location-header').attr('role'), 'banner');
  assert.equal($('.elementor-location-footer').attr('role'), 'contentinfo');
  assert.deepEqual(
    $('nav')
      .map((_, e) => $(e).attr('aria-label'))
      .get(),
    ['Primary', 'Footer'],
  );
  assert.equal($('.styled')[0].tagName, 'h4');
  assert.equal($('.styled').attr('aria-level'), '2');
  assert.equal($('#content h1').last().attr('aria-level'), '2');
  assert.equal($('.elementor-location-footer h4').attr('aria-level'), '2');
  assert.equal(accessibleHtml(accessibleHtml(html)), accessibleHtml(html));
});

test('tab groups use unique local relationships and mobile disclosure buttons instead of nested tablists', () => {
  const group =
    '<div class="elementor-tabs"><div class="elementor-tabs-wrapper" role="tablist"><div class="elementor-tab-title elementor-tab-desktop-title" id="title" data-tab="1" role="tab" aria-controls="panel">Title</div></div><div class="elementor-tabs-content-wrapper" role="tablist"><div class="elementor-tab-title elementor-tab-mobile-title" data-tab="1" role="tab">Title</div><div class="elementor-tab-content" id="panel" data-tab="1" role="tabpanel" aria-labelledby="title">Panel</div></div></div>';
  const $ = load(accessibleHtml('<main><h1>Guide</h1>' + group + group + '</main>'));
  const ids = $('[id]')
    .map((_, e) => $(e).attr('id'))
    .get();
  assert.equal(ids.length, new Set(ids).size);
  assert.equal($('#panel')[0].tagName, 'div');
  assert.equal($('#panel').hasClass('elementor-tab-content'), true);
  assert.equal($('#title').hasClass('elementor-tab-desktop-title'), true);
  assert.equal($('.elementor-tabs-content-wrapper[role]').length, 0);
  assert.equal($('button.elementor-tab-mobile-title').length, 2);
  $('.elementor-tabs').each((_, group) => {
    const panel = $(group).find('.elementor-tab-content');
    const desktop = $(group).find('[role=tab]');
    assert.equal(desktop.attr('aria-controls'), panel.attr('id'));
    assert.equal(panel.attr('aria-labelledby'), desktop.attr('id'));
    assert.equal($(group).find('button').attr('aria-controls'), panel.attr('id'));
  });
});

test('disclosure headings contain native controls and invalid article list roles are repaired', () => {
  const $ = load(
    accessibleHtml(
      '<main><h1>FAQ</h1><div class="elementor-toggle"><h4 id="question" class="elementor-tab-title" role="button" aria-controls="answer" aria-expanded="false"><a tabindex="0">Question</a></h4><div id="answer" aria-labelledby="question">Answer</div></div><div role="list"><article role="listitem">Post</article></div></main>',
    ),
  );
  assert.equal($('h4[role=button]').length, 0);
  assert.equal($('h4').attr('aria-level'), '2');
  const button = $('h4 button');
  assert.equal(button.attr('aria-controls'), 'answer');
  assert.equal($('#answer').attr('aria-labelledby'), button.attr('id'));
  assert.equal(button.find('a').length, 0);
  assert.equal($('article[role=listitem]').length, 0);
  assert.equal($('article').parent().attr('role'), 'listitem');
});

test('known filename alt text and empty image-only links gain meaningful descriptions', () => {
  const $ = load(
    accessibleHtml(
      '<main><h1>Photos</h1><img src="/wp-content/uploads/sites/50/2023/12/CLIRT-11-scaled.jpg" alt="CLIRT-11"><a href="https://www.tind.io/"><img src="/wp-content/uploads/sites/50/2024/04/TIND_logo_blue_artboard.png" alt=""></a></main>',
    ),
  );
  assert.match($('img').first().attr('alt'), /attendees/i);
  assert.equal($('a img').attr('alt'), 'TIND');
});

test('contrast corrections affect known palette values and preserve photographic URLs', () => {
  const css = '.a{background-color:#467FF7;color:#fff}.b{background:#2977B7 url("/photo.jpg")}';
  const fixed = accessibleCss(css);
  assert.doesNotMatch(fixed, /#467FF7|#2977B7/i);
  assert.match(fixed, /url\("\/photo.jpg"\)/);
  assert.equal(accessibleCss(fixed), fixed);
});

test('program screenshot link describes its destination', () => {
  const $ = load(
    accessibleHtml(
      '<main><h1>Schedule</h1><a href="https://www.conftool.pro/virtualforum2024/sessions.php"><img src="/wp-content/uploads/sites/50/2024/07/programschedulescreenshot-1024x776.jpg" alt=""></a></main>',
    ),
  );
  assert.match($('img').attr('alt'), /program schedule.*ConfTool/);
});

test('peer headings retain peer levels and background-image portraits get descriptive labels', () => {
  const $ = load(
    accessibleHtml(
      '<main><h1>Title</h1><h2>Section</h2><h4>First</h4><h4>Second</h4><div role="img" aria-label="GHphoto" style="background-image:url(\'/GHphoto-scaled.jpg\')"></div></main>',
    ),
  );
  assert.deepEqual(
    $('h4')
      .map((_, e) => $(e).attr('aria-level'))
      .get(),
    ['3', '3'],
  );
  assert.equal($('[role=img]').attr('aria-label'), 'Germaine Halegoua');
});
