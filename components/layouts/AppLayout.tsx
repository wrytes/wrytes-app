import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { cn } from '@/lib/utils';
import { COMPANY } from '@/lib/constants';
import FooterSimple from '@/components/layouts/footers/FooterSimple';
import type { NavItem } from '@/lib/navigation/types';

interface AppLayoutProps {
  children: React.ReactNode;
  logo: {
    icon: IconDefinition;
    /** Defaults to the first word of COMPANY.name */
    brand?: string;
    subtitle?: string;
    /** Defaults to '/' */
    href?: string;
  };
  navItems?: NavItem[];
  isActive?: (path: string) => boolean;
  /**
   * Rendered in the header between nav and hamburger.
   * Hidden on mobile — use mobileExtra for mobile-visible content.
   */
  headerRight?: React.ReactNode;
  /**
   * Rendered below nav links in the mobile menu.
   * Any click inside auto-closes the mobile panel.
   */
  mobileExtra?: React.ReactNode;
  /**
   * Centers page content horizontally. `'full'` also centers vertically
   * (dead-centers a small block, e.g. 404/auth screens). Default: false
   */
  centerContent?: boolean | 'full';
}

function NavLinks({
  items,
  isActive,
  onItemClick,
  variant,
}: {
  items: NavItem[];
  isActive: (path: string) => boolean;
  onItemClick?: () => void;
  variant: 'desktop' | 'mobile';
}) {
  if (!items.length) return null;

  if (variant === 'desktop') {
    return (
      <nav className="hidden md:flex items-center gap-1">
        {items.map(item => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200',
              item.disabled && 'pointer-events-none opacity-40',
              isActive(item.path)
                ? 'text-brand bg-brand/20'
                : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm'
            )}
          >
            {item.icon && <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5" />}
            {item.label}
            {item.badge && (
              <span className="text-xs bg-brand/20 text-brand px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="space-y-1">
      {items.map(item => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200',
            item.disabled && 'pointer-events-none opacity-40',
            isActive(item.path)
              ? 'text-brand bg-brand/20'
              : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm'
          )}
          onClick={onItemClick}
        >
          {item.icon && <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />}
          {item.label}
          {item.badge && (
            <span className="text-xs bg-brand/20 text-brand px-1.5 py-0.5 rounded-full ml-auto">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export default function AppLayout({
  children,
  logo,
  navItems = [],
  isActive = () => false,
  headerRight,
  mobileExtra,
  centerContent = false,
}: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const brand = logo.brand ?? COMPANY.name.split(' ')[0];
  const hasMobileMenu = navItems.length > 0 || Boolean(mobileExtra);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-base text-text-primary flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-base print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={logo.icon} className="w-4 h-4 text-white" />
              </div>
              <Link href={logo.href ?? '/'} className="text-xl font-bold text-text-primary">
                {brand}
                <span className="text-brand">.</span>
                {logo.subtitle && (
                  <span className="text-text-secondary text-base font-normal ml-1">
                    {logo.subtitle}
                  </span>
                )}
              </Link>
            </div>

            {/* Desktop nav */}
            <NavLinks items={navItems} isActive={isActive} variant="desktop" />

            {/* Header right — desktop only */}
            {headerRight && (
              <div className="hidden md:flex items-center gap-3 shrink-0">{headerRight}</div>
            )}

            {/* Mobile hamburger */}
            {hasMobileMenu && (
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(v => !v)}
                  className="p-2 flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
                >
                  <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile panel */}
          {hasMobileMenu && isMobileMenuOpen && (
            <div className="md:hidden mt-4 border-t border-surface pt-4 pb-2">
              <NavLinks
                items={navItems}
                isActive={isActive}
                onItemClick={closeMobileMenu}
                variant="mobile"
              />
              {mobileExtra && (
                <div className="mt-4" onClick={closeMobileMenu}>
                  {mobileExtra}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={closeMobileMenu} />
      )}

      {/* Content */}
      {centerContent ? (
        <>
          <main
            className={cn(
              'flex-1 flex flex-col items-center pt-20 px-6 pb-8',
              centerContent === 'full' && 'justify-center'
            )}
          >
            {children}
          </main>
          <FooterSimple />
        </>
      ) : (
        <main className="pt-16 flex-1 flex flex-col">
          <div className="container mx-auto px-4 flex-1 flex flex-col print:px-0">
            <div className="flex-1">{children}</div>
            <FooterSimple />
          </div>
        </main>
      )}
    </div>
  );
}
