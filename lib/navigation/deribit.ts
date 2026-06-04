import {
  faChartLine,
  faLayerGroup,
  faRobot,
  faSliders,
  faBrain,
} from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from './types';

export const DERIBIT_NAVIGATION: NavItem[] = [
  {
    label: 'Overview',
    path: '/deribit-agent',
    icon: faChartLine,
    description: 'Agent status and account summary',
  },
  {
    label: 'Models',
    path: '/deribit-agent/models',
    icon: faBrain,
    description: 'Train and manage ML models',
  },
  {
    label: 'Agents',
    path: '/deribit-agent/agents',
    icon: faRobot,
    description: 'Agent execution history and decisions',
  },
  {
    label: 'Positions',
    path: '/deribit-agent/positions',
    icon: faLayerGroup,
    description: 'Open positions and Greeks',
  },
  {
    label: 'Settings',
    path: '/deribit-agent/settings',
    icon: faSliders,
    description: 'Agent configuration and parameters',
  },
];
