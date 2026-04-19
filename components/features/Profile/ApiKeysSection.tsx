import { useState, useCallback, useEffect } from 'react';
import { faKey, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Badge, ConfirmModal, showToast } from '@/components/ui';
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableRowEmpty,
  EditableCell,
} from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';

interface ApiKey {
  id: string;
  keyId: string;
  label: string | null;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

const KEY_HEADERS = ['Key ID', 'Created', 'Last used', 'Expires', 'Label', ''];

interface Props {
  hasScope?: boolean;
}

export default function ApiKeysSection({ hasScope = true }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const { sortTab: kSort, sortReverse: kRev, handleSort: handleKSort } = useSort('Key ID');

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

  const startEdit = (k: ApiKey) => {
    setEditingId(k.keyId);
    setEditValue(k.label ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveLabel = async (k: ApiKey) => {
    const trimmed = editValue.trim() || null;
    if (trimmed === k.label) {
      cancelEdit();
      return;
    }
    try {
      await apiRequest(`/auth/keys/${k.keyId}/label`, {
        method: 'PATCH',
        body: JSON.stringify({ label: trimmed }),
      });
      setKeys(prev => prev.map(key => (key.keyId === k.keyId ? { ...key, label: trimmed } : key)));
      showToast.success('Label updated');
    } catch {
      showToast.error('Failed to update label');
    }
    cancelEdit();
  };

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—');
  const dateMs = (iso: string | null) => (iso ? new Date(iso).getTime() : -Infinity);

  const sorted = [...keys].sort((a, b) => {
    const m = kRev ? -1 : 1;
    switch (kSort) {
      case 'Label':
        return m * (a.label ?? '').localeCompare(b.label ?? '');
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
              customColor="text-brand"
              customBgColor="bg-brand/10"
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
                    <div className="text-left font-mono text-sm">{k.keyId}</div>
                    <div className="text-right text-sm">{fmt(k.createdAt)}</div>
                    <div className="text-right text-sm">{fmt(k.lastUsedAt)}</div>
                    <div className="flex justify-end">
                      {k.expiresAt ? (
                        <Badge
                          text={fmt(k.expiresAt)}
                          variant="custom"
                          customColor="text-text-muted"
                          customBgColor="bg-surface"
                          size="sm"
                        />
                      ) : (
                        <Badge
                          text="Never"
                          variant="custom"
                          customColor="text-success"
                          customBgColor="bg-success-bg"
                          size="sm"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <EditableCell
                        value={k.label}
                        isEditing={editingId === k.keyId}
                        editValue={editValue}
                        onEdit={() => startEdit(k)}
                        onSave={() => saveLabel(k)}
                        onCancel={cancelEdit}
                        onChange={setEditValue}
                        align="right"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setRevokeTarget(k)}
                        className="text-xs text-error hover:text-error transition-colors flex items-center gap-1"
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
