import { all } from './helpers.js';
export function initializeCarousels() {
  all('.elementor-image-carousel-wrapper,.elementor-main-swiper').forEach((carousel) => {
    const track = carousel.querySelector(':scope > .swiper-wrapper');
    if (!track) return;
    const slides = all(':scope > .swiper-slide', track);
    if (!slides.length) return;
    const widget = carousel.closest('[data-archive-slides]');
    const desired = Number(widget?.dataset.archiveSlides) || 1;
    carousel.style.setProperty('--archive-visible', desired);
    carousel.classList.add('archive-carousel');
    let index = 0,
      paused = matchMedia('(prefers-reduced-motion: reduce)').matches,
      hover = false;
    const count = () =>
      matchMedia('(max-width:767px)').matches ? 1 : Math.min(desired, slides.length);
    const render = () => {
      const visible = count();
      slides.forEach((s, i) => {
        const active = (i - index + slides.length) % slides.length < visible;
        s.hidden = !active;
        s.style.order = String((i - index + slides.length) % slides.length);
        s.setAttribute('aria-hidden', String(!active));
      });
    };
    const move = (step) => {
      index = (index + step + slides.length) % slides.length;
      render();
    };
    const controls = document.createElement('div');
    controls.className = 'archive-carousel-controls';
    for (const [name, text, action] of [
      ['Previous slide', '←', () => move(-1)],
      [
        'Pause slideshow',
        'Pause',
        () => {
          paused = !paused;
          pause.textContent = paused ? 'Play' : 'Pause';
          pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
        },
      ],
      ['Next slide', '→', () => move(1)],
    ]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = text;
      b.setAttribute('aria-label', name);
      b.addEventListener('click', action);
      controls.append(b);
    }
    const pause = controls.children[1];
    if (paused) {
      pause.textContent = 'Play';
      pause.setAttribute('aria-label', 'Play slideshow');
    }
    carousel.append(controls);
    carousel.addEventListener('mouseenter', () => (hover = true));
    carousel.addEventListener('mouseleave', () => (hover = false));
    carousel.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        move(1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move(-1);
      }
    });
    let touchX = 0;
    carousel.addEventListener('touchstart', (e) => (touchX = e.changedTouches[0].clientX), {
      passive: true,
    });
    carousel.addEventListener(
      'touchend',
      (e) => {
        const delta = e.changedTouches[0].clientX - touchX;
        if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
      },
      { passive: true },
    );
    const delay = Number(widget?.dataset.archiveDelay ?? 5000);
    if (delay > 0)
      setInterval(
        () => {
          if (!paused && !hover && !carousel.contains(document.activeElement) && !document.hidden)
            move(1);
        },
        Math.max(2000, delay),
      );
    window.addEventListener('resize', render);
    render();
  });
}
