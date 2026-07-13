import React from 'react';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { DASHBOARD_NAVIGATION } from '@/lib/navigation/dashboard';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';
import { useAuth } from '@/hooks/useAuth';
import WalletButton from '@/components/layout/actions/WalletButton';
import AppLayout from '@/components/layout/AppLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const isAdmin = user?.scopes?.includes('ADMIN') ?? false;
  const visibleNav = DASHBOARD_NAVIGATION.filter(item => !item.adminOnly || isAdmin);
  const { isActive } = useActiveNavigation();

  return (
    <AppLayout
      logo={{ icon: faLightbulb, subtitle: 'Dashboard' }}
      navItems={visibleNav}
      isActive={isActive}
      headerRight={<WalletButton />}
      mobileExtra={
        <div className="flex justify-end">
          <WalletButton />
        </div>
      }
    >
      {children}
    </AppLayout>
  );
}
