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
    path: '/deribit',
    icon: faChartLine,
    description: 'Agent status and account summary',
  },
  {
    label: 'Positions',
    path: '/deribit/positions',
    icon: faLayerGroup,
    description: 'Open positions and Greeks',
  },
  {
    label: 'Agent Runs',
    path: '/deribit/runs',
    icon: faRobot,
    description: 'Agent execution history and decisions',
  },
  {
    label: 'Training',
    path: '/deribit/training',
    icon: faBrain,
    description: 'Train and manage ML models',
  },
  {
    label: 'Settings',
    path: '/deribit/settings',
    icon: faSliders,
    description: 'Agent configuration and parameters',
  },
];
