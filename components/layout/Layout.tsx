import React from 'react';
import { useRouter } from 'next/router';
import { faGavel } from '@fortawesome/free-solid-svg-icons';
import HomeLayout from './variants/HomeLayout';
import DashboardLayout from './variants/DashboardLayout';
import DocsLayout from './variants/DocsLayout';
import SimpleLayout from './SimpleLayout';
import DeribitAgentLayout from './variants/DeribitAgentLayout';
import RoutesLayout from './variants/RoutesLayout';
import InvoicesLayout from './variants/InvoicesLayout';
import CoinTrackingLayout from './variants/CoinTrackingLayout';

interface LayoutProps {
  children: React.ReactNode;
}

const CENTER_LAYOUT_PATHS = ['/404', '/auth'];
const SIMPLE_LAYOUT_PATHS = ['/legal'];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = router.pathname;

  if (pathname === '/') {
    return <HomeLayout>{children}</HomeLayout>;
  }

  if (pathname.startsWith('/routes')) {
    return <RoutesLayout>{children}</RoutesLayout>;
  }

  if (pathname.startsWith('/invoices')) {
    return <InvoicesLayout>{children}</InvoicesLayout>;
  }

  if (pathname.startsWith('/coin-tracking')) {
    return <CoinTrackingLayout>{children}</CoinTrackingLayout>;
  }

  if (pathname.startsWith('/deribit-agent')) {
    return <DeribitAgentLayout>{children}</DeribitAgentLayout>;
  }

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  if (pathname.startsWith('/docs')) {
    return <DocsLayout>{children}</DocsLayout>;
  }

  if (CENTER_LAYOUT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return <SimpleLayout center="full">{children}</SimpleLayout>;
  }

  if (SIMPLE_LAYOUT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return <SimpleLayout logo={{ icon: faGavel, subtitle: 'Legal' }}>{children}</SimpleLayout>;
  }

  return <SimpleLayout>{children}</SimpleLayout>;
}
