import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faWallet, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { COMPANY } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { AuthModal } from '@/components/auth/AuthModal';
import { SidebarDocs } from '@/components/navigation/SidebarDocs';
import FooterSimple from '@/components/layout/FooterSimple';

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated } = useAuth();
  const { address: walletAddress, isConnected } = useWallet();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleOverlayClick = () => {
    closeSidebar();
    closeMobileMenu();
  };

  return (
    <div className="min-h-screen bg-gradient-dark text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-surface">
        <div className="mx-auto max-md:px-4 px-16 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <Link href="/" className="text-xl font-bold text-white">
                  {COMPANY.name.split(' ')[0]}
                  <span className="text-brand">.</span>
                </Link>
                <span className="text-text-secondary text-sm hidden sm:inline">/ Docs</span>
              </div>
            </div>

            {/* Desktop wallet */}
            <div className="hidden md:flex items-center gap-3">
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
                  className="inline-flex items-center gap-2 text-white hover:text-brand transition-colors text-sm font-medium"
                >
                  <p className="text-white font-mono text-sm hover:text-brand transition-colors">
                    {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                  </p>
                </button>
              )}
            </div>

            {/* Mobile toggle */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleMobileMenu}
                className="p-2 flex items-center justify-center text-text-secondary hover:text-brand transition-colors"
              >
                <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 border-t border-surface pt-4">
              <SidebarDocs onItemClick={closeMobileMenu} variant="mobile" />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex pt-16 min-h-screen">
        {(isSidebarOpen || isMobileMenuOpen) && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={handleOverlayClick} />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 mt-1 w-64 h-screen bg-base border-r border-brand/20 transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        >
          <SidebarDocs onItemClick={closeSidebar} variant="desktop" />
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 md:ml-64 flex flex-col">
          <div className="flex-1">{children}</div>
          <FooterSimple />
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </div>
  );
}
