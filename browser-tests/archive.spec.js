import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

test('dropdown labels fit their panels and stay inside the viewport', async ({
  page,
  isMobile,
}) => {
  for (const width of isMobile ? [390, 320] : [1280, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator('.elementor-location-header');
    if (isMobile)
      await header.getByRole('button', { name: 'Menu Toggle', exact: true }).press('Enter');
    for (const toggle of await header.locator('.archive-submenu-toggle:visible').all()) {
      await toggle.press('Enter');
      const submenu = page.locator('#' + (await toggle.getAttribute('aria-controls')));
      await expect(submenu).toBeVisible();
      const layout = await submenu.evaluate((panel) => {
        const bounds = panel.getBoundingClientRect();
        return {
          left: bounds.left,
          right: bounds.right,
          viewport: document.documentElement.clientWidth,
          overflowing: [...panel.querySelectorAll('a')]
            .filter((link) => link.scrollWidth > link.clientWidth + 1)
            .map((link) => link.textContent.trim()),
        };
      });
      expect(layout.overflowing, `labels at ${width}px`).toEqual([]);
      expect(layout.left).toBeGreaterThanOrEqual(0);
      expect(layout.right).toBeLessThanOrEqual(layout.viewport);
      await toggle.press('Escape');
    }
  }
});

test('submenu buttons preserve links and return keyboard focus on Escape', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const header = page.locator('.elementor-location-header');
  if (isMobile)
    await header.getByRole('button', { name: 'Menu Toggle', exact: true }).press('Enter');
  const controls = await header
    .getByRole('button', { name: 'Show About submenu', exact: true })
    .getAttribute('aria-controls');
  const toggle = header.locator(`button[aria-controls="${controls}"]`);
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const submenu = page.locator('#' + (await toggle.getAttribute('aria-controls')));
  await expect(submenu.getByRole('link', { name: 'The Team', exact: true })).toBeVisible();
  await toggle.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await expect(header.getByRole('link', { name: 'About', exact: true })).toHaveAttribute(
    'href',
    '/about/',
  );
});

test('guide tabs and mobile disclosures select and label the correct panel', async ({
  page,
  isMobile,
}) => {
  await page.goto('/resources/local-guide/');
  const group = page.locator('.elementor-tabs').first();
  if (isMobile) {
    const local = group.getByRole('button', { name: 'Local News', exact: true });
    await local.press('Enter');
    await expect(local).toHaveAttribute('aria-expanded', 'false');
    const history = group.getByRole('button', { name: /East Lansing History/i });
    await history.press('Enter');
    const panel = page.locator('#' + (await history.getAttribute('aria-controls')));
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('aria-labelledby', await history.getAttribute('id'));
  } else {
    const local = group.getByRole('tab', { name: 'Local News', exact: true });
    await local.press('End');
    await expect(group.getByRole('tab', { name: /East Lansing History/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.keyboard.press('ArrowLeft');
    await expect(local).toBeFocused();
    await expect(local).toHaveAttribute('aria-selected', 'true');
  }
  const contents = page.locator('.elementor-toc__toggle-button');
  await expect(contents).toHaveAccessibleName('Close table of contents');
  await contents.press('Enter');
  await expect(page.locator('.elementor-toc__body')).toBeHidden();
  await expect(contents).toHaveAccessibleName('Open table of contents');
  await contents.press('Enter');
  await expect(page.locator('.elementor-toc__body')).toBeVisible();
});

test('FAQ supports native keyboard activation', async ({ page }) => {
  await page.goto('/conference-platform/');
  const toggle = page.locator('.archive-disclosure-button').first();
  const panel = page.locator('#' + (await toggle.getAttribute('aria-controls')));
  await toggle.press('Space');
  await expect(panel).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.press('Space');
  await expect(panel).toBeHidden();
});

test('carousel keyboard focus stops rotation until Play is requested', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const carousel = page.locator('.archive-carousel').first();
  const next = carousel.getByRole('button', { name: 'Next slide', exact: true });
  await next.focus();
  await expect(carousel.getByRole('button').first()).toHaveAccessibleName('Play slideshow');
  await expect(carousel.locator('.archive-carousel-controls')).toHaveCSS('opacity', '1');
  await next.press('Enter');
  const current = carousel.locator('.swiper-slide:not([hidden])').first();
  const label = await current.getAttribute('aria-label');
  expect(label).toBeTruthy();
  const outside = page.locator('main,[role="main"]');
  await outside.focus();
  await expect(outside).toBeFocused();
  await page.clock.fastForward(30000);
  await expect(current).toHaveAttribute('aria-label', label);
  // A pointer click would leave hover-pause active even after keyboard focus moves away.
  await carousel.getByRole('button', { name: 'Play slideshow', exact: true }).press('Enter');
  await expect(carousel.getByRole('button').first()).toHaveAccessibleName('Pause slideshow');
  await outside.focus();
  await expect(outside).toBeFocused();
  await page.clock.fastForward(30000);
  await expect(current).not.toHaveAttribute('aria-label', label);
});

for (const route of ['/', '/resources/local-guide/', '/conference-platform/'])
  test(`axe smoke: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => {
      await document.fonts.ready;
      return (
        await window.axe.run(document, {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
          },
        })
      ).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }));
    });
    expect(violations).toEqual([]);
  });
