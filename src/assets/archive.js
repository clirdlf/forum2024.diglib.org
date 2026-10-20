/* Local archive entry point. */
import { initializeMenus } from './runtime/navigation.js';
import { initializeCarousels } from './runtime/carousels.js';
import { initializeDisclosures } from './runtime/disclosures.js';
import { initializeTableOfContents } from './runtime/toc.js';
import { initializeSearch } from './runtime/search.js';

initializeMenus();
initializeCarousels();
initializeDisclosures();
initializeTableOfContents();
initializeSearch();
