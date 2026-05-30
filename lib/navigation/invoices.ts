import { faFileInvoiceDollar, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from './types';

export const INVOICES_NAVIGATION: NavItem[] = [
  {
    label: 'Invoices',
    path: '/invoices',
    icon: faFileInvoiceDollar,
    description: 'Create and send invoices — receivables',
  },
  {
    label: 'Bills',
    path: '/invoices/bills',
    icon: faFileInvoice,
    description: 'Upload bills for AI extraction and payment — payables',
  },
];
