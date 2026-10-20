import { all } from './helpers.js';
export function initializeTableOfContents() {
  all('.elementor-widget-table-of-contents').forEach((toc) => {
    const body = toc.querySelector('.elementor-toc__body');
    const toggle = toc.querySelector('.elementor-toc__toggle-button');
    if (!body) return;
    body.replaceChildren();
    const list = document.createElement('ul');
    const main = document.querySelector('main,[role="main"]');
    all('h1,h2,h3,h4,h5,h6', main || document)
      .filter(
        (h) =>
          !toc.contains(h) &&
          !h.closest('.elementor-tab-content') &&
          [2, 3].includes(Number(h.getAttribute('aria-level') || h.tagName.slice(1))),
      )
      .forEach((h, i) => {
        h.id ||= `archive-section-${i}`;
        const li = document.createElement('li'),
          a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        li.append(a);
        list.append(li);
      });
    body.append(list);
    if (toggle) {
      toggle.setAttribute('aria-controls', body.id);
      const setOpen = (open) => {
        body.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', `${open ? 'Close' : 'Open'} table of contents`);
      };
      setOpen(true);
      toggle.addEventListener('click', () => setOpen(body.hidden));
    }
  });
}
