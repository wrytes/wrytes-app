import { useEffect, useState, useCallback } from 'react';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { AddressDisplay } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';

interface LinkedWallet {
  id: string;
  address: string;
  label: string | null;
  createdAt: string;
}

const WALLET_HEADERS = ['Address', 'Label', 'Linked'];

export default function LinkedWalletsSection() {
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const { sortTab: wSort, sortReverse: wRev, handleSort: handleWSort } = useSort('Linked');

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<{ wallets: LinkedWallet[] }>('/user-wallets');
      setWallets(data.wallets ?? []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dateMs = (iso: string | null) => (iso ? new Date(iso).getTime() : -Infinity);

  const sorted = [...wallets].sort((a, b) => {
    const m = wRev ? -1 : 1;
    switch (wSort) {
      case 'Address':
        return m * a.address.localeCompare(b.address);
      case 'Label':
        return m * (a.label ?? '').localeCompare(b.label ?? '');
      default:
        return m * (dateMs(a.createdAt) - dateMs(b.createdAt));
    }
  });

  return (
    <Section>
      <PageHeader
        title="Linked Wallets"
        description="EOA addresses you can use to sign in"
        icon={faLink}
      />
      <Table>
        <TableHead
          headers={WALLET_HEADERS}
          colSpan={WALLET_HEADERS.length}
          tab={wSort}
          reverse={wRev}
          tabOnChange={handleWSort}
        />
        <TableBody>
          {sorted.length === 0 ? (
            <TableRowEmpty>No wallets linked yet.</TableRowEmpty>
          ) : (
            sorted.map(w => (
              <TableRow
                key={w.id}
                headers={WALLET_HEADERS}
                colSpan={WALLET_HEADERS.length}
                tab={wSort}
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
  );
}
