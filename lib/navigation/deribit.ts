import {
  faChartLine,
  faLayerGroup,
  faRobot,
  faSliders,
  faBrain,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export interface DeribitNavItem {
  label: string;
  path: string;
  icon: IconDefinition;
  description?: string;
}

export const DERIBIT_NAVIGATION: DeribitNavItem[] = [
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
    path: '/deribit-agent/runs',
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
