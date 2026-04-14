import React from 'react';
import { useRouter } from 'next/router';
import HomeLayout from './HomeLayout';
import DashboardLayout from './DashboardLayout';
import SimpleLayout from './SimpleLayout';
import CenterLayout from './CenterLayout';

interface LayoutProps {
  children: React.ReactNode;
}

const CENTER_LAYOUT_PATHS = ['/404', '/auth'];
const SIMPLE_LAYOUT_PATHS = ['/legal'];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = router.pathname;

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  if (CENTER_LAYOUT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return <CenterLayout>{children}</CenterLayout>;
  }

  if (SIMPLE_LAYOUT_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return <SimpleLayout>{children}</SimpleLayout>;
  }

  return <HomeLayout>{children}</HomeLayout>;
}
