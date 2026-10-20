export async function initializeSearch() {
  const form = document.getElementById('archive-search');
  if (!form) return;
  const input = form.elements.q,
    status = document.getElementById('search-status'),
    results = document.getElementById('search-results');
  let index;
  try {
    index = await fetch(new URL('../../search-index.json', import.meta.url)).then((r) => r.json());
  } catch {
    status.textContent = 'Search could not load. Please reload this page.';
    return;
  }
  const search = () => {
    const query = input.value.trim();
    const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    results.replaceChildren();
    if (!terms.length) {
      status.textContent = 'Enter a word or phrase to search the archive.';
      return;
    }
    const found = index.filter((d) =>
      terms.every((t) => (d.title + ' ' + d.text).toLocaleLowerCase().includes(t)),
    );
    status.textContent = `${found.length} ${found.length === 1 ? 'result' : 'results'} for “${query}”`;
    found.forEach((d) => {
      const li = document.createElement('li'),
        a = document.createElement('a'),
        p = document.createElement('p');
      a.href = d.url;
      a.textContent = d.title;
      const pos = Math.max(0, d.text.toLocaleLowerCase().indexOf(terms[0]) - 70);
      p.textContent = (pos ? '…' : '') + d.text.slice(pos, pos + 240) + '…';
      li.append(a, p);
      results.append(li);
    });
  };
  input.value =
    new URLSearchParams(location.search).get('q') ||
    new URLSearchParams(location.search).get('s') ||
    '';
  search();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    history.replaceState(null, '', '?q=' + encodeURIComponent(input.value));
    search();
  });
}
