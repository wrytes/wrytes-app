import {
  faGaugeHigh,
  faArrowRightToBracket,
  faArrowRightFromBracket,
  faSliders,
} from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from './types';

export const ROUTES_NAVIGATION: NavItem[] = [
  {
    label: 'Overview',
    path: '/routes',
    icon: faGaugeHigh,
    description: 'Routes status and quick actions',
  },
  {
    label: 'Onramp',
    path: '/routes/onramp',
    icon: faArrowRightToBracket,
    description: 'Fiat to crypto conversion routes',
  },
  {
    label: 'Offramp',
    path: '/routes/offramp',
    icon: faArrowRightFromBracket,
    description: 'Crypto to fiat conversion routes',
  },
  {
    label: 'Settings',
    path: '/routes/settings',
    icon: faSliders,
    description: 'Configure Kraken API credentials',
  },
];
