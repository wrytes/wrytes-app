import {
  faLightbulb,
  faVault,
  faHistory,
  faArrowRightArrowLeft,
  faUserCheck,
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
    label: 'Swap',
    path: '/dashboard/swap',
    icon: faArrowRightArrowLeft,
    description: 'Swap tokens via CoW Protocol',
  },
  {
    label: 'Vaults',
    path: '/dashboard/vaults',
    icon: faVault,
    description: 'Manage your DeFi vaults',
  },
  {
    label: 'Queue',
    path: '/dashboard/queue',
    icon: faHistory,
    description: 'View and manage pending transactions',
  },
  {
    label: 'Authorizations',
    path: '/dashboard/authorizations',
    icon: faUserCheck,
    description: 'Manage authorization signatures for smart contracts',
  },
];
