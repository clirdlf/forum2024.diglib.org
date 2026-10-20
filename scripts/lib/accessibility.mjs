import { load } from 'cheerio';

// Descriptions reviewed against the retained photographs; do not infer alt text from filenames.
const descriptions = {
  'CLIRT-11': 'Conference attendees gathering in a lobby outside the ballroom.',
  'CLIRT-66': 'Conference attendees seated at round tables in a large, sunlit hall.',
  'CLIRT-67': 'Attendees talking around a table in the conference hall.',
  'CLIRT-77': 'An attendee smiling while holding a plate in the conference hall.',
  'CLIRT-38': 'Two presenters standing behind laptops and speaking into a microphone.',
  'CLIRT-15': 'An attendee asking a question at a standing microphone.',
  'CLIRM-135': 'Two attendees discussing their work at a conference table.',
  'CLIRM-42': 'An attendee smiling in a busy conference gathering space.',
  'CLIRM-50': 'Attendees talking together around a conference table.',
  GHphoto: 'Germaine Halegoua',
  TIND_logo_blue_artboard: 'TIND',
  programschedulescreenshot: 'View the virtual DLF Forum program schedule in ConfTool',
};

export function accessibleCss(css) {
  // Preserve the palette while meeting AA contrast for cream/white text on blue.
  return css.replace(/#467ff7\b/gi, '#2458c5').replace(/#2977b7\b/gi, '#246da9');
}

export function accessibleHtml(html) {
  const $ = load(html);
  const main = $('main,[role="main"]').first().length
    ? $('main,[role="main"]').first()
    : $('#content').first();
  if (main.length) {
    if (!main.is('main')) main.attr('role', 'main');
    main.attr('tabindex', '-1');
  }
  $('.elementor-location-header').attr('role', 'banner');
  $('.elementor-location-footer').attr('role', 'contentinfo');
  $('nav').each((i, e) => {
    const nav = $(e);
    const location = nav.closest('.elementor-location-footer').length ? 'Footer' : 'Primary';
    nav.attr(
      'aria-label',
      location + (nav.hasClass('elementor-nav-menu--dropdown') ? ' mobile' : ''),
    );
  });
  $('.elementor-widget-table-of-contents').each((_, e) => {
    const widget = $(e),
      toggles = widget.find('.elementor-toc__toggle-button');
    const toggle = toggles.first();
    if (!toggle.length) return;
    toggles.slice(1).remove();
    toggle[0].tagName = 'button';
    toggle
      .attr('type', 'button')
      .removeAttr('role tabindex')
      .removeClass('elementor-toc__toggle-button--expand elementor-toc__toggle-button--collapse');
  });
  const assignedIds = new Set(
    $('[id]')
      .filter((_, e) => !$(e).closest('.elementor-tabs').length)
      .map((_, e) => $(e).attr('id'))
      .get(),
  );
  const tabId = (preferred) => {
    let id = preferred,
      n = 2;
    while (assignedIds.has(id)) id = `${preferred}-${n++}`;
    assignedIds.add(id);
    return id;
  };
  // Each widget owns its relationships, even where Elementor reused IDs.
  $('.elementor-tabs').each((i, e) => {
    const tabs = $(e);
    tabs.find('.elementor-tabs-wrapper').attr('aria-label', `Guide sections ${i + 1}`);
    tabs.find('.elementor-tabs-content-wrapper').removeAttr('role aria-orientation');
    tabs.find('.elementor-tab-content').each((_, panel) => {
      const p = $(panel),
        key = p.attr('data-tab');
      const desktop = tabs
        .find('.elementor-tab-desktop-title')
        .filter((_, t) => $(t).attr('data-tab') === key);
      const mobile = tabs
        .find('.elementor-tab-mobile-title')
        .filter((_, t) => $(t).attr('data-tab') === key);
      const panelId = tabId(p.attr('id') || `archive-tabs-${i}-panel-${key}`),
        titleId = tabId(desktop.attr('id') || `archive-tabs-${i}-tab-${key}`);
      p.attr('id', panelId).attr('aria-labelledby', titleId);
      desktop.attr('id', titleId).attr('aria-controls', panelId).removeAttr('aria-expanded');
      mobile.each((_, t) => {
        t.tagName = 'button';
      });
      mobile
        .attr('type', 'button')
        .attr('id', tabId(mobile.attr('id') || `archive-tabs-${i}-disclosure-${key}`))
        .attr('aria-controls', panelId)
        .attr('aria-expanded', 'false')
        .removeAttr('role aria-selected');
    });
  });
  $('.elementor-toggle .elementor-tab-title,.elementor-accordion .elementor-tab-title').each(
    (i, e) => {
      const title = $(e);
      if (title.find('.archive-disclosure-button').length) return;
      const button = $('<button type="button" class="archive-disclosure-button"></button>');
      button.attr('id', (title.attr('id') || `archive-disclosure-${i}`) + '-button');
      for (const attr of ['aria-controls', 'aria-expanded']) {
        if (title.attr(attr) !== undefined) button.attr(attr, title.attr(attr));
        title.removeAttr(attr);
      }
      title.removeAttr('role tabindex');
      title.find('a:not([href])').each((_, a) => {
        a.tagName = 'span';
        $(a).removeAttr('tabindex');
      });
      button.append(title.contents());
      title.append(button);
      const panelId = button.attr('aria-controls');
      $('[id]')
        .filter((_, p) => $(p).attr('id') === panelId)
        .attr('aria-labelledby', button.attr('id'));
    },
  );
  // Keep the original tags for captured CSS selectors, correcting the accessible outline.
  let previous = 0,
    hasTitle = false,
    previousOriginal = 1;
  const levels = new Map();
  $('h1,h2,h3,h4,h5,h6').each((_, e) => {
    const heading = $(e);
    const original = Number(e.tagName.slice(1));
    if (original < previousOriginal)
      for (const key of levels.keys()) if (key > original) levels.delete(key);
    let level;
    if (heading.closest('.elementor-location-footer').length) level = 2;
    else if (!hasTitle) {
      level = 1;
      hasTitle = true;
    } else level = levels.get(original) || Math.min(original === 1 ? 2 : original, previous + 1);
    if (hasTitle && level !== 1) levels.set(original, level);
    previousOriginal = original;
    if (level !== Number(e.tagName.slice(1))) {
      heading.attr('role', 'heading').attr('aria-level', level);
    }
    previous = level;
  });
  $('[role="list"] > article[role="listitem"]').each((_, e) => {
    $(e).removeAttr('role').wrap('<div role="listitem"></div>');
  });
  $('img').each((_, e) => {
    const img = $(e),
      name = (img.attr('src') || '')
        .split('/')
        .pop()
        .replace(/(?:-scaled|-\d+x\d+)?\.[^.]+$/, '');
    if (
      descriptions[name] &&
      (!img.attr('alt') || /^(?:CLIR[MTW]-\d+|GHphoto)$/.test(img.attr('alt')))
    )
      img.attr('alt', descriptions[name]);
  });
  $('[role="img"][aria-label="GHphoto"]').attr('aria-label', 'Germaine Halegoua');
  $('.elementor-image-carousel-wrapper,.elementor-main-swiper').each((i, e) => {
    const carousel = $(e);
    carousel.attr(
      'aria-label',
      carousel.hasClass('elementor-main-swiper')
        ? 'Participant feedback'
        : i === 0
          ? 'DLF Forum photographs'
          : `Sponsor logos ${i}`,
    );
  });
  // Links retain their destinations; separate native buttons disclose their submenus.
  $('.elementor-widget-nav-menu .menu-item-has-children').each((i, e) => {
    const item = $(e),
      link = item.children('a').first(),
      submenu = item.children('.sub-menu').first();
    if (!link.length || !submenu.length || item.children('.archive-submenu-toggle').length) return;
    const id = submenu.attr('id') || `archive-submenu-${i}`;
    submenu.attr('id', id);
    link.find('.sub-arrow').remove();
    link.removeAttr('aria-controls aria-expanded aria-haspopup');
    const button = $(
      '<button type="button" class="archive-submenu-toggle" aria-expanded="false"><span aria-hidden="true">▾</span></button>',
    );
    button.attr('aria-controls', id).attr('aria-label', `Show ${link.text().trim()} submenu`);
    link.after(button);
  });
  // Repeated unreferenced IDs from pasted Word/Google Docs text need no shared identity.
  const ids = new Set();
  $('[id]').each((_, e) => {
    const node = $(e),
      id = node.attr('id');
    if (ids.has(id)) {
      let n = 2;
      while (ids.has(`${id}-${n}`)) n++;
      node.attr('id', `${id}-${n}`);
    }
    ids.add(node.attr('id'));
  });
  $('[style]').each((_, e) => $(e).attr('style', accessibleCss($(e).attr('style'))));
  $('style').each((_, e) => $(e).text(accessibleCss($(e).text())));
  return $.html();
}
