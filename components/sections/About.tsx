import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExternalLinkAlt,
  faBook,
  faChartLine,
  faRoute,
  faFileInvoice,
  faRobot,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import Card from '@/components/ui/Card';
import { COMPANY, INTEGRATIONS } from '@/lib/constants';

const MINI_APPS: { id: string; name: string; description: string; href: string; icon: IconDefinition; color: string }[] = [
  {
    id: 'docs',
    name: 'Documentation',
    description: 'Technical references, API guides, and integration documentation for the Wrytes platform.',
    href: '/docs',
    icon: faBook,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Live portfolio overview with vault positions, yields, and cross-protocol performance metrics.',
    href: '/dashboard',
    icon: faChartLine,
    color: 'bg-brand/10 text-brand',
  },
  {
    id: 'routes',
    name: 'Routes',
    description: 'Cross-protocol routing engine for optimal multi-step transaction execution paths.',
    href: '/routes',
    icon: faRoute,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'invoices',
    name: 'Invoices',
    description: 'On-chain invoice management and payment tracking powered by Frankencoin.',
    href: '/invoices',
    icon: faFileInvoice,
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 'deribit-agent',
    name: 'Deribit Agent',
    description: 'Automated Bitcoin options strategy agent with real-time Deribit API integration.',
    href: '/deribit-agent',
    icon: faRobot,
    color: 'bg-amber-50 text-amber-600',
  },
];

export default function About() {
  return (
    <section id="about" className="py-24 bg-surface">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">
            About {COMPANY.name}
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            {COMPANY.description}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          {/* The Meaning Behind Wrytes */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card hover className="h-full mb-5">
              <h3 className="text-2xl font-bold mb-4 text-text-primary">
                The Meaning Behind Wrytes
              </h3>
              <p className="text-text-secondary mb-4 leading-relaxed">
                Our name combines <strong className="text-text-primary">&quot;write&quot;</strong>{' '}
                and <strong className="text-text-primary">&quot;rights&quot;</strong> - reflecting
                our mission to write software that empowers digital ownership, transparency, and
                innovation through Distributed Ledger Technologies.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand rounded-full" />
                  <span className="text-text-secondary">
                    Smart contracts, APIs, automation systems, and governance tools
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand rounded-full" />
                  <span className="text-text-secondary">
                    Full-stack development from protocols to user interfaces
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand rounded-full" />
                  <span className="text-text-secondary">
                    Advanced adapters, integrations, and monitoring systems
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand rounded-full" />
                  <span className="text-text-secondary">
                    Independent innovation funded through long-term asset management
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Location Highlight */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card hover gradient className="h-full text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 bg-brand rounded-full animate-pulse" />
                </div>
                <h3 className="text-2xl font-bold text-text-primary mb-2">{COMPANY.location}</h3>
                <p className="text-text-secondary">Global Financial Technology Hub</p>
              </div>
              <p className="text-text-secondary leading-relaxed text-left">
                Located in Switzerland&apos;s dynamic tech ecosystem, leveraging regulatory
                frameworks for advanced Distributed-Ledger Technology business capabilities.
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Technology Integrations & Protocol Adapters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-text-primary mb-4">
              Technology Integrations & Protocol Adapters
            </h3>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Our software development expertise spans multiple Distributed Ledger ecosystems,
              creating robust adapters and integrations that bridge traditional business needs with
              cutting-edge technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {INTEGRATIONS.map((integration, index) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card hover className="h-full group hover:shadow-lg transition-all duration-300">
                  {/* Icon and Title */}
                  <div className="mb-4">
                    <div className="w-12 h-12 flex items-center justify-center mb-3 group-hover:bg-brand/30 rounded-lg transition-colors overflow-hidden">
                      <Image
                        src={integration.icon}
                        alt={`${integration.name} logo`}
                        width={32}
                        height={32}
                        className="object-contain rounded-lg"
                      />
                    </div>
                    <a
                      href={integration.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-text-primary font-semibold hover:text-brand transition-colors group/link"
                    >
                      <span>{integration.name}</span>
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        className="w-3 h-3 opacity-60 group-hover/link:opacity-100 transition-opacity"
                      />
                    </a>
                  </div>

                  {/* Description */}
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {integration.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mini Applications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-text-primary mb-4">
              Built-in Mini Applications
            </h3>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Standalone tools and interfaces built directly into the platform — each one purpose-built
              for a specific workflow within our DLT and trading operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {MINI_APPS.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <a href={app.href}>
                  <Card hover className="h-full group hover:shadow-lg transition-all duration-300 cursor-pointer">
                    <div className="mb-4">
                      <div className={`w-12 h-12 flex items-center justify-center mb-3 rounded-lg transition-colors ${app.color}`}>
                        <FontAwesomeIcon icon={app.icon} className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2 text-text-primary font-semibold group-hover:text-brand transition-colors">
                        <span>{app.name}</span>
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm leading-relaxed">{app.description}</p>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
