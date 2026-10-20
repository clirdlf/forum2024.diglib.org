# Retained image optimization

Implement the user's approved selective Eleventy Image optimization. Generate local AVIF/WebP photograph variants once, commit files and a stable manifest, and consume them without image processing during ordinary builds. Preserve original uploads, fallback JPEGs, alt text, classes, dimensions, crops, and original page source. Skip small images, logos, graphics, and SVGs. Use picture/source markup for photographs and separate image-set declarations with original fallbacks for simple photographic CSS backgrounds. Preserve root and repository-path hosting.

- [ ] Test selection, source/crop handling, generated markup, CSS fallbacks, and Pages URL rewriting before implementation.
- [ ] Implement explicit images:generate command using Eleventy Image's JavaScript API, retained assets/metadata, deterministic local input hashes, staged publication, and measured savings.
- [ ] Integrate lightweight HTML/CSS transforms into the existing build, include retained image files in checks, and keep normal builds independent of image processing. Regeneration commands must retain compatible image mappings or fail clearly for stale sources.
- [ ] Verify root/prefixed builds, browser photo rendering and carousel layout, image dimensions, ordinary build without native processing imports, tests, and measurements. Document generation and preservation rules; obtain read-only review and fix material findings.
