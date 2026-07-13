import React from 'react';
import { useRouter } from 'next/router';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import AppLayout from '@/components/layout/AppLayout';
import { DOCS_NAVIGATION } from '@/lib/navigation/docs';
import WalletButton from '@/components/layout/actions/WalletButton';

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/docs') return router.pathname === '/docs';
    return decodeURIComponent(router.asPath).startsWith(decodeURIComponent(path));
  };

  return (
    <AppLayout
      logo={{ icon: faLightbulb, subtitle: 'Docs' }}
      navItems={DOCS_NAVIGATION}
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
