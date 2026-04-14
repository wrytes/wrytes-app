import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faWallet, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { COMPANY } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { AuthModal } from '@/components/auth/AuthModal';
import { SidebarNav } from '@/components/navigation/SidebarNav';
import { DASHBOARD_NAVIGATION } from '@/lib/navigation/dashboard';
import { useActiveNavigation } from '@/hooks/useActiveNavigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, signOut, user } = useAuth();
  const { address: walletAddress, isConnected } = useWallet();
  const { isActive } = useActiveNavigation();

  const displayName = user?.telegramHandle
    ? `@${user.telegramHandle}`
    : user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : null;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleOverlayClick = () => {
    closeSidebar();
    closeMobileMenu();
  };

  const handleCTAClick = () => {
    if (!isConnected) {
      setShowAuthModal(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show disclaimer toast when dashboard loads
  useEffect(() => {
    if (showDisclaimer) {
      setTimeout(() => {
        setShowDisclaimer(false);
      }, 30000);
    }
  }, [showDisclaimer]);

  return (
    <div className="min-h-screen bg-gradient-dark text-text-primary">
      {/* Dashboard Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-card border-b border-dark-surface">
        <div className="mx-auto max-md:px-4 px-16 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-accent-orange rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-white" />
              </div>
              <Link href="/" className="text-xl font-bold text-white">
                {COMPANY.name.split(' ')[0]}
                <span className="text-accent-orange">.</span>
              </Link>
            </div>

            {/* Desktop CTA Button */}
            <div className="hidden md:flex items-center gap-3">
              {!isConnected ? (
                <button
                  type="button"
                  onClick={handleCTAClick}
                  className="inline-flex items-center gap-2 bg-accent-orange text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faWallet} className="w-3 h-3" />
                  Connect Wallet
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-2 text-white hover:text-accent-orange transition-colors text-sm font-medium"
                  title="Click to manage wallet"
                >
                  <div className="text-right">
                    {displayName ? (
                      <>
                        <p className="text-white font-medium text-sm leading-tight">
                          {displayName}
                        </p>
                        <p className="text-gray-500 font-mono text-xs hover:text-accent-orange transition-colors">
                          {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-400">Connected as</p>
                        <p className="text-white font-mono text-sm hover:text-accent-orange transition-colors">
                          {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                        </p>
                      </>
                    )}
                  </div>
                </button>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleMobileMenu}
                className="p-2 flex items-center justify-center text-text-secondary hover:text-accent-orange transition-colors"
              >
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 border-t border-dark-surface pt-4">
              <SidebarNav
                items={DASHBOARD_NAVIGATION}
                isActive={isActive}
                onItemClick={closeMobileMenu}
                variant="mobile"
              />
              {!isConnected ? (
                <div className="flex justify-end items-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleCTAClick();
                      closeMobileMenu();
                    }}
                    className="inline-flex items-center gap-2 bg-accent-orange text-white px-4 py-2 mt-4 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                  >
                    <FontAwesomeIcon icon={faWallet} className="w-3 h-3" />
                    Connect Wallet
                  </button>
                </div>
              ) : (
                <div className="flex justify-end items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(true);
                      closeMobileMenu();
                    }}
                    className="inline-flex gap-2 mt-4 text-white hover:text-accent-orange transition-colors text-sm font-medium"
                    title="Click to manage wallet"
                  >
                    <div className="text-right">
                      {displayName ? (
                        <>
                          <p className="text-white font-medium text-sm leading-tight">
                            {displayName}
                          </p>
                          <p className="text-gray-500 font-mono text-xs">
                            {walletAddress?.slice(0, 6)}…{walletAddress?.slice(-4)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-400">Connected as</p>
                          <p className="text-white font-mono text-sm">
                            {walletAddress?.slice(0, 8)}…{walletAddress?.slice(-6)}
                          </p>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex pt-16">
        {/* Sidebar Overlay */}
        {(isSidebarOpen || isMobileMenuOpen) && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={handleOverlayClick} />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed left-0 top-16 mt-1 w-64 h-screen bg-dark-bg border-r border-accent-orange/20 transform transition-transform duration-300 ease-in-out z-50 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        >
          <SidebarNav
            items={DASHBOARD_NAVIGATION}
            isActive={isActive}
            onItemClick={closeSidebar}
            variant="desktop"
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 md:ml-64">
          <div
            className={`bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-8 ${showDisclaimer ? '' : 'hidden'}`}
          >
            <p className="text-text-secondary text-sm font-medium">
              <strong className="text-white">
                ⚠️ Wrytes.io focuses on providing software development tools and accurate data for
                Distributed Ledger Technology protocols. We do not audit or endorse protocols -
                users must conduct their own due diligence.
              </strong>
            </p>
          </div>
          <div>{children}</div>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}
