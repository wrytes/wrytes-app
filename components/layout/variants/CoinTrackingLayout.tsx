import React from 'react';
import { faCoins } from '@fortawesome/free-solid-svg-icons';
import { COIN_TRACKING_NAVIGATION } from '@/lib/navigation/coin-tracking';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';
import WalletButton from '@/components/layout/actions/WalletButton';
import AppLayout from '@/components/layout/AppLayout';

interface CoinTrackingLayoutProps {
  children: React.ReactNode;
}

export default function CoinTrackingLayout({ children }: CoinTrackingLayoutProps) {
  const { isActive } = useActiveNavigation();

  return (
    <AppLayout
      logo={{ icon: faCoins, subtitle: 'Coin Tracking' }}
      navItems={COIN_TRACKING_NAVIGATION}
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
