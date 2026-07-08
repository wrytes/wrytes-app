import { faCoins, faSliders } from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from './types';

export const COIN_TRACKING_NAVIGATION: NavItem[] = [
  {
    label: 'Coin Tracking',
    path: '/coin-tracking',
    icon: faCoins,
    description: 'Track and classify on-chain token transfers',
  },
  {
    label: 'Settings',
    path: '/coin-tracking/settings',
    icon: faSliders,
    description: 'Chart of accounts and journal templates',
  },
];
