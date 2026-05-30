import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

export interface NavItem {
  label: string;
  path: string;
  icon?: IconDefinition;
  description?: string;
  badge?: string;
  disabled?: boolean;
  /** Filtered out before passing to AppLayout — used by DashboardLayout only */
  adminOnly?: boolean;
}
