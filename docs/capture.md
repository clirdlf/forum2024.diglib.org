# Original captures and regeneration

`data/capture/` retains the original public HTML and CSS, its capture timestamp, source URLs, and SHA-256 checksums. `data/archive-manifest.json` records the normalized document/asset inventory. The WordPress XML export is the authoritative inventory of published pages and posts; drafts and administrative records are excluded from the site.

There are two deliberately separate operations:

- **`pnpm normalize`** regenerates editable pages, shared includes, captured CSS, and the manifest from committed local captures. It works offline without the uploads tarball or `.cache/`. Outputs are sorted and reproducible; it preserves the original capture timestamp. Checksums, asset existence, and shared-layout consistency are validated before publishing staged changes. File replacement failures restore previous files.
- **`pnpm capture --refresh`** deliberately recaptures the live WordPress site, extracts uploads, and invokes normalization in a staging directory. It publishes the complete capture and normalized source only after success. It requires network access, `curl`, `tar`, the XML export, and `site50-uploads-20261020.tar.gz` at the repository root. Input checksums identify extraction/download caches. Omit `--refresh` to reuse matching caches.

**Both commands replace editable page source and shared includes with the captured version.** Commit intentional edits first and inspect the resulting diff. Routine page edits should be made directly in `src/content/`; normalization is for migration-rule changes or restoring the snapshot. Do not edit `data/capture/` directly: changing its files invalidates checksums. Stop the preview server during regeneration to avoid intermediate rebuilds.

The original tarball, `.cache/`, and `_site/` are ignored by Git. The tarball is not needed to build or deploy. The captured asset directory contains approximately 56 MB of images, fonts, styles, and downloads.
