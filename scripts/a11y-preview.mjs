import { outputDirectory } from './lib/build-output.mjs';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = outputDirectory();
const runner = await readFile('scripts/a11y/run.js');
const prefix = (process.env.SITE_PATH_PREFIX || '/').replace(/\/$/, '');
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/__a11y/axe.js') {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(await readFile('node_modules/axe-core/axe.min.js'));
        return;
      }
      if (url.pathname === '/__a11y/run.js') {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(runner);
        return;
      }
      const pathname =
        prefix && url.pathname.startsWith(prefix + '/')
          ? url.pathname.slice(prefix.length)
          : url.pathname;
      let filename = path.resolve(
        root,
        '.' + decodeURIComponent(pathname) + (pathname.endsWith('/') ? 'index.html' : ''),
      );
      if (!filename.startsWith(root + '/')) throw Error();
      let data = await readFile(filename);
      const ext = path.extname(filename);
      const mime = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.avif': 'image/avif',
        '.webp': 'image/webp',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
      };
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      if (ext === '.html')
        data = data
          .toString()
          .replace(
            '</head>',
            '<script src="/__a11y/axe.js"></script><script src="/__a11y/run.js"></script></head>',
          );
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end('Not found');
    }
  })
  .listen(8082, '127.0.0.1', () =>
    console.log('Accessibility audit preview http://localhost:8082'),
  );
