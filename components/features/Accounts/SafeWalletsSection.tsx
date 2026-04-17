import { useEffect, useState, useCallback } from 'react';
import { faShield } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Badge, AddressDisplay } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { ChainLogo } from '@/components/ui/logo';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import type { SafeWallet } from './types';

const SAFE_HEADERS = ['Address', 'Chain', 'Label', 'Status'];
const CHAIN_NAMES: Record<number, string> = { 1: 'Ethereum', 8453: 'Base' };

interface Props {
  hasScope: boolean;
}

export default function SafeWalletsSection({ hasScope }: Props) {
  const [safeWallets, setSafeWallets] = useState<SafeWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const { sortTab: safeSort, sortReverse: safeRev, handleSort: handleSafeSort } = useSort('Address');

  const load = useCallback(async () => {
    if (!hasScope) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<{ wallets: SafeWallet[] }>('/safe/wallets');
      setSafeWallets(data.wallets ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [hasScope]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = [...safeWallets].sort((a, b) => {
    const m = safeRev ? -1 : 1;
    switch (safeSort) {
      case 'Chain':
        return m * (CHAIN_NAMES[a.chainId] ?? '').localeCompare(CHAIN_NAMES[b.chainId] ?? '');
      case 'Label':
        return m * a.label.localeCompare(b.label);
      case 'Status':
        return m * (Number(b.deployed) - Number(a.deployed));
      default:
        return m * a.address.localeCompare(b.address);
    }
  });

  return (
    <Section>
      <PageHeader
        title="Safe Accounts"
        description="Company-managed multi-sig deposit addresses"
        icon={faShield}
      />
      {!hasScope ? (
        <p className="text-text-secondary text-sm">
          Safe wallet access requires the{' '}
          <Badge
            text="SAFE"
            variant="custom"
            customColor="text-brand"
            customBgColor="bg-brand/10"
            size="sm"
          />{' '}
          scope.
        </p>
      ) : (
        <Table>
          <TableHead
            headers={SAFE_HEADERS}
            colSpan={SAFE_HEADERS.length}
            tab={safeSort}
            reverse={safeRev}
            tabOnChange={handleSafeSort}
          />
          <TableBody>
            {loading ? (
              <TableRowEmpty>Loading…</TableRowEmpty>
            ) : sorted.length === 0 ? (
              <TableRowEmpty>No Safe wallets found.</TableRowEmpty>
            ) : (
              sorted.map(w => (
                <TableRow
                  key={w.id}
                  headers={SAFE_HEADERS}
                  colSpan={SAFE_HEADERS.length}
                  tab={safeSort}
                  rawHeader
                >
                  <div className="text-left">
                    <AddressDisplay address={w.address} prefixLength={8} suffixLength={6} />
                  </div>
                  <div className="flex justify-end items-center gap-2 text-text-secondary text-sm">
                    <ChainLogo chain={CHAIN_NAMES[w.chainId] ?? 'Ethereum'} size={4} />
                    {CHAIN_NAMES[w.chainId] ?? `Chain ${w.chainId}`}
                  </div>
                  <div className="text-right text-text-secondary text-sm">
                    <AddressDisplay address={w.label} prefixLength={8} suffixLength={6} />
                  </div>
                  <div className="flex justify-end">
                    <Badge
                      text={w.deployed ? 'Deployed' : 'Predicted'}
                      variant="custom"
                      customColor={w.deployed ? 'text-success' : 'text-text-muted'}
                      customBgColor={w.deployed ? 'bg-success-bg' : 'bg-surface'}
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
  );
}
