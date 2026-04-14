import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { COMPANY } from '@/lib/constants';
import packageInfo from '../../package.json';

interface CenterLayoutProps {
  children: React.ReactNode;
}

export default function CenterLayout({ children }: CenterLayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg text-text-primary flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-card border-b border-dark-surface">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-orange rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              {COMPANY.name.split(' ')[0]}
              <span className="text-accent-orange">.</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center pt-20 px-6 pb-8">
        {children}
      </main>

      <footer className="border-t border-dark-card py-4">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-text-muted text-sm">
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </span>
          <span className="text-text-muted text-xs">
            Application Version {packageInfo.version}
          </span>
        </div>
      </footer>
    </div>
  );
}
