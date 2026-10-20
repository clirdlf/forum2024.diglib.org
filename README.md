# DLF Forum 2024 archive

A frozen, visually faithful archive of [forum2024.diglib.org](https://forum2024.diglib.org/), generated with [Eleventy](https://www.11ty.dev/). All 25 published pages and 9 news posts retain their original paths. The WordPress accessibility toolbar is removed.

## Run locally

Requires Node.js **22 or newer** and **pnpm** (developed with pnpm 12.14.0).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:8080/**. The preview rebuilds when source files change.

```sh
pnpm build    # Generate the static site in _site/
pnpm test     # Import/localization and site-audit regression tests
pnpm verify   # Check generated routes, links, fragments, assets, and widget removal
```

Run the build before verification. The build needs no network access after dependencies are installed. Serve `_site/` with any static HTTP server; opening HTML directly using `file://` does not support the original root-relative URLs or local search.

## What is local

The archive includes 34 original documents, a local search page at `/search/`, a 404 page, and 377 captured assets (about 56 MB). Images, responsive image variants, background images, logos, fonts, styles, and linked downloadable files are stored locally. Uploaded images come from the supplied tarball. The browser runtime supplies responsive menus, image/testimonial carousels, tabs, and accordions without WordPress.

External destinations remain links: conference platforms and program services, recordings, registration, shared notes, maps, social media, and newsletter signup. Embedded videos and newsletter forms become links to the original services. Using those services requires internet access. Captured text retains historical registration dates and event notices.

## Source and layout

- `data/dlfforum2024.WordPress.2026-10-20.xml`: original WordPress export; authoritative list of published documents. Drafts and administrative records are excluded from the generated archive.
- `site50-uploads-20261020.tar.gz`: supplied uploads archive, retained locally and ignored by Git. It is not required to build or serve the finished site.
- `data/archive-manifest.json`: source URLs, capture timestamp, document inventory, asset provenance, and import failures (none in the completed capture).
- `src/_data/archive.json`: frozen page markup, titles, routes, and page classes.
- `src/_includes/document.njk` and `src/pages.njk`: shared Eleventy document shell and per-route generation.
- `src/assets/site/`: captured assets, passed through with their original paths where possible.
- `src/assets/archive.js` and `archive.css`: local interactions and compatibility adjustments.
- `scripts/`: one-time importer and generated-site audit.

The archive preserves the original public HTML and styles, including Elementor classes. It contains no WordPress PHP, administration system, API dependency, or plugin JavaScript. Retained plugin CSS is static presentation data. Entrance animations are disabled so all content remains visible; counters show their final values. Protected email links and skip links work without WordPress or Cloudflare scripts. Legacy table-of-contents fragments receive static heading anchors.

## One-time capture (normally unnecessary)

The finished archive is already imported. To deliberately repeat the migration, keep the original XML and supplied tarball at the paths above and run:

```sh
pnpm run import
pnpm build
pnpm verify
```

Use **`pnpm run import`**, because `pnpm import` is pnpm's unrelated lockfile-conversion command. The importer requires `curl`, `tar`, and network access to capture public HTML and styles not present in the uploads tarball. It uses `.cache/` for extracted uploads and downloaded resources, reuses cached captures on repeat runs, and leaves both original inputs intact. To recapture public resources, remove only `.cache/downloads/` first. Ordinary builds never invoke the importer.

## Verification

Automated checks cover every published route and all generated internal page, fragment, image, stylesheet, font, script, and CSS URL references. They reject missing local destinations, the excluded widget, automatic external frames, remote rendering dependencies, and WordPress form endpoints.

Browser checks were performed in Chrome at desktop and 390 px mobile widths, including the home, program, attendee resources, guide tabs, speaker, and news layouts. Mobile navigation, keyboard dropdowns/accordions, local search, and carousel controls were exercised. External services are preserved destinations and are not tested for continued availability. The archive does not reproduce remote form submissions, video playback, or WordPress administration.
