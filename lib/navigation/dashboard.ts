import {
  faLightbulb,
  faRoute,
  faShield,
  faUser,
  faScaleBalanced,
} from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from './types';

export type { NavItem };

export const DASHBOARD_NAVIGATION: NavItem[] = [
  {
    label: 'Overview',
    path: '/dashboard',
    icon: faLightbulb,
    description: 'Dashboard overview and stats',
  },
  {
    label: 'Routes',
    path: '/dashboard/routes',
    icon: faRoute,
    description: 'On-ramp and off-ramp conversion routes',
  },
  {
    label: 'Accounting',
    path: '/dashboard/accounting',
    icon: faScaleBalanced,
    description: 'Token transfers, invoices and accounting overview',
  },
  {
    label: 'Profile',
    path: '/dashboard/profile',
    icon: faUser,
    description: 'Manage your profile',
  },
  {
    label: 'Admin',
    path: '/dashboard/admin',
    icon: faShield,
    description: 'Admin settings',
    adminOnly: true,
  },
];
