import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import Card from '@/components/ui/Card';
import { MINI_APPS } from '@/lib/miniapps';

export default function MiniApps() {
  return (
    <section id="mini-apps" className="py-24 bg-surface">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Built-in Mini Applications
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Standalone tools and interfaces built directly into the platform — each one purpose-built
            for a specific workflow within our DLT and trading operations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {MINI_APPS.map((app, index) => {
            const cardContent = (
              <Card
                hover={!app.disabled}
                className={`h-full group hover:shadow-lg transition-all duration-300 relative overflow-hidden ${app.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                {app.development && (
                  <div className="absolute top-[22px] right-[-22px] rotate-45 w-[120px] text-center text-[10px] font-bold py-1.5 bg-warning text-white pointer-events-none z-10 tracking-wide uppercase">
                    developing
                  </div>
                )}
                <div className="mb-4">
                  <div className={`w-12 h-12 flex items-center justify-center mb-3 rounded-lg transition-colors ${app.color}`}>
                    <FontAwesomeIcon icon={app.icon} className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2 text-text-primary font-semibold group-hover:text-brand transition-colors">
                    <span>{app.name}</span>
                    {!app.disabled && (
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                      />
                    )}
                  </div>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">{app.description}</p>
              </Card>
            );

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {app.disabled ? (
                  <div>{cardContent}</div>
                ) : (
                  <a href={app.href}>{cardContent}</a>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
