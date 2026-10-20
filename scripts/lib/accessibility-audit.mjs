import { load } from 'cheerio';

// Structural checks run on every built page. Browser/axe checks remain complementary.
export function auditAccessibility(html) {
  const $ = load(html),
    errors = [],
    ids = new Map();
  $('[id]').each((_, e) => {
    const id = $(e).attr('id');
    ids.set(id, (ids.get(id) || 0) + 1);
  });
  for (const [id, count] of ids) if (count > 1) errors.push(`Duplicate ID: ${id}`);
  if ($('main,[role="main"]').length !== 1) errors.push('Expected exactly one main landmark');
  let previous = 0,
    primary = 0;
  $('h1,h2,h3,h4,h5,h6,[role="heading"]').each((_, e) => {
    const heading = $(e);
    if (['none', 'presentation'].includes(heading.attr('role'))) return;
    const level = Number(heading.attr('aria-level') || e.tagName.slice(1));
    if (!Number.isInteger(level) || level < 1 || level > 6) errors.push('Invalid heading level');
    if (level === 1) primary++;
    if (level > previous + 1) errors.push(`Heading level skips from ${previous} to ${level}`);
    previous = level;
  });
  if (primary !== 1) errors.push('Expected exactly one primary heading');
  for (const attr of ['aria-controls', 'aria-labelledby', 'aria-describedby']) {
    $(`[${attr}]`).each((_, e) => {
      for (const id of $(e).attr(attr).trim().split(/\s+/).filter(Boolean)) {
        if (!ids.has(id)) errors.push(`Unresolved ${attr}: ${id}`);
      }
    });
  }
  return errors;
}
