import { all, activateOnKey } from './helpers.js';
export function initializeDisclosures() {
  all('.elementor-toggle .elementor-tab-title,.elementor-accordion .elementor-tab-title').forEach(
    (title) => {
      const content = document.getElementById(title.getAttribute('aria-controls'));
      if (!content) return;
      title.tabIndex = 0;
      all('a', title).forEach((a) => (a.tabIndex = -1));
      const setOpen = (open) => {
        title.classList.toggle('elementor-active', open);
        content.classList.toggle('elementor-active', open);
        content.hidden = !open;
        content.style.display = open ? 'block' : 'none';
        title.setAttribute('aria-expanded', String(open));
      };
      const toggle = () => setOpen(title.getAttribute('aria-expanded') !== 'true');
      setOpen(title.classList.contains('elementor-active'));
      title.addEventListener('click', toggle);
      activateOnKey(title, toggle);
    },
  );
  all('.elementor-tabs').forEach((tabs) => {
    const titles = all('.elementor-tab-title', tabs);
    const panels = all('.elementor-tab-content', tabs);
    const select = (id) => {
      titles.forEach((t) => {
        const active = t.dataset.tab === id;
        t.classList.toggle('elementor-active', active);
        t.setAttribute('aria-selected', String(active));
        t.setAttribute('aria-expanded', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      panels.forEach((p) => {
        const active = p.dataset.tab === id;
        p.hidden = !active;
        p.style.display = active ? 'block' : 'none';
        p.classList.toggle('elementor-active', active);
      });
    };
    titles.forEach((t) => {
      t.addEventListener('click', () => select(t.dataset.tab));
      t.addEventListener('keydown', (e) => {
        if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
          e.preventDefault();
          const visible = titles.filter((t) => t.getClientRects().length);
          let next =
            e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? visible.length - 1
                : (visible.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1) + visible.length) %
                  visible.length;
          select(visible[next].dataset.tab);
          visible[next].focus();
        }
        if (['Enter', ' '].includes(e.key)) {
          e.preventDefault();
          select(t.dataset.tab);
        }
      });
    });
    select(titles[0]?.dataset.tab);
  });
}
