# DLF Forum 2024 archive

A frozen Eleventy archive of https://forum2024.diglib.org/: 25 published pages, 9 news posts, and their original URLs. Images, fonts, styles, and downloads are local. Videos, registration, maps, shared notes, and newsletter services remain links. The WordPress accessibility widget is removed.

## Quickstart

Use Node 22.23.3 (`.node-version`) and pnpm 12.14.0 (`package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:8080/**. Fresh checkouts need no capture, normalization, or image generation.

```sh
pnpm check        # Formatting, tests, clean production build, full generated-site audit
pnpm check:pages  # Independent project-path check; preserves the normal build
pnpm build        # Clean production output in _site/
pnpm test:browser # Desktop/mobile browser tests; install Chromium first (see testing guide)
pnpm audit:a11y   # Local interactive accessibility audit on port 8082
pnpm snapshot     # Verified deployment ZIP and checksums in dist/snapshots/
```

## Project layout

| Path                                                   | Purpose                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------- |
| `src/content/<route>/`                                 | Editable `page.json`, `head.html`, and `body.html`; home is `home/` |
| `src/_includes/`                                       | Shared document shell, header, and footer                           |
| `src/assets/runtime/`                                  | Browser navigation, carousels, disclosures, contents, and search    |
| `src/assets/archive.css`                               | Compatibility and accessibility adjustments                         |
| `src/assets/site/`                                     | Preserved original styles, images, fonts, and downloads             |
| `src/assets/images/`                                   | Committed optimized photograph variants                             |
| `data/capture/`                                        | Immutable original HTML/CSS and capture checksums                   |
| `data/*-manifest.json`, `data/image-optimization.json` | Archive inventories and retained-image provenance                   |
| `data/accessibility-overrides.json`                    | Reviewed image descriptions and palette corrections                 |
| `scripts/`, `scripts/lib/`                             | Build, validation, capture, optimization, and snapshot tools        |
| `test/`, `browser-tests/`                              | Node regression tests and browser smoke tests                       |
| `_site/`, `.cache/`, `dist/`                           | Ignored generated output; never edit by hand                        |

## Editing and operations

Edit a page's `body.html` for content or the shared header/footer for navigation. Keep captured Elementor wrappers and classes to preserve the design. Finish with `pnpm format` and `pnpm check`.

- [Source and rendering rules](docs/source.md)
- [Capture and offline normalization](docs/capture.md) — regeneration replaces editable source
- [Retained photograph variants](docs/images.md)
- [Testing and browser checks](docs/testing.md)
- [GitHub Pages and custom-domain setup](docs/deployment.md)
- [Deployment snapshots and recovery](docs/snapshots.md)
- [Maintenance ownership and dependency policy](docs/maintenance.md)
- [Accessibility review](docs/accessibility-review.md)

Ordinary builds use committed local content and assets and never contact WordPress. GitHub workflows perform checks before publishing; initial Pages configuration and DNS changes still belong to the repository/domain maintainers.
