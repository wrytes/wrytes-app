import { faBook, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from './types';

export const DOCS_NAVIGATION: NavItem[] = [
  {
    label: 'Get Started',
    path: '/docs/0001_Get%20Started',
    icon: faBook,
    description: 'Introduction and setup guide',
  },
  {
    label: 'Search',
    path: '/docs',
    icon: faMagnifyingGlass,
    description: 'Browse all documentation',
  },
];
