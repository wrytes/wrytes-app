import React from 'react';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faTelegram, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { faExternalLinkAlt, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Image from 'next/image';
import { SOCIAL, COMPANY } from '@/lib/constants';
import packageInfo from '../../package.json';

interface FooterItemProps {
  link: string;
  text: string;
  icon: IconProp;
  external?: boolean;
}

export function FooterItem({ link, text, icon, external = true }: FooterItemProps) {
  const className =
    'flex items-center gap-2 text-text-secondary hover:text-brand transition-colors';

  if (external) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className={className}>
        <FontAwesomeIcon icon={icon} className="w-4 h-4" />
        <span className="sm:inline">{text}</span>
      </a>
    );
  }

  return (
    <Link href={link} className={className}>
      <FontAwesomeIcon icon={icon} className="w-4 h-4" />
      <span className="sm:inline">{text}</span>
    </Link>
  );
}

export default function Footer() {
  const date = new Date();
  const year = date.getFullYear();

  return (
    <footer className="bg-base border-t border-card py-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div className="flex flex-col items-left gap-4">
            <div className="flex flex-row gap-4">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <FontAwesomeIcon icon={faLightbulb} className="w-4 h-4 text-white" />
              </div>
              <Link href="/" className="text-xl font-bold text-white">
                {COMPANY.name.split(' ')[0]}
                <span className="text-brand">.</span>
              </Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-text-primary font-semibold mb-6">Company</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={COMPANY.registry}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-text-secondary hover:text-brand transition-colors text-sm"
                >
                  Company Register
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="w-3 h-3" />
                </a>
              </li>
              <li>
                <span className="text-text-secondary text-sm">{COMPANY.uid}</span>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-text-primary font-semibold mb-6">Community</h3>
            <ul className="space-y-4">
              <li>
                <FooterItem link={SOCIAL.Github_user} text="GitHub" icon={faGithub} />
              </li>
              <li>
                <FooterItem link={SOCIAL.Twitter} text="Twitter" icon={faXTwitter} />
              </li>
              <li>
                <FooterItem link={SOCIAL.Telegram} text="Telegram" icon={faTelegram} />
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-text-primary font-semibold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/legal/notice"
                  className="text-text-secondary hover:text-brand transition-colors text-sm"
                >
                  Legal Notice
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-text-secondary hover:text-brand transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="text-text-secondary hover:text-brand transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/disclaimer"
                  className="text-text-secondary hover:text-brand transition-colors text-sm"
                >
                  Risk Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-card pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-text-muted text-sm">
            © {year} {COMPANY.name}. All rights reserved.
          </div>
          <div className="text-text-muted text-xs">Application Version {packageInfo.version}</div>
        </div>
      </div>
    </footer>
  );
}
