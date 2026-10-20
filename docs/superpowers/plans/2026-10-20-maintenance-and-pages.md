# Archive maintenance and GitHub Pages

Implement the user's approved six maintenance recommendations, preserving the original archive appearance, 34 published routes, pnpm dev, local rendering assets, and external service links. Add GitHub Pages deployment configuration; do not push or publish from this session.

## Architecture

Readable page source lives in src/content/<route>/{page.json,head.html,body.html}. The Eleventy data loader reads these files; headers and footers are shared HTML includes. Preserve original classes and compute active navigation per route. Retain original captures in data/capture so normalization works after WordPress retirement. Online capture and offline normalization are separate commands. Stage and validate generated changes before replacing source, use stable ordering, and bind caches to input checksums. Handwritten code is formatted and runtime features are ES modules. GitHub Pages uses the official Actions artifact workflow, an explicit Node version, and the configured Pages base path for HTML/CSS/JS/search references.

## Tasks

- [x] 1. Fix audit false positives with failing fixtures; support auditing a Pages path prefix. Add combined check command.
- [x] 2. Retain original captures, implement offline normalization and readable per-page sources, extract shared includes with per-route active navigation. Test page round trips, durable capture inventory, deterministic outputs, failed-normalization rollback, and cache identity.
- [x] 3. Format code, split runtime modules, isolate search indexing; implement and test root/repository-path rendering for pages, CSS, runtime modules, search data, utility pages, and 404. Preserve screenshot/interaction behavior.
- [x] 4. Add Node pin and CI/Pages workflow; document source editing, capture/normalize distinction, regeneration overwrite rules, Pages setup/custom domain, and commands. Verify root and prefixed builds and offline regeneration, compare rendered documents, then obtain read-only review and resolve material findings.

## Validation

Run node tests first against the missing behavior, then implement. Run pnpm check for the completed root build, plus a prefixed build and audit. Compare page text, routes, local asset references, shared layout, and key Chrome desktop/mobile views with the existing archive. Run normalization twice and confirm no source diff; induce a failed normalization in a temporary fixture and confirm previous source is untouched. No deployment is possible without a configured GitHub remote/repository; deliver the ready workflow and precise remaining repository setup.
