import { load } from 'cheerio';
import { prefixUrl } from './paths.mjs';
export function searchIndex(documents, prefix = '/') {
  return JSON.stringify(
    documents
      .filter((d) => d.type !== 'archive')
      .map((d) => {
        const $ = load(d.body);
        $('header,footer,nav,.elementor-location-header,.elementor-location-footer').remove();
        return {
          title: d.sourceTitle,
          url: prefixUrl(d.route, prefix),
          text: $.text().replace(/\s+/g, ' ').trim(),
        };
      }),
  );
}
