// Token configuration - CoW Swap token list format
// Custom tokens extend the CoW list; CoW list is the primary source (fetched at runtime)

export interface TokenConfig {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  tags?: string[];
}

// Tokens not on the CoW list (or that need overrides)
export const CUSTOM_TOKENS: TokenConfig[] = [
  {
    address: '0xB58E61C3098d85632Df34EecfB899A1Ed80921cB',
    symbol: 'ZCHF',
    name: 'Frankencoin',
    decimals: 18,
    chainId: 1,
    logoURI: '/coin/zchf.svg',
  },
  {
    address: '0xdde3eC717f220Fc6A29D6a4Be73F91DA5b718e55',
    symbol: 'USDU',
    name: 'USDU',
    decimals: 18,
    chainId: 1,
    logoURI: '/coin/usdu.png',
  },
  {
    address: '0x1bA26788dfDe592fec8bcB0Eaff472a42BE341B2',
    symbol: 'FPS',
    name: 'Frankencoin Pool Share',
    decimals: 18,
    chainId: 1,
    logoURI: '/coin/fps.png',
  },
];

