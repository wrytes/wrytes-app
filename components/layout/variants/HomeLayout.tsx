import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faBars,
  faTimes,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import { COMPANY } from '@/lib/constants';
import Footer from '@/components/layout/footers/Footer';
import { HOME_NAVIGATION } from '@/lib/navigation/home';

interface HomeLayoutProps {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-base text-text-primary">
      {/* Home Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-base">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-white" />
              </div>
              <Link href="/" className="text-xl font-bold text-text-primary">
                {COMPANY.name.split(' ')[0]}
                <span className="text-brand">.</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {HOME_NAVIGATION.map(item => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="text-text-secondary hover:text-brand transition-colors text-sm uppercase tracking-wide"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTA Button */}
            {/* TODO: remove min-w-32 after activating button again */}
            <div className="hidden md:flex items-center gap-4 min-w-28">
              {/* <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
              >
                Get Started
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
              </Link> */}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-text-secondary hover:text-brand transition-colors"
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-surface pt-4">
              <nav className="space-y-4">
                {HOME_NAVIGATION.map(item => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="text-text-secondary hover:text-brand transition-colors text-sm uppercase tracking-wide"
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Mobile CTA Button */}
                <div></div>
                {/* <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                  onClick={closeMobileMenu}
                >
                  Get Started
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
                </Link> */}
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="">{children}</main>
      <Footer />
    </div>
  );
}
