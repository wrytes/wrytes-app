import {
  faBook,
  faChartLine,
  faRoute,
  faFileInvoice,
  faRobot,
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
      'Technical references, API guides, and integration documentation for the Wrytes platform.',
    href: '/docs',
    icon: faBook,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description:
      'Live portfolio overview with vault positions, yields, and cross-protocol performance metrics.',
    href: '/dashboard',
    icon: faChartLine,
    color: 'bg-brand/10 text-brand',
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
    id: 'invoices',
    name: 'Invoices',
    description: 'On-chain invoice management and payment tracking powered by Frankencoin.',
    href: '/invoices',
    icon: faFileInvoice,
    color: 'bg-green-50 text-green-600',
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
