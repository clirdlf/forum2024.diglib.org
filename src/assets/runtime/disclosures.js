import { all } from './helpers.js';
export function initializeDisclosures() {
  all('.archive-disclosure-button').forEach((title) => {
    const content = document.getElementById(title.getAttribute('aria-controls'));
    if (!content) return;
    title.tabIndex = 0;
    const setOpen = (open) => {
      title.closest('.elementor-tab-title').classList.toggle('elementor-active', open);
      content.classList.toggle('elementor-active', open);
      content.hidden = !open;
      content.style.display = open ? 'block' : 'none';
      title.setAttribute('aria-expanded', String(open));
    };
    const toggle = () => setOpen(title.getAttribute('aria-expanded') !== 'true');
    setOpen(title.closest('.elementor-tab-title').classList.contains('elementor-active'));
    title.addEventListener('click', toggle);
  });
  all('.elementor-tabs').forEach((tabs) => {
    const titles = all('.elementor-tab-title', tabs);
    const panels = all('.elementor-tab-content', tabs);
    const select = (id) => {
      titles.forEach((t) => {
        const active = t.dataset.tab === id;
        t.classList.toggle('elementor-active', active);
        const mobile = t.classList.contains('elementor-tab-mobile-title');
        t.setAttribute(mobile ? 'aria-expanded' : 'aria-selected', String(active));
        t.tabIndex = mobile || active ? 0 : -1;
      });
      panels.forEach((p) => {
        const active = p.dataset.tab === id;
        p.hidden = !active;
        p.style.display = active ? 'block' : 'none';
        p.classList.toggle('elementor-active', active);
        const mobile = matchMedia('(max-width:767px)').matches;
        const title = titles.find(
          (t) =>
            t.dataset.tab === id &&
            t.classList.contains(
              mobile ? 'elementor-tab-mobile-title' : 'elementor-tab-desktop-title',
            ),
        );
        if (active && title) p.setAttribute('aria-labelledby', title.id);
      });
    };
    const activate = (t) =>
      select(
        t.classList.contains('elementor-tab-mobile-title') &&
          t.getAttribute('aria-expanded') === 'true'
          ? undefined
          : t.dataset.tab,
      );
    titles.forEach((t) => {
      t.addEventListener('click', () => activate(t));
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
          activate(t);
        }
      });
    });
    select(titles[0]?.dataset.tab);
    window.addEventListener('resize', () =>
      select(
        titles.find((t) => t.classList.contains('elementor-active'))?.dataset.tab ||
          (matchMedia('(max-width:767px)').matches ? undefined : titles[0]?.dataset.tab),
      ),
    );
  });
}
