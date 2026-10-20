# Editing source

Each page has a directory matching its route, with the home page in `src/content/home/`:

```text
src/content/about/
  page.json     # Title, original route, content type, and body classes
  head.html     # Original page-specific styles and metadata
  body.html     # Readable page markup, with shared layout placeholders
```

To correct page content, edit `body.html`. Keep the original Elementor wrappers, classes, IDs, and inline styles to preserve the design. `page.json` owns the permalink; changing a directory name alone does not change the URL. `head.html` retains the styles required by that page.

Edit `src/_includes/header.html` or `footer.html` to change shared navigation or contact information once. The `<!-- archive:header -->` and `<!-- archive:footer -->` placeholders in page bodies are replaced during the build. Active navigation is derived from each page's route. The common document shell is `src/_includes/document.njk`.

Browser behavior is separated into ES modules in `src/assets/runtime/`: navigation, carousels, disclosures, table of contents, and search. `src/assets/archive.js` initializes them, and `archive.css` contains the compatibility adjustments. Original captured styles and media stay in `src/assets/site/`; do not run bulk formatting on that directory. Search indexing is implemented in `scripts/lib/search.mjs`.

Finish edits with `pnpm format` and `pnpm check`. The formatter ignores original captures, the XML export, downloaded assets, and build output. The build reads committed source only and never accesses WordPress or the network.

## Rendering corrections

The build applies `scripts/lib/render.mjs` in this order: accessibility corrections, retained image markup, and deployment-path rewriting. CSS receives accessibility palette corrections and retained photographic backgrounds before deployment paths are prefixed. Test the complete pipeline with `pnpm test`; every captured page is covered.

`scripts/lib/accessibility.mjs` contains named steps for landmarks, contents controls, tabs, disclosures, headings, article lists, image descriptions, carousel labels, navigation, duplicate IDs, and inline styles. Curated photo descriptions, background labels, and color replacements live in `data/accessibility-overrides.json`. Descriptions were reviewed against the retained images; only entries matching empty or known filename alt text are substituted. Keep useful original alt text. Override edits are watched by `pnpm dev`; the renderer reads their current values on every build.

Use these correction rules for shared archive repairs. Direct editorial changes to page source remain possible, but `pnpm normalize` replaces them from the capture. Never edit `_site/`, `.cache/`, or retained image variants by hand.
