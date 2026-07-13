import { useCallback, useEffect, useState } from 'react';
import { AddressDisplay, Badge, Modal, showToast } from '@/components/ui';
import { ButtonInput, TextInput } from '@/components/ui/input';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/table';
import { ChainLogo } from '@/components/ui/logo';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import type { NamespaceSafeWallet } from '@/lib/auth/types';

const SAFE_HEADERS = ['Address', 'Chain', 'Label', 'Status'];
const CHAIN_NAMES: Record<number, string> = { 1: 'Ethereum', 8453: 'Base' };

interface MemberWalletInfo {
  userId: string;
  telegramHandle: string | null;
  wallets: string[];
}

interface SafePreview {
  owners: string[];
  threshold: number;
}

interface Props {
  namespaceId: string;
  predictOpen: boolean;
  onClosePredict: () => void;
  linkOpen: boolean;
  onCloseLink: () => void;
}

export default function NamespaceSafeSection({
  namespaceId,
  predictOpen,
  onClosePredict,
  linkOpen,
  onCloseLink,
}: Props) {
  const [wallets, setWallets] = useState<NamespaceSafeWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const { sortTab, sortReverse, handleSort } = useSort('Address');

  // Predict modal state
  const [members, setMembers] = useState<MemberWalletInfo[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());
  const [predictLabel, setPredictLabel] = useState('primary');
  const [predicting, setPredicting] = useState(false);

  // Link modal state
  const [linkAddress, setLinkAddress] = useState('');
  const [linkChainId] = useState(1);
  const [linkLabel, setLinkLabel] = useState('primary');
  const [preview, setPreview] = useState<SafePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ wallets: NamespaceSafeWallet[] }>(
        `/namespaces/${namespaceId}/safe`
      );
      setWallets(data.wallets ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [namespaceId]);

  useEffect(() => {
    load();
  }, [load]);

  // Load member wallets when predict modal opens
  useEffect(() => {
    if (!predictOpen) return;
    setPredictLabel('primary');
    setSelectedOwners(new Set());
    setMembersLoading(true);
    apiRequest<{ members: MemberWalletInfo[] }>(`/namespaces/${namespaceId}/safe/members`)
      .then(data => {
        const all = data.members ?? [];
        setMembers(all);
        // Pre-select all addresses
        setSelectedOwners(new Set(all.flatMap(m => m.wallets)));
      })
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  }, [predictOpen, namespaceId]);

  // Reset link modal when opened
  useEffect(() => {
    if (!linkOpen) return;
    setLinkAddress('');
    setLinkLabel('primary');
    setPreview(null);
  }, [linkOpen]);

  const toggleOwner = (address: string) => {
    setSelectedOwners(prev => {
      const next = new Set(prev);
      next.has(address) ? next.delete(address) : next.add(address);
      return next;
    });
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      await apiRequest(`/namespaces/${namespaceId}/safe`, {
        method: 'POST',
        body: JSON.stringify({
          chainId: 1,
          label: predictLabel.trim() || 'primary',
          owners: Array.from(selectedOwners),
        }),
      });
      showToast.success('Safe wallet predicted');
      onClosePredict();
      load();
    } catch (err: unknown) {
      showToast.error((err as { message?: string }).message || 'Failed to predict Safe');
    } finally {
      setPredicting(false);
    }
  };

  const handlePreview = async () => {
    if (!linkAddress.trim()) return;
    setPreviewing(true);
    setPreview(null);
    try {
      const data = await apiRequest<SafePreview>(
        `/namespaces/${namespaceId}/safe/preview?address=${encodeURIComponent(linkAddress.trim())}&chainId=${linkChainId}`
      );
      setPreview(data);
    } catch {
      showToast.error('Could not fetch Safe info — check the address and chain');
    } finally {
      setPreviewing(false);
    }
  };

  const handleLink = async () => {
    setLinking(true);
    try {
      await apiRequest(`/namespaces/${namespaceId}/safe/link`, {
        method: 'POST',
        body: JSON.stringify({
          address: linkAddress.trim(),
          chainId: linkChainId,
          label: linkLabel.trim() || 'primary',
        }),
      });
      showToast.success('Safe wallet linked');
      onCloseLink();
      load();
    } catch (err: unknown) {
      showToast.error((err as { message?: string }).message || 'Failed to link Safe');
    } finally {
      setLinking(false);
    }
  };

  const sorted = [...wallets].sort((a, b) => {
    const m = sortReverse ? -1 : 1;
    switch (sortTab) {
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
    <>
      <Table>
        <TableHead
          headers={SAFE_HEADERS}
          colSpan={SAFE_HEADERS.length}
          tab={sortTab}
          reverse={sortReverse}
          tabOnChange={handleSort}
        />
        <TableBody>
          {loading ? (
            <TableRowEmpty>Loading…</TableRowEmpty>
          ) : sorted.length === 0 ? (
            <TableRowEmpty>No Safe wallets yet.</TableRowEmpty>
          ) : (
            sorted.map(w => (
              <TableRow
                key={w.id}
                headers={SAFE_HEADERS}
                colSpan={SAFE_HEADERS.length}
                tab={sortTab}
              >
                <div className="text-left">
                  <AddressDisplay address={w.address} prefixLength={8} suffixLength={6} />
                </div>
                <div className="flex justify-end items-center gap-2 text-sm">
                  <ChainLogo chain={CHAIN_NAMES[w.chainId] ?? 'Ethereum'} size={4} />
                  {CHAIN_NAMES[w.chainId] ?? `Chain ${w.chainId}`}
                </div>
                <div className="text-right text-sm text-text-secondary">{w.label}</div>
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

      {/* ── Predict Safe modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={predictOpen}
        onClose={onClosePredict}
        title="Predict Safe Wallet"
        size="sm"
        footer={
          <ButtonInput
            label={predicting ? 'Predicting…' : 'Predict Safe'}
            variant="primary"
            onClick={handlePredict}
            loading={predicting}
            disabled={predicting || selectedOwners.size === 0}
          />
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Computes a deterministic address on Ethereum Mainnet from the namespace ID, chain, and
            label. The operator wallet is always included as an owner.
          </p>
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <ChainLogo chain="Ethereum" size={4} />
            Ethereum Mainnet
          </div>
          <TextInput
            label="Label"
            value={predictLabel}
            onChange={setPredictLabel}
            placeholder="primary"
            note="Unique identifier for this Safe within the namespace"
          />
          <div>
            <p className="text-xs font-semibold text-input-label mb-2">Member owners</p>
            {membersLoading ? (
              <p className="text-xs text-text-secondary">Loading members…</p>
            ) : members.length === 0 || members.every(m => m.wallets.length === 0) ? (
              <p className="text-xs text-text-secondary">
                No linked wallets found. Members must link a wallet before being added as owners.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                {members.map(m =>
                  m.wallets.length === 0 ? null : (
                    <div key={m.userId}>
                      <p className="text-xs text-text-muted mb-1">
                        {m.telegramHandle ? `@${m.telegramHandle}` : m.userId}
                      </p>
                      <div className="space-y-1">
                        {m.wallets.map(addr => (
                          <label
                            key={addr}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={selectedOwners.has(addr)}
                              onChange={() => toggleOwner(addr)}
                              className="accent-brand"
                            />
                            <span className="font-mono text-xs text-text-primary group-hover:text-brand transition-colors">
                              {addr.slice(0, 10)}…{addr.slice(-8)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ── Link existing Safe modal ───────────────────────────────────────── */}
      <Modal
        isOpen={linkOpen}
        onClose={onCloseLink}
        title="Add Existing Safe"
        size="sm"
        footer={
          preview ? (
            <ButtonInput
              label={linking ? 'Linking…' : 'Link Safe'}
              variant="primary"
              onClick={handleLink}
              loading={linking}
              disabled={linking}
            />
          ) : (
            <ButtonInput
              label={previewing ? 'Looking up…' : 'Look up Safe'}
              variant="secondary"
              onClick={handlePreview}
              loading={previewing}
              disabled={previewing || !linkAddress.trim()}
            />
          )
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-text-primary">
            <ChainLogo chain="Ethereum" size={4} />
            Ethereum Mainnet
          </div>
          <TextInput
            label="Safe address"
            value={linkAddress}
            onChange={v => { setLinkAddress(v); setPreview(null); }}
            placeholder="0x…"
          />
          {preview && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-input-label">Current owners</p>
                  <span className="text-xs text-text-secondary">
                    threshold {preview.threshold} / {preview.owners.length}
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 bg-surface rounded-lg p-2">
                  {preview.owners.map(o => (
                    <p key={o} className="font-mono text-xs text-text-primary">
                      {o.slice(0, 10)}…{o.slice(-8)}
                    </p>
                  ))}
                </div>
              </div>
              <TextInput
                label="Label"
                value={linkLabel}
                onChange={setLinkLabel}
                placeholder="primary"
                note="Unique identifier for this Safe within the namespace"
              />
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
