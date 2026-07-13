import React from 'react';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import AppLayout from '@/components/layout/AppLayout';

interface SimpleLayoutProps {
  children: React.ReactNode;
  logo?: {
    icon: IconDefinition;
    subtitle?: string;
  };
  /** 'top' centers horizontally only (long-form content). 'full' also centers
   * vertically, dead-centering a small block (404/auth screens). Default: 'top' */
  center?: 'top' | 'full';
}

export default function SimpleLayout({ children, logo, center = 'top' }: SimpleLayoutProps) {
  return (
    <AppLayout
      logo={{ icon: logo?.icon ?? faLightbulb, subtitle: logo?.subtitle }}
      centerContent={center === 'full' ? 'full' : true}
    >
      {children}
    </AppLayout>
  );
}
