import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';

export function clearNavigationState(html) {
  const $ = load(html, null, false);
  $('[class]').each((_, el) => {
    const classes = ($(el).attr('class') || '')
      .split(/\s+/)
      .filter(
        (c) => c && !/^current[-_]|^page-item-\d+$|^page_item$|^elementor-item-active$/.test(c),
      );
    $(el).attr('class', classes.join(' '));
  });
  $('[aria-current]').removeAttr('aria-current');
  $('.hbspt-form:empty').remove();
  $('[fetchpriority]').removeAttr('fetchpriority');
  return $.html();
}
export function splitDocument(document) {
  const $ = load(document.body, null, false);
  const header = $('.elementor-location-header').first();
  const footer = $('.elementor-location-footer').first();
  const shared = {
    header: clearNavigationState(header.toString()),
    footer: clearNavigationState(footer.toString()),
  };
  if (!shared.header || !shared.footer) throw Error('Missing shared layout in ' + document.route);
  header.replaceWith('<!-- archive:header -->');
  footer.replaceWith('<!-- archive:footer -->');
  return { ...shared, page: { ...document, body: $.html() } };
}
export function activeNavigation(html, route) {
  const $ = load(clearNavigationState(html), null, false);
  $('nav a[href]').each((_, el) => {
    if ($(el).attr('href') === route) {
      $(el).attr('aria-current', 'page').addClass('elementor-item-active');
      $(el).parent('li').addClass('current-menu-item');
    }
  });
  return $.html();
}
export function assembleBody(body, shared, route) {
  return body
    .replace('<!-- archive:header -->', activeNavigation(shared.header, route))
    .replace('<!-- archive:footer -->', activeNavigation(shared.footer, route));
}
export async function readContent(directory) {
  const pages = [];
  async function walk(dir) {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
      a.name.localeCompare(b.name),
    )) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (entry.name === 'page.json') {
        const metadata = JSON.parse(await readFile(file, 'utf8'));
        pages.push({
          ...metadata,
          head: await readFile(path.join(dir, 'head.html'), 'utf8'),
          body: await readFile(path.join(dir, 'body.html'), 'utf8'),
        });
      }
    }
  }
  await walk(directory);
  return pages.sort((a, b) => a.route.localeCompare(b.route));
}
