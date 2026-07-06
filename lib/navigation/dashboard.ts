import { faLightbulb, faShield, faUser, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
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
    label: 'Namespace',
    path: '/dashboard/namespace',
    icon: faLayerGroup,
    description: 'Namespace overview',
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
