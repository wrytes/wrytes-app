import React from 'react';
import { motion } from 'framer-motion';
import { COMPANY } from '@/lib/constants';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-dark overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div
          className="w-full h-full bg-repeat bg-center"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Company Name */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-7xl md:text-8xl lg:text-9xl font-bold mb-8 text-white"
          >
            {COMPANY.name.split(' ')[0]}
            <span className="text-brand">.</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            {COMPANY.tagline}
          </motion.p>

          {/* Value Proposition */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-lg text-text-muted mb-12 max-w-2xl mx-auto"
          >
            {COMPANY.shortDescription}
          </motion.p>

          {/* Location Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="inline-flex items-center gap-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-full border border-surface mb-12"
          >
            <div className="w-2 h-2 bg-brand rounded-full animate-pulse" />
            <span className="text-text-secondary text-sm">{COMPANY.location}</span>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            {/* Temporarily commented out - platform not ready for public access */}
            {/* <Button
              size="lg"
              href="/dashboard"
              icon={<FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />}
              className="shadow-glow"
            >
              Explore Platform
            </Button> */}
            {/* <Button variant="outline" size="lg" href="#about">
              Learn More
            </Button> */}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-text-muted rounded-full flex justify-center">
          <div className="w-1 h-3 bg-text-muted rounded-full animate-bounce mt-2" />
        </div>
      </motion.div>
    </section>
  );
}
