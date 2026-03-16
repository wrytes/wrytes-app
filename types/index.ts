// Common types for the application

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ServiceCardProps {
  title: string;
  description: string;
  features: string[];
  icon?: React.ReactNode;
  className?: string;
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  href?: string;
  target?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
}

export interface NavItem {
  name: string;
  href: string;
  external?: boolean;
}

// Re-export component types for convenience
export type { StatCardProps, StatGridProps, StatCardSkeletonProps } from '@/components/ui/Stats';
export type { ModalProps, ConfirmModalProps } from '@/components/ui/Modal';
export type { PageHeaderProps, SectionProps, BreadcrumbProps } from '@/components/ui/Layout';
export type { 
  DashboardStatsProps, 
  RecentActivityProps, 
  ActivityItem 
} from '@/components/features/Dashboard';
export type { UseModalReturn } from '@/hooks/ui/types';