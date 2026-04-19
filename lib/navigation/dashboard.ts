import {
  faCode,
  faLightbulb,
  faRoute,
  faShield,
  faUser,
  faWallet,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export interface NavigationItem {
  label: string;
  path: string;
  icon: IconDefinition;
  description?: string;
  badge?: string;
  disabled?: boolean;
  adminOnly?: boolean;
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
    icon: faWallet,
    description: 'Bank accounts for off-ramp',
  },
  {
    label: 'Routes',
    path: '/dashboard/routes',
    icon: faRoute,
    description: 'On-ramp and off-ramp conversion routes',
  },
  {
    label: 'Profile',
    path: '/dashboard/profile',
    icon: faUser,
    description: 'Manage your profile',
  },
  {
    label: 'Components',
    path: '/dashboard/components/display',
    icon: faCode,
    description: 'UI component showcase',
  },
  {
    label: 'Admin',
    path: '/dashboard/admin',
    icon: faShield,
    description: 'Admin settings',
    adminOnly: true,
  },
];
