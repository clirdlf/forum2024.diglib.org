# DLF Forum 2024 Static Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution, or superpowers:subagent-driven-development if the user selects delegated execution. Track progress with the checkboxes below.

**Goal:** Deliver a faithful, self-contained Eleventy archive of the published DLF Forum 2024 website, served locally using `pnpm dev`.

**Architecture:** A one-time import reads the WordPress XML inventory, captures public page markup and required styles, and extracts referenced uploads from the supplied tar archive. Committed local source and assets feed Eleventy; builds never contact WordPress. A small local browser runtime supplies interactions that originally depended on WordPress plugins.

**Tech Stack:** Node.js 22 or newer, pnpm, Eleventy 3, JavaScript ES modules, an XML parser, an HTML parser, original site CSS, and local browser JavaScript. Select exact dependency versions at installation and commit `pnpm-lock.yaml`.

**Spec:** `docs/superpowers/specs/2026-10-20-static-archive-design.md`

## Global Constraints

- Use pnpm for package management and `pnpm dev` for local preview.
- Preserve all 25 published pages and 9 published news posts, including their existing paths.
- Keep the original export and uploads archive intact.
- Use the images supplied in `site50-uploads-20261020.tar.gz`.
- Site pages, images, fonts, styles, and downloadable uploads work without internet access.
- External services remain linked; publication or deployment is outside this task.
- Remove the WordPress accessibility toolbar/widget while preserving ordinary accessibility features.
- Eleventy emits `_site/` using local source files without network access.

## Review Focus

- Nested and dated paths, fragments, and encoded URLs must resolve locally without losing meaningful query strings.
- CSS background images, font URLs, and responsive image variants must be localized as well as ordinary image sources.
- Hidden animated content must remain visible when WordPress scripts are removed.
- Published pages absent from navigation must still be generated; drafts and administrative data must stay excluded.
- Replaced menus, tabs, accordions, and search must remain keyboard operable on mobile and desktop.

## File Structure

- `package.json`, `pnpm-lock.yaml`, `.gitignore`, `eleventy.config.js`: dependency and build configuration.
- `scripts/lib/inventory.mjs`: published document and attachment inventory from XML.
- `scripts/lib/localize.mjs`: URL mapping and HTML/CSS normalization.
- `scripts/import.mjs`: one-time capture and asset extraction orchestration.
- `data/archive-manifest.json`: route, source, asset, and capture provenance records, without author emails or administrative metadata.
- `src/_data/archive.json`: normalized document data with title, route, body classes, head markup, and body markup.
- `src/_includes/document.njk`, `src/pages.njk`: document shell and paginated Eleventy generation, one output per route.
- `src/assets/`: referenced uploads, styles, fonts, icons, and browser scripts.
- `src/assets/archive.js`, `src/assets/archive.css`: replacement interactions and narrowly scoped compatibility styles.
- `src/search.njk`, `src/404.njk`: local search and fallback page.
- `scripts/verify.mjs`: generated route, link, asset, widget-removal, and external dependency checks.
- `test/import.test.mjs`: focused inventory and localization tests with inline fixtures.
- `README.md`: setup, commands, sources, scope, and verification notes.

### Task 1: Import published documents and local assets

**Interfaces:**

- `readInventory(xml: string) -> {documents: Array<{id, title, url, path, type, content}>, attachments: Array<{url, path}>}` in `scripts/lib/inventory.mjs`.
- `localizeUrl(value: string, baseUrl: string, assetMap: Map<string,string>) -> string` in `scripts/lib/localize.mjs`.
- `normalizeDocument(html: string, pageUrl: string, assetMap: Map<string,string>) -> {title, route, bodyClasses, head, body}` in the same module.
- Import emits `src/_data/archive.json`, `src/assets/`, and `data/archive-manifest.json` for later tasks.

- [x] Write failing `node:test` cases in `test/import.test.mjs`: include published pages/posts, exclude drafts and administrative records, preserve nested/dated paths, and rewrite absolute and protocol-relative same-site links, fragments, CSS URLs, and `srcset` candidates.
- [x] Run `node --test test/import.test.mjs`; confirm failure because importer modules are absent.
- [x] Create package/configuration files and install dependencies with pnpm. Ignore `node_modules/`, `_site/`, temporary extraction/capture directories, and the supplied tar archive. Retain the XML input.
- [x] Implement the inventory and URL interfaces. Keep external service URLs unchanged. Reject archive paths that escape the selected extraction directory.
- [x] Implement `scripts/import.mjs`: use the XML inventory as the authoritative document list; fetch public markup/styles only during import; inspect public links for news pagination and categories; extract referenced upload files from the supplied tar; capture required CSS/fonts/icons and transitive CSS dependencies. Record capture failures instead of silently omitting documents.
- [x] Normalize documents: remove widget/administrative/tracking resources, decode protected email links, localize references, and retain styling classes and meaningful page structure. Capture external form/video destinations for the replacement runtime.
- [x] Run the focused tests and importer. Confirm all 34 published documents are present, referenced images come from the supplied archive, and missing source resources are enumerated.
- [x] Commit the importer, focused tests, manifest, and retained local source/assets; exclude temporary captures and the large tar input.

### Task 2: Generate the complete archive with Eleventy

**Interfaces:**

- `src/_data/archive.json` is an array of the normalized document objects produced by Task 1.
- `src/pages.njk` paginates this array with page size one and uses each document's `route` as its permalink.
- `pnpm build` invokes Eleventy; `pnpm dev` invokes Eleventy with local serving; `pnpm verify` invokes the output verifier.

- [x] Add a failing route verification in `scripts/verify.mjs`: every inventory document must have a generated HTML file under `_site/` at its expected path.
- [x] Run verification against the absent build; confirm it reports missing outputs.
- [x] Create Eleventy configuration, document shell, and page generation template. Use preserved head/body markup without escaping trusted captured content. Pass through referenced assets. Exclude scripts and source-only files from generated output.
- [x] Generate local search data from published titles and visible content; remove source metadata and script/style text. Implement `src/search.njk` with a labelled query input and local results. Add `src/404.njk` with a home link.
- [x] Run `pnpm build` and `pnpm verify`; confirm every published route and required auxiliary route exists and resolves locally.
- [x] Commit the generator and search source.

### Task 3: Restore interactive behavior and visual fidelity

**Interfaces:**

- `src/assets/archive.js` initializes controls from the retained original markup and uses local data/libraries only.
- `src/assets/archive.css` contains scoped compatibility rules for removed plugin initialization and replacement controls; original styles remain the visual foundation.

- [x] Inspect the actual retained controls and select representative original desktop/mobile pages: home, resources for attendees, in-person program, featured speakers, and news.
- [x] Implement navigation dropdowns/mobile toggles with keyboard activation, Escape dismissal, focus indication, and accurate `aria-expanded` state.
- [x] Implement the carousels, tabs, accordions, in-page links, and search present in the captured content. Use a local carousel library only if necessary; ensure slide content remains visible before initialization and avoid duplicate active instances.
- [x] Replace external service embeds/forms with their captured destination links as needed. Preserve video poster/thumbnail presentation and a clear external video link. Remove any remaining dependency on WordPress AJAX.
- [x] Compare representative desktop and mobile screenshots against the original. Exercise controls with pointer and keyboard; confirm that removing entrance animations does not hide content and that mobile menus fit the viewport.
- [x] Correct observed visual or behavior differences and document any unavailable resources or external service limitations.
- [x] Commit the runtime and visual adjustments.

### Task 4: Validate and document the deliverable

**Interfaces:**

- `pnpm verify` exits nonzero for missing expected routes, missing local assets, broken internal page links, retained accessibility widget resources, or unintended remote rendering dependencies. External navigation destinations are allowed.
- README commands match `package.json` exactly.

- [x] Extend `scripts/verify.mjs` to inspect generated HTML and CSS: links, encoded paths, fragments, CSS URLs, responsive image candidates, remote asset references, widget signatures, forms targeting WordPress, and excluded draft/admin records. Report a concise summary and actionable failures.
- [x] Run `node --test`, `pnpm build`, and `pnpm verify`. Resolve failures and repeat only the affected checks after changes.
- [x] Serve with `pnpm dev`; check HTTP responses for representative nested/dated routes and inspect the browser's requests for unintended remote resources. Confirm the static build and ordinary page rendering do not require network access.
- [x] Complete browser checks of mobile navigation, dropdowns, carousels, tabs, accordions, and search wherever present. Record verification evidence and any limitations in the README.
- [x] Write README setup, Node/pnpm requirements, `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm verify`, output location, provenance, local/external scope, and one-time import instructions.
- [x] Review the final diff against the approved spec; run final checks after any corrections and commit only relevant source files.
- [x] Report the local preview command, build/verification outcome, and any material gaps. Do not deploy.
