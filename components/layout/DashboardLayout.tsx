import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faWallet, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { COMPANY } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { AuthModal } from '@/components/auth/AuthModal';
import FooterSimple from '@/components/layout/FooterSimple';
import { DASHBOARD_NAVIGATION, NavigationItem } from '@/lib/navigation/dashboard';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function NavLinks({
  items,
  isActive,
  onItemClick,
  variant,
}: {
  items: NavigationItem[];
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
              item.disabled && 'pointer-events-none opacity-40',
              isActive(item.path)
                ? 'text-brand bg-brand/20'
                : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm'
            )}
          >
            <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5" />
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
          <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, signOut, user } = useAuth();
  const isAdmin = user?.scopes?.includes('ADMIN') ?? false;
  const visibleNav = DASHBOARD_NAVIGATION.filter(item => !item.adminOnly || isAdmin);
  const { address: walletAddress, isConnected } = useWallet();
  const { isActive } = useActiveNavigation();

  const displayName = user?.telegramHandle
    ? `@${user.telegramHandle}`
    : user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : null;

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
                <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-white" />
              </div>
              <Link href="/" className="text-xl font-bold text-text-primary">
                {COMPANY.name.split(' ')[0]}
                <span className="text-brand">.</span>
                <span className="text-text-secondary text-base font-normal ml-1">Dashboard</span>
              </Link>
            </div>

            {/* Desktop nav */}
            <NavLinks items={visibleNav} isActive={isActive} variant="desktop" />

            {/* Desktop wallet */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faWallet} className="w-3 h-3" />
                  Connect Wallet
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-2 text-text-primary hover:text-brand transition-colors text-sm font-medium"
                  title="Click to manage wallet"
                >
                  <div className="text-right">
                    {displayName ? (
                      <>
                        <p className="text-text-secondary font-medium text-sm leading-tight">
                          {displayName}
                        </p>
                        <p className="text-text-muted font-mono text-xs hover:text-brand transition-colors">
                          {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-text-muted">Connected as</p>
                        <p className="text-text-primary font-mono text-sm hover:text-brand transition-colors">
                          {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                        </p>
                      </>
                    )}
                  </div>
                </button>
              )}
            </div>

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
              <NavLinks
                items={visibleNav}
                isActive={isActive}
                onItemClick={closeMobileMenu}
                variant="mobile"
              />
              <div className="mt-4 flex justify-end">
                {!isConnected ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(true);
                      closeMobileMenu();
                    }}
                    className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                  >
                    <FontAwesomeIcon icon={faWallet} className="w-3 h-3" />
                    Connect Wallet
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(true);
                      closeMobileMenu();
                    }}
                    className="inline-flex gap-2 text-text-primary hover:text-brand transition-colors text-sm font-medium"
                    title="Click to manage wallet"
                  >
                    <div className="text-right">
                      {displayName ? (
                        <>
                          <p className="text-text-primary font-medium text-sm leading-tight">
                            {displayName}
                          </p>
                          <p className="text-text-muted font-mono text-xs">
                            {walletAddress?.slice(0, 6)}…{walletAddress?.slice(-4)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-text-muted">Connected as</p>
                          <p className="text-text-primary font-mono text-sm">
                            {walletAddress?.slice(0, 8)}…{walletAddress?.slice(-6)}
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                )}
              </div>
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}
