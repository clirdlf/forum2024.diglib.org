# DLF Forum 2024 static archive

## Purpose and scope

Recreate https://forum2024.diglib.org/ as a visually faithful, locally runnable
Eleventy (11ty) site. This is a frozen archive with no anticipated content
updates. Use pnpm for package management and `pnpm dev` for local preview.

Preserve all 25 published pages and 9 published news posts identified in
`data/dlfforum2024.WordPress.2026-10-20.xml`, including their existing paths.
Keep published content even when it is absent from the navigation. Exclude
drafts, private content, administrative records, and WordPress statistics.

The WordPress accessibility toolbar/widget must be absent. Preserve ordinary
accessibility features such as image alternative text, semantic links,
keyboard navigation, visible focus, and responsive content.

## Source material

- The XML export supplies the content inventory, publication information,
  canonical paths, attachment information, and Elementor layout metadata.
- `site50-uploads-20261020.tar.gz` supplies the images and other uploaded files.
  Use these files rather than downloading replacement copies of the images.
- The public website supplies reference HTML, styles, fonts, and visual
  behavior not fully represented by the export. Capture required resources
  once during implementation. Document any unavailable source resources.

Keep the original export and uploads archive intact. Do not commit the large
source archive or build output. Record enough provenance to distinguish the
downloaded inputs from the generated archive source.

## Approach and alternatives

Use frozen public page HTML and original styles as the presentation source,
with the XML inventory determining which published documents must be present.
Normalize the captured documents into local Eleventy templates/data. Store
shared layout pieces centrally where extraction preserves the original
document structure and styling. Preserve page-specific classes and layout
attributes needed by the original styles.

This favors visual fidelity and a simple archive build. Rendering every
Elementor widget directly from XML would require recreating a large plugin
renderer. Rebuilding all pages with new styles would simplify the markup but
increase the likelihood of visible differences. Neither alternative serves
this frozen archive as well.

## Files, routes, and asset handling

Eleventy reads only local source files and emits a static `_site/` directory.
Use explicit permalinks to retain original page and dated news paths. Retain
the news index and any existing pagination/category archive routes reached
from the published content, when applicable. Provide a useful local 404 page.

Extract the supplied uploads into a local asset directory. Preserve upload
paths where practical, or use a deterministic URL mapping. Copy all assets
referenced by the published pages, including responsive image variants,
background images, fonts, icons, and downloadable files. Unreferenced uploads
need not be copied into the build.

Rewrite internal page links and asset references to the local archive,
including references in HTML attributes, inline styles, CSS, and image source
sets. Preserve fragment identifiers and meaningful query strings. Remove
WordPress administrative, API-discovery, tracking, and accessibility-widget
resources that are unnecessary for archive presentation.

## Browser behavior and external services

Preserve responsive desktop and mobile navigation, dropdown menus, carousels,
tabs, accordions, and in-page links wherever present. Use small local browser
scripts and local libraries where needed; avoid dependence on a running
WordPress installation or its AJAX endpoints. Ensure content remains visible
when animation initialization is unavailable.

Site pages, images, fonts, styles, and downloadable uploads work without
internet access. External services remain linked, including videos,
registration, shared notes, conference platforms, and newsletter signup.
Replace embedded service forms with their external destination links where
needed to avoid implying that a static form can submit locally. Preserve
existing external link destinations; do not attempt to archive those services.
If search is present, provide a local search index and browser-based results.

## Developer commands and documentation

- `pnpm install` installs dependencies using the committed pnpm lockfile.
- `pnpm dev` builds and serves the archive locally with Eleventy.
- `pnpm build` emits `_site/` using no network access.
- A verification command checks the generated pages, links, and local assets.

The README documents the required Node/pnpm versions, setup, commands, source
inputs, output directory, archive scope, and external-service limitations.
Publication or deployment is outside this task.

## Verification and acceptance

1. The production build succeeds and produces every published page and post
   at its original route.
2. All internal page destinations and local asset references resolve, or
   unavoidable missing source material is explicitly reported.
3. No accessibility widget markup, script, stylesheet, or toolbar appears.
4. Compare representative desktop and mobile views with the public site:
   home, a text-heavy resource page, a program page, a speaker page, and news.
   Check fonts, colors, spacing, imagery, header/footer, and responsive layout.
5. Exercise navigation, menus, carousels, tabs, accordions, and search wherever
   used; verify keyboard access for replacement controls.
6. Confirm that ordinary page rendering requests only local assets, apart
   from external services deliberately opened or activated by the visitor.
7. A fresh local build uses retained source files without fetching the live
   website or requiring WordPress.

## Known constraints

The export contains content and Elementor data, but is not a complete theme
backup. Public HTML and styles are needed to reproduce the current design.
Some external destinations may no longer operate; preserving their links
does not guarantee the availability of those services. Any material visual
or content gap discovered during implementation must be documented.
