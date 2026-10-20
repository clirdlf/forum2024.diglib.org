export const all = (selector, root = document) => [...root.querySelectorAll(selector)];
export function activateOnKey(el, fn) {
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn(e);
    }
  });
}
