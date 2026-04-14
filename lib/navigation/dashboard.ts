import {
  faLightbulb,
  faHistory,
  faMoneyCheckDollar,
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
    label: 'Profile',
    path: '/dashboard/profile',
    icon: faUser,
    description: 'Manage your profile',
  },
  {
    label: 'Accounts',
    path: '/dashboard/accounts',
    icon: faBuildingColumns,
    description: 'Bank accounts for off-ramp',
  },
  {
    label: 'Wallets',
    path: '/dashboard/wallets',
    icon: faWallet,
    description: 'Safe and linked wallets',
  },
  {
    label: 'API Keys',
    path: '/dashboard/api-keys',
    icon: faKey,
    description: 'Manage API keys',
  },
];
