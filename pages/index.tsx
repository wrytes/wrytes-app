import Head from 'next/head';
import Hero from '@/components/landing/Hero';
import About from '@/components/landing/About';
import Integrations from '@/components/landing/Integrations';
import MiniApps from '@/components/landing/MiniApps';
import Revenue from '@/components/landing/Revenue';
import Contact from '@/components/landing/Contact';
import { COMPANY } from '@/lib/constants';

export default function Home() {
  return (
    <>
      <Head>
        <title>{COMPANY.name} - Profit-Driven Crypto R&D from Switzerland</title>
        <meta name="description" content={COMPANY.description} />
        <meta name="keywords" content={COMPANY.keywords} />

        {/* Open Graph */}
        <meta
          property="og:title"
          content={`${COMPANY.name} - Profit-Driven Crypto R&D from Switzerland`}
        />
        <meta property="og:description" content={COMPANY.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wrytes.io" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`${COMPANY.name} - Profit-Driven Crypto R&D from Switzerland`}
        />
        <meta name="twitter:description" content={COMPANY.description} />

        {/* Additional SEO */}
        <meta name="author" content={COMPANY.name} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://wrytes.io" />
      </Head>

      <Hero />
      <About />
      <Integrations />
      <MiniApps />
      <Revenue />
      <Contact />
    </>
  );
}
