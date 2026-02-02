// Aragon DAO API types

export interface AragonDaoMetrics {
  tvlUSD: number;
  proposalsCreated: number;
  proposalsExecuted: number;
  uniqueVoters: number;
  votes: number;
  members: number;
}

export interface AragonDaoCreator {
  address: string;
  ens: string | null;
  avatar: string | null;
}

export interface AragonDao {
  id: string;
  network: string;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  address: string;
  implementationAddress: string;
  ens: string;
  subdomain: string;
  metadataIpfs: string;
  name: string;
  description: string;
  avatar: string | null;
  version: string;
  metrics: AragonDaoMetrics;
  links: unknown[];
  plugins: unknown[];
  creator: AragonDaoCreator;
}

export interface AragonDaoListMetadata {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

export interface AragonDaoListResponse {
  metadata: AragonDaoListMetadata;
  data: AragonDao[];
  creator: AragonDaoCreator;
}

// Active account types
export type AccountType = 'wallet' | 'aragon-dao';

export interface ActiveAccount {
  address: string;
  type: AccountType;
  name?: string;
  avatar?: string | null;
  // For DAOs, store additional metadata
  daoMetadata?: {
    ens: string;
    network: string;
    description: string;
  };
}
