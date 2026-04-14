import {
  faLightbulb,
  faHistory,
  faRoute,
  faUser,
  faBuildingColumns,
  faWallet,
  faKey,
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
    label: 'Accounts',
    path: '/dashboard/accounts',
    icon: faBuildingColumns,
    description: 'Bank accounts for off-ramp',
  },
  {
    label: 'Routes',
    path: '/dashboard/ramping',
    icon: faRoute,
    description: 'On-ramp and off-ramp conversion routes',
  },
  {
    label: 'Profile',
    path: '/dashboard/profile',
    icon: faUser,
    description: 'Manage your profile',
  },
];
