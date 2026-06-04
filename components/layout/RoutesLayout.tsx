import React from 'react';
import { faRoute } from '@fortawesome/free-solid-svg-icons';
import { ROUTES_NAVIGATION } from '@/lib/navigation/routes';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';
import WalletButton from '@/components/layout/WalletButton';
import AppLayout from '@/components/layout/AppLayout';

interface RoutesLayoutProps {
  children: React.ReactNode;
}

export default function RoutesLayout({ children }: RoutesLayoutProps) {
  const { isActive } = useActiveNavigation();

  return (
    <AppLayout
      logo={{ icon: faRoute, subtitle: 'Routes' }}
      navItems={ROUTES_NAVIGATION}
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
