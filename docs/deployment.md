# GitHub Pages

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

## Independent build outputs

`pnpm build` cleans and writes `_site/`. `pnpm check:pages` cleans and writes `.cache/pages-site/`; it leaves `_site/` untouched. Browser smoke tests use `.cache/browser-site/`, and snapshot builds use `.cache/release-site/`. Development watch rebuilds do not repeatedly clean output.

`SITE_OUTPUT_DIR` accepts `_site` or a single generated directory under `.cache/` (for example `.cache/pages-site`). Build, verification, and the accessibility preview use the same selection. Source paths, the repository root, and external paths are rejected as cleanup destinations.

See [snapshots and recovery](snapshots.md) for tagged release files that can be served without rebuilding the project.
