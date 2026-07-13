import React from 'react';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { DERIBIT_NAVIGATION } from '@/lib/navigation/deribit';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';
import WalletButton from '@/components/layout/actions/WalletButton';
import AppLayout from '@/components/layout/AppLayout';

interface DeribitAgentLayoutProps {
  children: React.ReactNode;
}

export default function DeribitAgentLayout({ children }: DeribitAgentLayoutProps) {
  const { isActive } = useActiveNavigation();

  return (
    <AppLayout
      logo={{ icon: faRobot, brand: 'Deribit', subtitle: 'Agent' }}
      navItems={DERIBIT_NAVIGATION}
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
