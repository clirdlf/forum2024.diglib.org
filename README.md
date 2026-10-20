# DLF Forum 2024 archive

A frozen Eleventy archive of https://forum2024.diglib.org/, retaining all 25 published pages, 9 news posts, and their original URLs. Images, fonts, styles, and downloads are local. The WordPress accessibility widget is removed. External videos, registration, shared notes, maps, social media, and newsletter services remain links.

## Local development

Use Node 22.23.3 as pinned in `.node-version` and pnpm 12.14.0 specified in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:8080/**. The server rebuilds when page source, includes, styles, or scripts change. No capture or normalization is needed to develop, build, or deploy a fresh checkout.

```sh
pnpm check        # Formatting, tests, fresh production build, and full audit
pnpm check:pages  # Build and audit under /archive-preview/
pnpm build        # Output: _site/
pnpm verify       # Audit the existing _site/ output
pnpm format       # Format handwritten code and editable page source
```

`pnpm check:pages` leaves the prefixed preview in `_site/`; run `pnpm build` or `pnpm dev` afterward for ordinary root hosting. Serve the output over HTTP, rather than opening HTML with `file://`.

## Editing source

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

## Original captures and regeneration

`data/capture/` retains the original public HTML and CSS, its capture timestamp, source URLs, and SHA-256 checksums. `data/archive-manifest.json` records the normalized document/asset inventory. The WordPress XML export is the authoritative inventory of published pages and posts; drafts and administrative records are excluded from the site.

There are two deliberately separate operations:

- **`pnpm normalize`** regenerates editable pages, shared includes, captured CSS, and the manifest from committed local captures. It works offline without the uploads tarball or `.cache/`. Outputs are sorted and reproducible; it preserves the original capture timestamp. Checksums, asset existence, and shared-layout consistency are validated before publishing staged changes. File replacement failures restore previous files.
- **`pnpm capture --refresh`** deliberately recaptures the live WordPress site, extracts uploads, and invokes normalization in a staging directory. It publishes the complete capture and normalized source only after success. It requires network access, `curl`, `tar`, the XML export, and `site50-uploads-20261020.tar.gz` at the repository root. Input checksums identify extraction/download caches. Omit `--refresh` to reuse matching caches.

**Both commands replace editable page source and shared includes with the captured version.** Commit intentional edits first and inspect the resulting diff. Routine page edits should be made directly in `src/content/`; normalization is for migration-rule changes or restoring the snapshot. Do not edit `data/capture/` directly: changing its files invalidates checksums. Stop the preview server during regeneration to avoid intermediate rebuilds.

The original tarball, `.cache/`, and `_site/` are ignored by Git. The tarball is not needed to build or deploy. The captured asset directory contains approximately 56 MB of images, fonts, styles, and downloads.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` checks pull requests and main-branch pushes, validates both root and repository-path builds, and deploys `_site/` after a successful main-branch build. Only the deployment job receives Pages write/OIDC permissions. GitHub Actions uses Node from `.node-version`, pnpm from `package.json`, and the committed lockfile. It never runs the migration commands.

To enable hosting after pushing this repository:

1. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
2. Set the custom domain to **forum2024.diglib.org**. `src/CNAME` also retains that domain in the built artifact.
3. Point the domain's DNS at the GitHub Pages destination shown by GitHub, then enable HTTPS once available. Keep the existing DNS in place until you are ready to switch the live archive.
4. Push or merge to `main`, or run the workflow manually from `main`.

The workflow uses `actions/configure-pages` to obtain the correct base path. With the custom domain, the path is `/`. A project site can also use `/repository-name/`: HTML links, responsive images, inline styles, captured CSS, module imports, search requests/results, utility pages, and 404 links support this layout.

For a local project-path build:

```sh
SITE_PATH_PREFIX=/repository-name/ pnpm build
SITE_PATH_PREFIX=/repository-name/ pnpm verify
```

For permanent `github.io` hosting instead of the custom domain, remove `src/CNAME`, remove its passthrough entry in `eleventy.config.js`, and clear the custom-domain setting in GitHub. No GitHub remote or account settings are configured by the source code itself.

References: [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom-domain configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Verification scope

Tests cover inventory filtering, localization, shared layout/current navigation, offline deterministic normalization, corrupt-capture rejection, replacement rollback, input-bound cache identities, and deployment path rewriting. The generated-site audit checks all original routes, internal links and fragments, directory indexes, local asset/CSS references, browser module imports, and search-result URLs. Missing destinations, unintended remote rendering dependencies, inline scripts, external frames, widget resources, and WordPress form endpoints fail the audit.

Browser checks cover representative desktop/mobile layouts and navigation, carousels, tabs, accordions, and search. External service availability and video/form submissions remain outside this static archive. Historical event text and registration notices are preserved.
