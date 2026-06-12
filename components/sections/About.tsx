import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import { COMPANY } from '@/lib/constants';

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

        <div className="grid md:grid-cols-2 gap-12 items-center">
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
      </div>
    </section>
  );
}
