import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Badge, AddressDisplay } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { ChainLogo } from '@/components/ui/logo';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/api/client';

interface SafeWallet {
  id: string;
  address: string;
  chainId: number;
  label: string;
  deployed: boolean;
  createdAt: string;
}

interface LinkedWallet {
  id: string;
  address: string;
  label: string | null;
  createdAt: string;
}

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
};

const SAFE_HEADERS = ['Address', 'Chain', 'Label', 'Status'];
const LINKED_HEADERS = ['Address', 'Label', 'Linked'];

export default function WalletsPage() {
  const { user } = useAuth();
  const hasSafeScope = user?.scopes.includes('SAFE') ?? false;

  const [safeWallets, setSafeWallets] = useState<SafeWallet[]>([]);
  const [linkedWallets, setLinkedWallets] = useState<LinkedWallet[]>([]);
  const [loadingSafe, setLoadingSafe] = useState(true);
  const [loadingLinked, setLoadingLinked] = useState(true);

  const loadSafe = useCallback(async () => {
    if (!hasSafeScope) {
      setLoadingSafe(false);
      return;
    }
    setLoadingSafe(true);
    try {
      const data = await apiRequest<{ wallets: SafeWallet[] }>('/safe/wallets');
      setSafeWallets(data.wallets ?? []);
    } catch {
      // scope may not be granted — silent
    } finally {
      setLoadingSafe(false);
    }
  }, [hasSafeScope]);

  const loadLinked = useCallback(async () => {
    setLoadingLinked(true);
    try {
      const data = await apiRequest<{ wallets: LinkedWallet[] }>('/user-wallets');
      setLinkedWallets(data.wallets ?? []);
    } catch {
      // silent
    } finally {
      setLoadingLinked(false);
    }
  }, []);

  useEffect(() => {
    loadSafe();
    loadLinked();
  }, [loadSafe, loadLinked]);

  return (
    <>
      <Head>
        <title>Wallets – Wrytes</title>
      </Head>

      <div className="space-y-10">
        <PageHeader
          title="Wallets"
          description="Your Safe deposit wallets and linked signing addresses"
          icon={faWallet}
        />

        {/* Safe wallets */}
        <Section title="Safe Wallets" description="Company-managed multi-sig deposit addresses">
          {!hasSafeScope ? (
            <p className="text-text-secondary text-sm">
              Safe wallet access requires the{' '}
              <Badge
                text="SAFE"
                variant="custom"
                customColor="text-orange-400"
                customBgColor="bg-orange-400/10"
                size="sm"
              />{' '}
              scope.
            </p>
          ) : (
            <Table>
              <TableHead headers={SAFE_HEADERS} colSpan={SAFE_HEADERS.length} />
              <TableBody>
                {loadingSafe ? (
                  <TableRowEmpty>Loading…</TableRowEmpty>
                ) : safeWallets.length === 0 ? (
                  <TableRowEmpty>No Safe wallets found.</TableRowEmpty>
                ) : (
                  safeWallets.map(w => (
                    <TableRow
                      key={w.id}
                      headers={SAFE_HEADERS}
                      colSpan={SAFE_HEADERS.length}
                      rawHeader
                    >
                      <div className="text-left">
                        <AddressDisplay address={w.address} prefixLength={8} suffixLength={6} />
                      </div>
                      <div className="flex justify-end gap-2 text-text-secondary text-sm">
                        <ChainLogo chain={CHAIN_NAMES[w.chainId] ?? 'Ethereum'} size={4} />
                        {CHAIN_NAMES[w.chainId] ?? `Chain ${w.chainId}`}
                      </div>
                      <div className="text-right text-text-secondary text-sm">
                        <AddressDisplay address={w.label} prefixLength={10} suffixLength={6} />
                      </div>
                      <div className="flex justify-end">
                        <Badge
                          text={w.deployed ? 'Deployed' : 'Predicted'}
                          variant="custom"
                          customColor={w.deployed ? 'text-green-400' : 'text-gray-400'}
                          customBgColor={w.deployed ? 'bg-green-400/10' : 'bg-gray-400/10'}
                          size="sm"
                        />
                      </div>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Section>

        {/* Linked wallets */}
        <Section title="Linked Wallets" description="EOA addresses you can use to sign in">
          <Table>
            <TableHead headers={LINKED_HEADERS} colSpan={LINKED_HEADERS.length} />
            <TableBody>
              {loadingLinked ? (
                <TableRowEmpty>Loading…</TableRowEmpty>
              ) : linkedWallets.length === 0 ? (
                <TableRowEmpty>
                  No wallets linked yet. Connect a wallet and follow the link flow to add one.
                </TableRowEmpty>
              ) : (
                linkedWallets.map(w => (
                  <TableRow
                    key={w.id}
                    headers={LINKED_HEADERS}
                    colSpan={LINKED_HEADERS.length}
                    rawHeader
                  >
                    <div className="text-left">
                      <AddressDisplay address={w.address} prefixLength={8} suffixLength={6} />
                    </div>
                    <div className="text-right text-text-secondary text-sm">
                      {w.label ?? <span className="text-gray-600">—</span>}
                    </div>
                    <div className="text-right text-text-secondary text-sm">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </div>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Section>
      </div>
    </>
  );
}
