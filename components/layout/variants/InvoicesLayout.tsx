import React from 'react';
import { faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import { INVOICES_NAVIGATION } from '@/lib/navigation/invoices';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';
import WalletButton from '@/components/layout/actions/WalletButton';
import AppLayout from '@/components/layout/AppLayout';

interface InvoicesLayoutProps {
  children: React.ReactNode;
}

export default function InvoicesLayout({ children }: InvoicesLayoutProps) {
  const { isActive } = useActiveNavigation();

  return (
    <AppLayout
      logo={{ icon: faFileInvoiceDollar, subtitle: 'Invoices' }}
      navItems={INVOICES_NAVIGATION}
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
