import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

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
  await carousel.getByRole('button', { name: 'Play slideshow', exact: true }).click();
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
