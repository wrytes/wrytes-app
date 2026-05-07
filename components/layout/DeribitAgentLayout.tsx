import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faRobot } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { DERIBIT_NAVIGATION, DeribitNavItem } from '@/lib/navigation/deribit';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';
import FooterSimple from '@/components/layout/FooterSimple';

interface LayoutDeribitAgentProps {
  children: React.ReactNode;
}

const AGENT_URL = process.env.NEXT_PUBLIC_DERIBIT_AGENT_URL ?? '';
const isConfigured = Boolean(AGENT_URL);

function NavLinks({
  items,
  isActive,
  onItemClick,
  variant,
}: {
  items: DeribitNavItem[];
  isActive: (path: string) => boolean;
  onItemClick?: () => void;
  variant: 'desktop' | 'mobile';
}) {
  if (variant === 'desktop') {
    return (
      <nav className="hidden md:flex items-center gap-1">
        {items.map(item => (
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
            isActive(item.path)
              ? 'text-brand bg-brand/20'
              : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm'
          )}
          onClick={onItemClick}
        >
          <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default function DeribitAgentLayout({ children }: LayoutDeribitAgentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isActive } = useActiveNavigation();

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-base text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-base print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-white" />
              </div>
              <Link href="/" className="text-xl font-bold text-text-primary">
                Deribit
                <span className="text-brand">.</span>
                <span className="text-text-secondary text-base font-normal ml-1">Agent</span>
              </Link>
            </div>

            {/* Desktop nav */}
            <NavLinks items={DERIBIT_NAVIGATION} isActive={isActive} variant="desktop" />

            {/* Agent status */}
            <div className="hidden md:flex items-center gap-2 shrink-0 text-sm">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConfigured ? 'bg-green-500' : 'bg-text-muted'
                )}
              />
              <span className="text-text-muted">
                {isConfigured ? 'Agent connected' : 'Agent not configured'}
              </span>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(v => !v)}
                className="p-2 flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
              >
                <FontAwesomeIcon
                  icon={isMobileMenuOpen ? faTimes : faBars}
                  className="w-5 h-5"
                />
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 border-t border-surface pt-4 pb-2">
              <NavLinks
                items={DERIBIT_NAVIGATION}
                isActive={isActive}
                onItemClick={closeMobileMenu}
                variant="mobile"
              />
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
