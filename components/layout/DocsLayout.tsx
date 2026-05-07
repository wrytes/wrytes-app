import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faTimes,
  faLightbulb,
  faBook,
  faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { COMPANY } from '@/lib/constants';
import FooterSimple from '@/components/layout/FooterSimple';
import NavbarWallet from '@/components/layout/NavbarWallet';

interface DocsLayoutProps {
  children: React.ReactNode;
}

const DOCS_NAV = [
  { label: 'Get Started', path: '/docs/0001_Get%20Started', icon: faBook },
  { label: 'Search', path: '/docs', icon: faMagnifyingGlass },
];

export default function DocsLayout({ children }: DocsLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isActive = (path: string) => {
    if (path === '/docs') return router.pathname === '/docs';
    return decodeURIComponent(router.asPath).startsWith(decodeURIComponent(path));
  };

  return (
    <div className="min-h-screen bg-base text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-base">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-white" />
              </div>
              <Link href="/" className="text-xl font-bold text-text-primary">
                {COMPANY.name.split(' ')[0]}
                <span className="text-brand">.</span>
                <span className="text-text-secondary text-base font-normal ml-1">Docs</span>
              </Link>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {DOCS_NAV.map(item => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
                    isActive(item.path)
                      ? 'text-brand bg-brand/20'
                      : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm'
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <NavbarWallet />

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(v => !v)}
                className="p-2 flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
              >
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 border-t border-surface pt-4 pb-2">
              <nav className="space-y-1">
                {DOCS_NAV.map(item => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200',
                      isActive(item.path)
                        ? 'text-brand bg-brand/20'
                        : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm'
                    )}
                    onClick={closeMobileMenu}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu} />
      )}

      {/* Content */}
      <main className="pt-16 min-h-screen flex flex-col">
        <div className="container mx-auto px-4 flex-1 flex flex-col print:px-0">
          <div className="flex-1">{children}</div>
          <FooterSimple />
        </div>
      </main>
    </div>
  );
}
