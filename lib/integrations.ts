export type Integration = {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
};

export const INTEGRATIONS: Integration[] = [
  {
    id: 'netcup',
    name: 'Netcup',
    description: 'European VPS and dedicated server infrastructure powering our platform backend',
    url: 'https://netcup.com/',
    icon: '/integration/Netcup Logos/netcup.svg',
  },
  {
    id: 'docker',
    name: 'Docker',
    description: 'Container platform for packaging, deploying, and scaling our platform services',
    url: 'https://docker.com/',
    icon: '/integration/Docker Logos/docker-brand.svg',
  },
  {
    id: 'portainer',
    name: 'Portainer',
    description: 'Container management UI for monitoring and operating our Docker infrastructure',
    url: 'https://portainer.io/',
    icon: '/integration/Portainer Logos/portainer-brand.svg',
  },
  {
    id: 'umami',
    name: 'Umami',
    description: 'Open-source, privacy-first web analytics for platform and product monitoring',
    url: 'https://umami.is/',
    icon: '/integration/Umami Logos/umami-brand.svg',
  },
  {
    id: 'safe-wallet',
    name: 'Safe {Wallet}',
    description: 'Multi-signature smart contract wallet for secure on-chain treasury management',
    url: 'https://safe.global/',
    icon: '/integration/Safe Logos/safe-icon.svg',
  },
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
    description: 'Swiss Frank stablecoin ecosystem CDP through money creation.',
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
