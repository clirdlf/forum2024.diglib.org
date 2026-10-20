import { readContent } from '../../scripts/lib/content.mjs';
export default async function () {
  return readContent('src/content');
}
