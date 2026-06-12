import Image from 'next/image';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import Card from '@/components/ui/Card';
import { INTEGRATIONS } from '@/lib/integrations';

export default function Integrations() {
  return (
    <section id="integrations" className="py-24 bg-base">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Technology Integrations & Protocol Adapters
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Our software development expertise spans multiple platforms and protocols, building
            robust adapters and integrations that bridge real-world operations with cutting-edge technology.
          </p>
        </motion.div>

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
                <p className="text-text-secondary text-sm leading-relaxed">
                  {integration.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
