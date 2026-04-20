import { useEffect, useState, useCallback } from 'react';
import { faLink, faTrash, faPlus, faCopy, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppKitAccount } from '@reown/appkit-controllers/react';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ButtonInput } from '@/components/ui/Input';
import { AddressDisplay, Badge, ConfirmModal, Modal, showToast } from '@/components/ui';

import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableRowEmpty,
  EditableCell,
} from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { useWalletLink } from '@/hooks/useWalletLink';
import { apiRequest } from '@/lib/api/client';
import type { Address } from 'viem';

interface LinkedWallet {
  id: string;
  address: string;
  label: string | null;
  createdAt: string;
}

const WALLET_HEADERS = ['Address', 'Linked', 'Label', ''];

interface Props {
  hasScope?: boolean;
}

export default function LinkedWalletsSection({ hasScope = true }: Props) {
  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [unlinkTarget, setUnlinkTarget] = useState<LinkedWallet | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { sortTab: wSort, sortReverse: wRev, handleSort: handleWSort } = useSort('Address');

  const { address } = useAppKitAccount();
  const { step, token, secondsLeft, error, generateToken, reset } = useWalletLink(
    address as Address | undefined
  );

  const load = useCallback(async () => {
    if (!hasScope) return;
    try {
      const data = await apiRequest<{ wallets: LinkedWallet[] }>('/user-wallets');
      setWallets(data.wallets ?? []);
    } catch {
      /* silent */
    }
  }, [hasScope]);

  useEffect(() => {
    load();
  }, [load]);

  // Reload wallets when link completes
  useEffect(() => {
    if (step === 'linked') {
      load();
    }
  }, [step, load]);

  const startEdit = (w: LinkedWallet) => {
    setEditingId(w.id);
    setEditValue(w.label ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveLabel = async (w: LinkedWallet) => {
    const trimmed = editValue.trim() || null;
    if (trimmed === w.label) {
      cancelEdit();
      return;
    }
    try {
      await apiRequest(`/user-wallets/${w.address}/label`, {
        method: 'PATCH',
        body: JSON.stringify({ label: trimmed }),
      });
      setWallets(prev =>
        prev.map(wallet => (wallet.id === w.id ? { ...wallet, label: trimmed } : wallet))
      );
      showToast.success('Label updated');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to update label');
    }
    cancelEdit();
  };

  const handleUnlink = async () => {
    if (!unlinkTarget) return;
    try {
      await apiRequest(`/user-wallets/${unlinkTarget.address}`, { method: 'DELETE' });
      showToast.success('Wallet unlinked');
      setUnlinkTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to unlink wallet');
    }
  };

  const handleOpenLink = () => {
    reset();
    setLinkOpen(true);
    setCopied(false);
  };

  const handleCloseLink = () => {
    setLinkOpen(false);
    reset();
  };

  const handleCopyToken = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(`/link ${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <>
      <Section>
        <PageHeader
          title="Linked Wallets"
          description="EOA addresses you can use to sign in"
          icon={faLink}
          actions={
            hasScope ? (
              <ButtonInput
                label="Link wallet"
                icon={<FontAwesomeIcon icon={faPlus} />}
                variant="primary"
                size="sm"
                onClick={handleOpenLink}
              />
            ) : undefined
          }
        />
        {!hasScope ? (
          <p className="text-text-secondary text-sm">
            Wallet management requires{' '}
            <Badge
              text="LOGIN"
              variant="custom"
              customColor="text-brand"
              customBgColor="bg-brand/10"
              size="sm"
            />
          </p>
        ) : (
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
                    <div className="text-right text-sm">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-right">
                      <EditableCell
                        value={w.label}
                        isEditing={editingId === w.id}
                        editValue={editValue}
                        onEdit={() => startEdit(w)}
                        onSave={() => saveLabel(w)}
                        onCancel={cancelEdit}
                        onChange={setEditValue}
                        align="right"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setUnlinkTarget(w)}
                        className="text-xs text-error hover:text-error transition-colors flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        Unlink
                      </button>
                    </div>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Unlink confirm */}
      <ConfirmModal
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        title="Unlink Wallet"
        message={
          <span>
            Unlink{' '}
            <strong>
              {unlinkTarget?.address.slice(0, 8)}…{unlinkTarget?.address.slice(-6)}
            </strong>
            ? You will no longer be able to sign in with this wallet.
          </span>
        }
        confirmText="Unlink"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleUnlink}
      />

      {/* Link wallet modal */}
      <Modal
        isOpen={linkOpen}
        onClose={handleCloseLink}
        title="Link Wallet"
        size="sm"
        footer={
          step === 'idle' || step === 'error' ? (
            <ButtonInput
              label="Sign & generate token"
              variant="primary"
              onClick={generateToken}
              disabled={!address}
            />
          ) : step === 'linked' ? (
            <ButtonInput label="Done" variant="primary" onClick={handleCloseLink} />
          ) : undefined
        }
      >
        <div className="space-y-4">
          {step === 'idle' && (
            <p className="text-sm text-text-secondary">
              {address ? (
                <>
                  Sign a message with your connected wallet to generate a link token. Share this
                  token with the Telegram bot to link the wallet to your account.
                </>
              ) : (
                <>Connect a wallet first to generate a link token.</>
              )}
            </p>
          )}

          {step === 'signing' && (
            <p className="text-sm text-text-secondary">Sign the message in your wallet…</p>
          )}

          {step === 'pending' && token && (
            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Send this message to the Telegram bot to complete linking:
              </p>
              <div className="flex items-center gap-2 bg-bg-secondary rounded-lg p-3">
                <code className="flex-1 text-sm text-text-primary break-all font-mono">
                  /link {token}
                </code>
                <button
                  onClick={handleCopyToken}
                  className="text-text-secondary hover:text-brand transition-colors flex-shrink-0"
                >
                  <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} />
                </button>
              </div>
              {secondsLeft !== null && (
                <p className="text-xs text-text-secondary">
                  Expires in{' '}
                  <span className={secondsLeft < 60 ? 'text-error' : 'text-text-primary'}>
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                  </span>
                </p>
              )}
            </div>
          )}

          {step === 'linked' && (
            <div className="flex items-center gap-2 text-success text-sm">
              <FontAwesomeIcon icon={faCheckCircle} />
              Wallet linked successfully.
            </div>
          )}

          {step === 'error' && error && (
            <div className="space-y-2">
              <Badge
                text="Error"
                variant="custom"
                customColor="text-error"
                customBgColor="bg-error-bg"
                size="sm"
              />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
