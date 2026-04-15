import { useEffect, useState, useCallback } from 'react';
import { faKey, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Badge, ConfirmModal, showToast } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';

interface ApiKey {
  id: string;
  keyId: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

const KEY_HEADERS = ['Key ID', 'Created', 'Last used', 'Expires', ''];

interface Props {
  hasScope?: boolean;
}

export default function ApiKeysSection({ hasScope = true }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const { sortTab: kSort, sortReverse: kRev, handleSort: handleKSort } = useSort('Created');

  const load = useCallback(async () => {
    if (!hasScope) return;
    try {
      const data = await apiRequest<{ keys: ApiKey[] }>('/auth/keys');
      setKeys(data.keys ?? []);
    } catch {
      /* silent */
    }
  }, [hasScope]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await apiRequest('/auth/revoke', {
        method: 'POST',
        body: JSON.stringify({ keyId: revokeTarget.keyId }),
      });
      showToast.success('API key revoked');
      setRevokeTarget(null);
      load();
    } catch {
      showToast.error('Failed to revoke key');
    }
  };

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—');
  const dateMs = (iso: string | null) => (iso ? new Date(iso).getTime() : -Infinity);

  const sorted = [...keys].sort((a, b) => {
    const m = kRev ? -1 : 1;
    switch (kSort) {
      case 'Key ID':
        return m * a.keyId.localeCompare(b.keyId);
      case 'Last used':
        return m * (dateMs(a.lastUsedAt) - dateMs(b.lastUsedAt));
      case 'Expires':
        return m * (dateMs(a.expiresAt) - dateMs(b.expiresAt));
      default:
        return m * (dateMs(a.createdAt) - dateMs(b.createdAt));
    }
  });

  return (
    <>
      <Section>
        <PageHeader
          title="API Keys"
          description="Programmatic access tokens — use /api_create in Telegram to generate one"
          icon={faKey}
        />
        {!hasScope ? (
          <p className="text-text-secondary text-sm">
            API key management requires{' '}
            <Badge
              text="LOGIN"
              variant="custom"
              customColor="text-orange-400"
              customBgColor="bg-orange-400/10"
              size="sm"
            />
          </p>
        ) : (
        <Table>
          <TableHead
            headers={KEY_HEADERS}
            colSpan={KEY_HEADERS.length}
            tab={kSort}
            reverse={kRev}
            tabOnChange={handleKSort}
          />
          <TableBody>
            {sorted.length === 0 ? (
              <TableRowEmpty>No active API keys.</TableRowEmpty>
            ) : (
              sorted.map(k => (
                <TableRow
                  key={k.id}
                  headers={KEY_HEADERS}
                  colSpan={KEY_HEADERS.length}
                  tab={kSort}
                  rawHeader
                >
                  <div className="text-left font-mono text-sm text-text-primary">{k.keyId}</div>
                  <div className="text-right text-text-secondary text-sm">{fmt(k.createdAt)}</div>
                  <div className="text-right text-text-secondary text-sm">{fmt(k.lastUsedAt)}</div>
                  <div className="flex justify-end">
                    {k.expiresAt ? (
                      <Badge
                        text={fmt(k.expiresAt)}
                        variant="custom"
                        customColor="text-gray-400"
                        customBgColor="bg-gray-400/10"
                        size="sm"
                      />
                    ) : (
                      <Badge
                        text="Never"
                        variant="custom"
                        customColor="text-green-400"
                        customBgColor="bg-green-400/10"
                        size="sm"
                      />
                    )}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setRevokeTarget(k)}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      Revoke
                    </button>
                  </div>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}
      </Section>

      <ConfirmModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke API Key"
        message={
          <span>
            Revoke key <strong>{revokeTarget?.keyId}</strong>? Any integrations using it will stop
            working immediately.
          </span>
        }
        confirmText="Revoke"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleRevoke}
      />
    </>
  );
}
