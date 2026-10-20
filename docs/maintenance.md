# Maintenance policy

Repository maintainers own dependency review, CI failures, and snapshot releases. Domain maintainers own DNS and HTTPS configuration. This is a frozen archive: historical event content, original URLs, captured files, and original uploads should remain stable.

## Routine review

Review the build toolchain quarterly and when a relevant security or compatibility notice arrives. Use the pinned Node and pnpm versions and frozen-lockfile installation. Review a dependency update as one change with its lockfile; do not regenerate captures or photographs merely because a package changed.

- GitHub Actions: Dependabot opens monthly grouped minor/patch update PRs. Major Action upgrades are handled explicitly. No automatic merging is configured.
- npm packages: use `pnpm update` with the pinned pnpm version, then open one reviewed PR for the resulting compatible updates. Major package upgrades require an explicit migration decision.
- Node/pnpm: update `.node-version`, `packageManager`, and corresponding documentation together. Review `engines.node` when changing the supported runtime.

GitHub's [documented Dependabot package-manager support](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) currently lists pnpm through version 10; this repository pins pnpm 12. Package update PRs therefore use the manual procedure rather than an unverified bot updater. Add the `npm` ecosystem to Dependabot when the pinned pnpm version is supported. Keep Actions updates grouped as described in [GitHub's grouping documentation](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates).

## Update validation

Run `pnpm check`, `pnpm check:pages`, and `pnpm test:browser`. Review changes in rendered navigation, guide tabs/FAQ controls, and carousel motion; browser traces and the interactive accessibility audit help investigate failures. Captured styles and handwritten compatibility rules work together, so a successful compilation alone is insufficient.

For approved releases, create a [verified snapshot](snapshots.md). Preserve the previous snapshot for rollback. CI and GitHub release publication must be exercised in the target repository; local checks do not prove account-level Pages settings, DNS, or GitHub permissions.

## Implementation verification record

The maintenance changes are covered by 45 Node tests, including failure cases for accessibility auditing, output cleanup isolation, complete rendering of all captured pages, and deterministic ZIP/checksum generation. All 16 desktop/mobile Chromium cases have been executed locally with the Playwright runner. The carousel keyboard test activates Play with Enter so a pointer left over the carousel cannot interfere with intentional hover-pause behavior. GitHub workflow execution and account-level settings still require validation in the target repository.

The accessibility refactor was compared against all 36 built pages and preserved identical markup. A watch-mode probe verified that changing and restoring an editable image description both rebuild the preview. Review corrections use stable browser locators when control names change and a focusable main landmark to verify carousel pause after keyboard focus leaves on either viewport.
