import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { assembleBody } from './scripts/lib/content.mjs';
import { searchIndex } from './scripts/lib/search.mjs';
import { normalizePrefix, prefixHtml, writePrefixedCss } from './scripts/lib/paths.mjs';

export default function (eleventyConfig) {
  const pathPrefix = normalizePrefix(process.env.SITE_PATH_PREFIX);
  eleventyConfig.addPassthroughCopy({ 'src/assets/site': '/' });
  eleventyConfig.addPassthroughCopy({
    'src/assets/archive.js': 'assets/archive.js',
    'src/assets/archive.css': 'assets/archive.css',
    'src/assets/runtime': 'assets/runtime',
    'src/CNAME': 'CNAME',
    'src/.nojekyll': '.nojekyll',
  });
  eleventyConfig.watchIgnores.add('./data/**');
  eleventyConfig.watchIgnores.add('./.cache/**');
  eleventyConfig.addWatchTarget('src/content/');
  eleventyConfig.addWatchTarget('src/_includes/');
  eleventyConfig.addFilter('withSharedLayout', assembleBody);
  eleventyConfig.addFilter('searchIndex', (docs) => searchIndex(docs, pathPrefix));
  eleventyConfig.addTransform('pages-prefix', function (content) {
    return this.page.outputPath?.endsWith('.html') ? prefixHtml(content, pathPrefix) : content;
  });
  eleventyConfig.on('eleventy.after', async ({ dir }) => {
    if (pathPrefix === '/') return;
    async function rewrite(sourceDirectory, outputDirectory) {
      for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
        const source = path.join(sourceDirectory, entry.name),
          output = path.join(outputDirectory, entry.name);
        if (entry.isDirectory()) await rewrite(source, output);
        else if (source.endsWith('.css')) await writePrefixedCss(source, output, pathPrefix);
      }
    }
    await rewrite('src/assets/site', dir.output);
    await writePrefixedCss(
      'src/assets/archive.css',
      path.join(dir.output, 'assets/archive.css'),
      pathPrefix,
    );
  });
  return {
    pathPrefix,
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['njk'],
    htmlTemplateEngine: 'njk',
  };
}
