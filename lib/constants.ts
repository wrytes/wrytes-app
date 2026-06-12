export type ConfigEnv = {
  verbose: boolean;
  app: string;
  api: string;
  indexer: string;
  reownProjectId: string;
  rpcUrl: string;
  morphoGraphqlEndpoint: string;
  morphoApiKey: string;
  nodeEnv: string;
};

export const CONFIG: ConfigEnv = {
  verbose: false,
  app: process.env.NEXT_PUBLIC_APP_URL || 'https://app.wrytes.io',
  api: process.env.NEXT_PUBLIC_API_URL || 'https://api.wrytes.io',
  indexer: process.env.NEXT_PUBLIC_INDEXER_URL || 'https://indexer.wrytes.io',
  reownProjectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '',
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
  morphoGraphqlEndpoint:
    process.env.NEXT_PUBLIC_MORPHO_GRAPHQL_ENDPOINT || 'https://api.morpho.org/graphql',
  morphoApiKey: process.env.NEXT_PUBLIC_MORPHO_API_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const COMPANY = {
  name: 'Wrytes AG',
  location: 'Zug, Switzerland',
  address: 'Bahnhofstrasse 7, 6300 Zug, Switzerland',
  uid: 'CHE-351.107.319',
  registry: 'https://zg.chregister.ch/cr-portal/auszug/auszug.xhtml?uid=CHE-351.107.319',
  tagline: 'Software Development & Distributed Ledger Technologies & AI',
  shortDescription:
    'Swiss R&D company specializing in developing and deploying Software Solutions for Distributed Ledger Technologies and AI.',
  description:
    'We develop cutting-edge tools and adapters/integrations from smart contracts to APIs and applications, with expertise in accounting automation, governance overlays, and advanced transaction systems. Independent revenue through Proprietary Asset Management funds our continuous innovation.',
  keywords:
    'Software Development, Distributed Ledger Technologies, AI, Full-Stack Development, Smart Contracts, APIs, Automation, Governance Tools, DAO Management, Transaction Systems, Switzerland, Zug, R&D, DeFi, Blockchain Technology',
};

export const SOCIAL = {
  Github_user: 'https://github.com/wrytes',
  Twitter: 'https://twitter.com/wrytes_io',
  Telegram: 'https://t.me/wrytes_io',
};
