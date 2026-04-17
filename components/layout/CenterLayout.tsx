import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { COMPANY } from '@/lib/constants';
import FooterSimple from '@/components/layout/FooterSimple';

interface CenterLayoutProps {
  children: React.ReactNode;
}

export default function CenterLayout({ children }: CenterLayoutProps) {
  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-surface">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              {COMPANY.name.split(' ')[0]}
              <span className="text-brand">.</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center pt-20 px-6 pb-8">
        {children}
      </main>

      <FooterSimple />
    </div>
  );
}
