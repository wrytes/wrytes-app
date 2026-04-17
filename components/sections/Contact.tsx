import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faEnvelope, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import { COMPANY } from '@/lib/constants';

export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-surface">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Get in Touch</h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Interested in collaborating on blockchain research or need technical development
            services? Let&apos;s discuss how our R&D expertise can advance your project goals.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Contact Details - Desktop Row Layout / Mobile Stack */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Location</h4>
                  <p className="text-text-secondary">{COMPANY.location}</p>
                  <p className="text-text-muted text-sm">Heart of European FinTech</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Email</h4>
                  <p className="text-text-secondary">hello@wrytes.io</p>
                  <p className="text-text-muted text-sm">
                    For private inquiries or collaboration requests
                  </p>
                </div>
              </div>

              {/* Telegram Community */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faPeopleGroup} className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Telegram Community</h4>
                  <p className="text-text-secondary">@wrytes_io</p>
                  <p className="text-text-muted text-sm">
                    Join for public discussions or general inquiries
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
