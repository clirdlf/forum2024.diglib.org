# Testing and validation

```sh
pnpm check        # Formatting, 45 Node tests, clean root build, generated-site audit
pnpm check:pages  # Separate project-path build and audit in .cache/pages-site/
pnpm verify       # Audit the selected existing output directory
```

The audit checks every generated HTML page for a single main landmark, a single primary accessible heading, heading-level gaps, duplicate IDs, and resolving ARIA relationships. It also checks all published routes, internal links and fragments, local assets and CSS, module imports, search results, retained image hashes, and the absence of WordPress widgets or unintended external rendering dependencies.

Unit tests exercise failure cases. A corpus integration test assembles all 34 captured content pages and runs the full accessibility → retained images → URL-prefix pipeline. Search and Not Found are also included in the generated-site audit.

## Browser smoke tests

```sh
pnpm exec playwright install chromium
pnpm test:browser
```

The 14 Chromium cases cover desktop and mobile navigation/Escape/focus return, guide tabs and mobile disclosures, contents controls, FAQ activation, persistent carousel pause, and axe scans on representative pages. The runner starts its own server on port 8083 with isolated output; no existing development server is reused. CI installs Chromium and runs these tests before deployment or a tagged snapshot. Traces from failing local runs are retained in `test-results/`.

To check test discovery without starting browsers, use `pnpm exec playwright test --list`.

## Manual accessibility review

Run `pnpm audit:a11y`, then open http://localhost:8082/. Each page includes an expandable axe report. Open controls and rerun the audit; inspect incomplete results manually. This preview tooling is never published. See [the accessibility review](accessibility-review.md) for the recorded broad scan and its limits. Assistive-technology testing and external services/downloadable documents require separate review.

## Outputs and preservation

Root verification currently covers 36 HTML pages, 6,254 references, 377 captured assets, and 320 retained image variants. Capture normalization and photograph generation are offline, explicit operations with deterministic output; neither is part of an ordinary build. Regenerate deliberately and inspect changes as described in [capture](capture.md) and [images](images.md).
