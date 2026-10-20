import { all } from './helpers.js';
export function initializeTableOfContents() {
  all('.elementor-toc').forEach((toc) => {
    const body = toc.querySelector('.elementor-toc__body');
    if (!body) return;
    body.replaceChildren();
    const list = document.createElement('ul');
    all('main h2,main h3,#content h2,#content h3')
      .filter((h) => !toc.contains(h))
      .forEach((h, i) => {
        h.id ||= `section-${i}`;
        const li = document.createElement('li'),
          a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        li.append(a);
        list.append(li);
      });
    body.append(list);
  });
}
