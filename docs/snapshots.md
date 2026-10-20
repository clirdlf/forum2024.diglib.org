# Deployment snapshots and recovery

`pnpm snapshot` builds into `.cache/release-site/`, verifies routes/assets/accessibility structure and image hashes, then creates a portable deployment archive. It does not change `_site/` or publish anything.

Output lives in `dist/snapshots/<revision>/`:

- `forum2024-<revision>.zip`: the complete built site at the ZIP root, including `CNAME`, `.nojekyll`, and an internal per-file `SHA256SUMS`.
- `snapshot.json`: source commit, working-tree status, domain, URL prefix, file paths, sizes, and SHA-256 hashes.
- `SHA256SUMS`: hashes for the ZIP and metadata.

The default revision is the abbreviated commit ID; uncommitted changes add `-dirty`. Explicit `SNAPSHOT_NAME` values require a clean working tree. ZIP timestamps are fixed, so unchanged input produces identical archives. The tool round-trips the ZIP and checks every extracted file before writing the snapshot. ZIP storage is uncompressed because most site assets are already compressed; the current site is about 84 MB.

## Tagged releases

After merging and validating a clean revision, create an annotated `archive-*` tag and push that tag to GitHub. For example, a maintainer can choose `archive-2026-10-20`. Tagging/pushing is deliberate and is not performed by `pnpm snapshot`.

`.github/workflows/snapshot.yml` checks the code, both hosting layouts, and browser smoke tests; it then builds the verified snapshot. Only the final release job has permission to publish the ZIP, metadata, and checksums as GitHub Release assets. Ordinary main-branch pushes continue to deploy through the existing Pages workflow and do not create releases.

Keep a copy of the release files outside GitHub for long-term preservation. The original 1.2 GB uploads tarball is ignored by Git and is not needed to serve or build the committed archive; retain it separately if the original download is also part of the preservation record.

## Restore without the project toolchain

1. Download all three release files into an empty directory.
2. Verify the outer checksums: `sha256sum --check SHA256SUMS` on Linux, or `shasum -a 256 -c SHA256SUMS` on macOS.
3. Extract the ZIP into another empty directory. Check its internal `SHA256SUMS` using the same checksum command from inside the extracted directory.
4. Read `snapshot.json` and confirm the intended domain and URL prefix. A root-domain snapshot must be served at `/`; a project-path snapshot needs its recorded prefix.
5. Serve the extracted files from a static HTTP host. Preserve `CNAME`, `.nojekyll`, directory indexes, and file paths. Node, pnpm, Eleventy, and WordPress are not needed to serve these files.

For GitHub Pages recovery, the extracted directory can be supplied directly to the existing `actions/upload-pages-artifact` and deployment steps. A maintainer can replace the build job temporarily with verified release download/extraction; retain Pages' configure/upload/deploy steps and permissions. Verify both checksum layers before uploading. This avoids rebuilding through project dependencies while retaining the same Pages/custom-domain configuration.
