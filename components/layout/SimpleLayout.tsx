import React from 'react';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import AppLayout from '@/components/layout/AppLayout';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

export default function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <AppLayout logo={{ icon: faLightbulb, subtitle: 'Legal' }} centerContent>
      {children}
    </AppLayout>
  );
}
