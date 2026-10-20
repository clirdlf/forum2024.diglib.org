import { all, activateOnKey } from './helpers.js';
export function initializeMenus() {
  all('.elementor-widget-nav-menu').forEach((widget, index) => {
    const toggle = widget.querySelector('.elementor-menu-toggle');
    const mobile = widget.querySelector('nav.elementor-nav-menu--dropdown');
    if (toggle && mobile) {
      mobile.id ||= `archive-menu-${index}`;
      toggle.setAttribute('aria-controls', mobile.id);
      function setOpen(open) {
        if (open) {
          mobile.style.width = `${Math.max(200, window.innerWidth - 40)}px`;
          mobile.style.left = `${20 - widget.getBoundingClientRect().left}px`;
        }
        mobile.hidden = !open;
        mobile.setAttribute('aria-hidden', String(!open));
        mobile.classList.toggle('archive-mobile-open', open);
        toggle.classList.toggle('elementor-active', open);
        toggle.setAttribute('aria-expanded', String(open));
        all('a', mobile).forEach((a) => (a.tabIndex = open ? 0 : -1));
      }
      setOpen(false);
      const toggleOpen = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      toggle.addEventListener('click', toggleOpen);
      activateOnKey(toggle, toggleOpen);
      widget.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          setOpen(false);
          toggle.focus();
        }
      });
    }
    all('.menu-item-has-children', widget).forEach((item, i) => {
      const link = item.querySelector(':scope > a');
      const submenu = item.querySelector(':scope > .sub-menu');
      if (!link || !submenu) return;
      submenu.id ||= `archive-submenu-${index}-${i}`;
      const button = item.querySelector(':scope > .archive-submenu-toggle');
      if (!button) return;
      const label = link.textContent.trim();
      button.setAttribute('aria-controls', submenu.id);
      const setOpen = (open) => {
        item.classList.toggle('archive-open', open);
        button.setAttribute('aria-expanded', String(open));
        button.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} ${label} submenu`);
      };
      item.addEventListener('mouseenter', () => {
        if (window.innerWidth > 767) setOpen(true);
      });
      item.addEventListener('mouseleave', () => {
        if (!item.contains(document.activeElement)) setOpen(false);
      });
      item.addEventListener('focusout', (e) => {
        if (!item.contains(e.relatedTarget)) setOpen(false);
      });
      button.addEventListener('click', () => setOpen(!item.classList.contains('archive-open')));
      link.addEventListener('keydown', (e) => {
        if (['ArrowDown', ' '].includes(e.key)) {
          e.preventDefault();
          setOpen(true);
          submenu.querySelector('a')?.focus();
        }
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          button.focus();
        }
      });
    });
  });
}
