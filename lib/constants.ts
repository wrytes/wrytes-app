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

export const SERVICES = [
  {
    id: 'technical-services',
    title: 'Technical Services',
    description: 'Expert development services for clients and partners',
    features: [
      'Architecture design and system integration',
      'Smart contract development and auditing',
      'Distributed ledger adapters and protocol connectors',
      'Backend systems and API integrations',
      'Automation frameworks and workflows',
    ],
  },
  {
    id: 'platform-development',
    title: 'Platform Development & Innovation',
    description: 'Proprietary tools and cutting-edge research',
    features: [
      'Cutting-edge research and prototyping',
      'Distributed ledger tools and applications',
      'Safety and monitoring systems',
      'Open-source contributions and community building',
      'Business tools for enhanced operations',
    ],
  },
  {
    id: 'strategic-partnerships',
    title: 'Strategic Partnerships & Capital Operations',
    description: 'Growth through partnerships and investments',
    features: [
      'Strategic partnerships in projects',
      'Resource alignment and shared objectives',
      'Technology and expertise sharing agreements',
      'Investment opportunities, mergers, acquisitions and joint ventures',
    ],
  },
  {
    id: 'crypto-asset-management',
    title: 'Proprietary Asset Management',
    description: 'Independent revenue generation funding R&D operations',
    features: [
      'Bitcoin-based revenue strategies',
      'Strategic yield optimization approaches',
      'Market inefficiency identification and exploitation',
      'Operational financing through strategic positions',
      'Exclusively company-owned assets',
    ],
  },
];

export const INTEGRATIONS = [
  {
    id: 'aragon-dao',
    name: 'Aragon DAO',
    description: 'On-chain treasury management with governance plugins and multi-action payloads',
    url: 'https://aragon.org/',
    icon: '/integration/Aragon Logos/aragon-logo.png',
  },
  {
    id: 'morpho',
    name: 'Morpho',
    description: 'P2P lending protocol with floating rates and flashloan capabilities',
    url: 'https://morpho.org/',
    icon: '/integration/Morpho Logos/Morpho Logos/SVG/Morpho-logo-symbol-lightmode.svg',
  },
  {
    id: 'curve',
    name: 'Curve',
    description: 'AMM pools, liquidity provision, and swap integrations',
    url: 'https://curve.fi/',
    icon: '/integration/Curve Logos/CRV-transparent.svg',
  },
  {
    id: 'termmax',
    name: 'TermMax',
    description: 'P2P fixed-term lending protocol for credit markets',
    url: 'https://termmax.io/',
    icon: '/integration/TermMax Logos/TermMax Logomark_Color.svg',
  },
  {
    id: 'frankencoin',
    name: 'Frankencoin',
    description: 'Swiss Franc stablecoin ecosystem incl. invoice payments',
    url: 'https://frankencoin.com/',
    icon: '/integration/Frankencoin Logos/coin_logo_frankencoin.svg',
  },
  {
    id: 'usdu-finance',
    name: 'USDU Finance',
    description: 'Non-algorithmic stablecoin backed by protocol adapters for structured finance',
    url: 'https://usdu.finance/',
    icon: '/integration/USDU-Finance Logos/usdu.svg',
  },
  {
    id: 'deribit',
    name: 'Deribit',
    description: 'Bitcoin & Ethereum options exchange with API and automation tools',
    url: 'https://deribit.com/',
    icon: '/integration/Deribit Logos/Deribit Logo Only.jpeg',
  },
];
