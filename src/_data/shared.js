import { readFile } from 'node:fs/promises';
export default async function () {
  return {
    header: await readFile('src/_includes/header.html', 'utf8'),
    footer: await readFile('src/_includes/footer.html', 'utf8'),
  };
}
