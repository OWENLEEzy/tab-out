import type { CustomGroup } from '../types';

/**
 * Built-in custom grouping rules shipped with the extension.
 * Users can add more rules via the settings page; these are just sensible
 * defaults that cover common publishing and hosting platforms.
 */
export const DEFAULT_CUSTOM_GROUPS: readonly CustomGroup[] = [
  {
    hostnameEndsWith: '.substack.com',
    groupKey: 'substack',
    groupLabel: "Author's Substack",
  },
  {
    hostnameEndsWith: '.github.io',
    groupKey: 'github-pages',
    groupLabel: 'GitHub Pages',
  },
] as const;
