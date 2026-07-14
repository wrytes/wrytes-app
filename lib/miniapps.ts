import {
  faBook,
  faChartLine,
  faRoute,
  faFileInvoice,
  faRobot,
  faCoins,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export type MiniApp = {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: IconDefinition;
  color: string;
  development?: boolean;
  disabled?: boolean;
};

export const MINI_APPS: MiniApp[] = [
  {
    id: 'docs',
    name: 'Documentation',
    description:
      'Integration documentation, Technical references and API guides for the Wrytes platform.',
    href: '/docs',
    icon: faBook,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description:
      'Account insights, namespace management, and settings for linking integrations and API keys.',
    href: '/dashboard',
    icon: faChartLine,
    color: 'bg-brand/10 text-brand',
    development: true,
    disabled: true,
  },
  {
    id: 'invoices',
    name: 'Invoices',
    description:
      'AI-powered extraction from uploaded invoice documents. On-chain invoice management and payment tracking. ',
    href: '/invoices',
    icon: faFileInvoice,
    color: 'bg-green-50 text-green-600',
    development: true,
    disabled: true,
  },
  {
    id: 'coin-tracking',
    name: 'Coin Tracking',
    description: 'Cryptocurrency accounting and coin tracking for transparent financial reporting.',
    href: '/coin-tracking',
    icon: faCoins,
    color: 'bg-teal-50 text-teal-600',
    development: true,
    disabled: true,
  },
  {
    id: 'execution-engine',
    name: 'Execution Engine',
    description:
      'Optimized submission via private block builders for better inclusion and front-running avoidance.',
    href: '/execution-engine',
    icon: faBolt,
    color: 'bg-indigo-50 text-indigo-600',
    development: true,
    disabled: true,
  },
  {
    id: 'routes',
    name: 'Routes',
    description:
      'Cross-protocol routing engine for optimal multi-step transaction execution paths.',
    href: '/routes',
    icon: faRoute,
    color: 'bg-purple-50 text-purple-600',
    development: true,
    disabled: true,
  },
  {
    id: 'deribit-agent',
    name: 'Deribit Agent',
    description: 'Automated Bitcoin options strategy agent with real-time Deribit API integration.',
    href: '/deribit-agent',
    icon: faRobot,
    color: 'bg-amber-50 text-amber-600',
    development: true,
    disabled: true,
  },
];
