import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
import {
  isPhotograph,
  selectMaster,
  optimizeHtml,
  optimizeCss,
  validateImageManifest,
} from '../scripts/lib/images.mjs';
import { prefixHtml, prefixCss } from '../scripts/lib/paths.mjs';
const image = {
  width: 1600,
  height: 1000,
  formats: {
    avif: [
      { url: '/assets/images/photo-480.avif', width: 480, height: 300, bytes: 10000 },
      { url: '/assets/images/photo-1600.avif', width: 1600, height: 1000, bytes: 50000 },
    ],
    webp: [{ url: '/assets/images/photo-1600.webp', width: 1600, height: 1000, bytes: 70000 }],
  },
};
const manifest = { images: { '/photo.jpg': image } };
test('photo policy excludes logos, screenshots, graphics, SVGs and small originals', () => {
  assert.equal(isPhotograph('/2024/CLIRM-35-scaled.jpg'), true);
  assert.equal(isPhotograph('/2024/KFphoto.jpeg'), true);
  for (const file of [
    '/logo.jpg',
    '/English-1.jpg',
    '/programschedulescreenshot.jpg',
    '/CLIRM-35.svg',
    '/logo.png',
  ])
    assert.equal(isPhotograph(file), false);
  const source = { url: '/small.jpg', width: 600, height: 400, bytes: 40000 };
  assert.equal(
    selectMaster(source, [
      { url: '/large.jpg', width: 1800, height: 1200, bytes: 100000 },
      { url: '/crop.jpg', width: 2400, height: 2400, bytes: 200000 },
    ]).url,
    '/large.jpg',
  );
});
test('picture markup preserves the original image, attributes and JPEG responsive fallback', () => {
  const input =
    '<figure><img class="swiper-slide-image" alt="A person" src="/photo.jpg" srcset="/photo-small.jpg 480w, /photo.jpg 1600w" sizes="90vw" width="1600" height="1000"></figure><img src="/logo.svg">';
  const output = optimizeHtml(input, manifest);
  const $ = load(output);
  assert.equal($('picture.archive-picture').length, 1);
  assert.equal($('picture source').length, 2);
  assert.equal($('picture img').attr('src'), '/photo.jpg');
  assert.equal($('picture img').attr('srcset'), '/photo-small.jpg 480w, /photo.jpg 1600w');
  assert.equal($('picture img').attr('alt'), 'A person');
  assert.equal($('picture img').attr('class'), 'swiper-slide-image');
  assert.equal($('picture source').first().attr('sizes'), '90vw');
  assert.equal($('picture img').attr('width'), '1600');
  assert.equal($('img[src="/logo.svg"]').parent('picture').length, 0);
  assert.equal(optimizeHtml(output, manifest), output);
  const prefixed = prefixHtml(output, '/repo/');
  assert.match(prefixed, /\/repo\/assets\/images\/photo-480.avif/);
  assert.match(prefixed, /src="\/repo\/photo.jpg"/);
});
test('CSS photo optimization keeps an original fallback and respects Pages paths', () => {
  const original = 'a{background-image:url("/photo.jpg") !important;color:red}';
  const result = optimizeCss(original, manifest);
  assert.match(result, /background-image:url\("\/photo.jpg"\) !important;/);
  assert.match(result, /background-image:image-set\(/);
  assert.match(result, /type\("image\/avif"\)/);
  assert.match(result, /!important;color:red/);
  assert.equal(optimizeCss(result, manifest), result);
  assert.match(prefixCss(result, '/repo/'), /\/repo\/assets\/images\/photo-1600.avif/);
});
test('retained image validation rejects stale inputs and missing derivatives', async () => {
  const { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises');
  const { default: os } = await import('node:os');
  const { default: path } = await import('node:path');
  const { digest } = await import('../scripts/lib/files.mjs');
  const root = await mkdtemp(path.join(os.tmpdir(), 'dlf-images-'));
  try {
    await mkdir(path.join(root, 'original'));
    await mkdir(path.join(root, 'optimized'));
    await writeFile(path.join(root, 'original/photo.jpg'), 'original');
    const m = {
      images: {
        '/photo.jpg': {
          source: '/photo.jpg',
          sourceSha256: digest('original'),
          originalSha256: digest('original'),
          formats: { webp: [{ url: '/assets/images/photo.webp', sha256: digest('webp') }] },
        },
      },
    };
    await assert.rejects(
      validateImageManifest(m, {
        assetRoot: path.join(root, 'original'),
        imageRoot: path.join(root, 'optimized'),
      }),
      /Missing optimized/,
    );
    await writeFile(path.join(root, 'optimized/photo.webp'), 'webp');
    await validateImageManifest(m, {
      assetRoot: path.join(root, 'original'),
      imageRoot: path.join(root, 'optimized'),
    });
    await writeFile(path.join(root, 'original/photo.jpg'), 'changed');
    await assert.rejects(
      validateImageManifest(m, {
        assetRoot: path.join(root, 'original'),
        imageRoot: path.join(root, 'optimized'),
      }),
      /Stale/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test('WordPress size variants share a photo family without mixing directories', async () => {
  const { photoFamily } = await import('../scripts/lib/images.mjs');
  assert.equal(
    photoFamily('/2024/CLIRM-35-1024x683.jpg'),
    photoFamily('/2024/CLIRM-35-scaled.jpg'),
  );
  assert.notEqual(photoFamily('/2023/CLIRM-35.jpg'), photoFamily('/2024/CLIRM-35.jpg'));
});
