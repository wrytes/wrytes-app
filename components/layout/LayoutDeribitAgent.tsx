import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
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

function Sidebar({
  items,
  isActive,
  onItemClick,
  variant,
}: {
  items: DeribitNavItem[];
  isActive: (path: string) => boolean;
  onItemClick: () => void;
  variant: 'desktop' | 'mobile';
}) {
  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200',
      active
        ? 'text-brand bg-brand/20'
        : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm'
    );

  if (variant === 'mobile') {
    return (
      <nav className="space-y-4">
        <div className="space-y-4">
          {items.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={linkClass(isActive(item.path))}
              onClick={onItemClick}
            >
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="px-4 py-6">
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={linkClass(isActive(item.path))}
              onClick={onItemClick}
            >
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function LayoutDeribitAgent({ children }: LayoutDeribitAgentProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isActive } = useActiveNavigation();

  const closeSidebar = () => setIsSidebarOpen(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-base text-text-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-base print:hidden">
        <div className="mx-auto max-md:px-4 px-5 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-white" />
              </div>
              <Link href="/deribit" className="text-xl font-bold text-text-primary">
                Deribit
                <span className="text-brand">.</span>
                <span className="text-text-secondary text-base font-normal ml-1">Agent</span>
              </Link>
            </div>

            {/* Agent status */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
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
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center gap-2">
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
            <div className="md:hidden mt-4 border-t border-surface pt-4">
              <Sidebar
                items={DERIBIT_NAVIGATION}
                isActive={isActive}
                onItemClick={closeMobileMenu}
                variant="mobile"
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex pt-16 min-h-screen">
        {/* Overlay */}
        {(isSidebarOpen || isMobileMenuOpen) && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => {
              closeSidebar();
              closeMobileMenu();
            }}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            'fixed left-0 top-16 w-64 -mt-0.5 h-screen bg-base transform transition-transform duration-300 ease-in-out z-50 print:hidden',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'md:translate-x-0'
          )}
        >
          <Sidebar
            items={DERIBIT_NAVIGATION}
            isActive={isActive}
            onItemClick={closeSidebar}
            variant="desktop"
          />
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 xl:px-12 md:ml-64 print:ml-0 print:px-0 flex flex-col">
          <div className="flex-1">{children}</div>
          <FooterSimple />
        </main>
      </div>
    </div>
  );
}
