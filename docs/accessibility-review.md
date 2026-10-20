# Accessibility review — 2026-10-20

Reviewed the 34 archived content pages plus Search and Not Found. Corrections are applied during rendering by `scripts/lib/accessibility.mjs` and in the shared runtime/CSS. The captured HTML, original uploads, fonts, and page text remain unchanged. No accessibility widget is included.

| Area                   | Corrections                                                                                                                                                                                                                                                                                   |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landmarks and headings | Main, banner, and footer landmarks; distinguishable navigation/carousel labels; one primary accessible heading and an outline without skipped levels. Original heading tags remain for captured typography selectors; `role="heading"` and `aria-level` supply corrected levels where needed. |
| Navigation             | Separate native submenu buttons preserve parent-link navigation. Enter/Space expose children; Escape closes and returns focus. Mobile navigation continues to hide closed content from keyboard and accessibility APIs.                                                                       |
| Tabs and FAQs          | Unique IDs and scoped relationships; original tab IDs remain on the first actual elements. Desktop tabs support arrows/Home/End. Mobile controls and FAQ controls are native disclosure buttons. Mobile panels are labelled by their visible controls.                                        |
| Carousels              | Controls remain visible; rotation control comes first in keyboard order. Entering with keyboard focus stops automatic rotation until Play is requested. Reduced-motion users start paused. Paused tracks announce manual changes politely.                                                    |
| Contents               | Repaired the inherited widget selector, generated working section links, and supplied a native collapse/expand control. The list excludes subsection headings inside hidden tab panels.                                                                                                       |
| Images and links       | Added reviewed descriptions for nine filename-labelled photographs, named the Halegoua background portrait, and supplied names for the TIND logo link and program-screenshot link. Existing useful descriptions remain intact.                                                                |
| Contrast and reflow    | Darkened two blue palette values; corrected recording-link button contrast. Added focus rings with a white surround, touch spacing between resource links, and wrapping FAQ controls.                                                                                                         |

The carousel and disclosure behavior follows the [WAI carousel pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) and [WAI disclosure guidance](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

## Verification

- Axe-core 4.14.0, with WCAG 2 A/AA, WCAG 2.1 A/AA, WCAG 2.2 AA and best-practice rules enabled: **zero automated violations on all 36 pages** at desktop and narrow mobile sizes. The narrow run used a 320 CSS-pixel content width and found no horizontal page overflow.
- The initial desktop scan reported 150 page/rule violations affecting 485 nodes. These counts include repeated shared components and are not counts of distinct WCAG failures.
- Additional mobile interaction scans passed for all nine local-guide disclosure controls and the 21 expanded FAQ/sponsor controls across four pages.
- Manual browser checks covered the skip link, submenu activation/Escape/focus return, persistent carousel pause, desktop tab selection with arrow keys, mobile panel labels and selection, and contents collapse/expand.
- All generated documents have a single main landmark, a single primary accessible heading, unique IDs, and resolving ARIA references. The HTML correction is idempotent across the generated corpus.
- `pnpm check` and `pnpm check:pages` pass, including 38 regression tests, both hosting layouts, 6,254 generated references, and retained image checks.

Axe still returns manual-review items for symbolic controls, complex backgrounds, and some text/link overlaps. Symbolic controls have explicit accessible names and contrasting colors; the review also included keyboard and layout checks. Automated checks and these browser checks are not a complete WCAG conformance assessment. VoiceOver/NVDA testing, external services, videos/captions, and the accessibility of downloadable documents were outside this pass.

## Repeat the browser audit

Run `pnpm audit:a11y` and open `http://localhost:8082/`. This builds the archive and serves it through a local-only audit preview. Each page gets an expandable audit report. Open it and choose **Run audit again** after opening menus, tabs, or FAQs to test those states. Review `incomplete` results manually as well as `violations`.

The audit server, axe-core, and its report panel are development tools and are never included in the published site. Stop the server with Ctrl-C. For a repository-path preview, run `SITE_PATH_PREFIX=/archive-preview/ pnpm audit:a11y` and open `http://localhost:8082/archive-preview/`.
