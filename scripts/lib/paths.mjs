import { readFile, writeFile } from 'node:fs/promises';
import { load } from 'cheerio';
export function normalizePrefix(value = '/') {
  if (!value) return '/';
  const parts = value.split('/').filter(Boolean);
  if (parts.some((p) => !/^[-\w.~]+$/.test(p) || p === '.' || p === '..'))
    throw Error('Invalid site path prefix: ' + value);
  return '/' + parts.join('/') + (parts.length ? '/' : '');
}
export function prefixUrl(value, prefix = '/') {
  prefix = normalizePrefix(prefix);
  if (prefix === '/' || !value || !/^\/(?!\/)/.test(value)) return value;
  return prefix + value.slice(1);
}
export function prefixCss(css, prefix) {
  return css.replace(
    /url\(\s*(['"]?)(.*?)\1\s*\)/gi,
    (_, q, value) => `url("${prefixUrl(value, prefix)}")`,
  );
}
export function prefixHtml(html, prefix) {
  prefix = normalizePrefix(prefix);
  if (prefix === '/') return html;
  const isDocument = /<!doctype|<html[\s>]/i.test(html);
  const $ = load(html, null, isDocument);
  $('*').each((_, el) => {
    for (const attr of ['href', 'src', 'poster', 'action', 'data-src', 'xlink:href']) {
      const v = $(el).attr(attr);
      if (v) $(el).attr(attr, prefixUrl(v, prefix));
    }
    for (const attr of ['srcset', 'data-srcset']) {
      const v = $(el).attr(attr);
      if (v)
        $(el).attr(
          attr,
          v
            .split(',')
            .map((candidate) => {
              const [url, ...descriptor] = candidate.trim().split(/[ \t\n\r\f]+/);
              return [prefixUrl(url, prefix), ...descriptor].join(' ');
            })
            .join(', '),
        );
    }
    if ($(el).attr('style')) $(el).attr('style', prefixCss($(el).attr('style'), prefix));
  });
  $('style').each((_, el) => $(el).html(prefixCss($(el).html(), prefix)));
  return $.html();
}

// Rebuild from source, never from previously prefixed output.
export async function writePrefixedCss(source, output, prefix) {
  await writeFile(output, prefixCss(await readFile(source, 'utf8'), prefix));
}
