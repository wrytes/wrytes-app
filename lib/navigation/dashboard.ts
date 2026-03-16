import {
  faLightbulb,
  faHistory,
  faMoneyCheckDollar,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export interface NavigationItem {
  label: string;
  path: string;
  icon: IconDefinition;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export const DASHBOARD_NAVIGATION: NavigationItem[] = [
  {
    label: 'Overview',
    path: '/dashboard',
    icon: faLightbulb,
    description: 'Dashboard overview and stats',
  },
  {
    label: 'Borrow',
    path: '/dashboard/borrow',
    icon: faMoneyCheckDollar,
    description: 'View and manage borrow positions',
  },
  {
    label: 'Queue',
    path: '/dashboard/query',
    icon: faHistory,
    description: 'View and manage pending transactions',
  },
];
