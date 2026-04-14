import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { faKey, faTrash, faCopy, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader } from '@/components/ui/Layout';
import { ButtonInput } from '@/components/ui/Input';
import { Badge, ConfirmModal, showToast } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { apiRequest } from '@/lib/api/client';

interface ApiKey {
  id: string;
  keyId: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

interface NewKeyResult {
  apiKey: string;
  expiresAt: string | null;
}

const HEADERS = ['Key ID', 'Created', 'Last used', 'Expires', 'Actions'];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResult | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ keys: ApiKey[] }>('/auth/keys');
      setKeys(data.keys ?? []);
    } catch {
      showToast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      // Trigger the magic link flow via Telegram — no direct creation endpoint
      // Instead hit /auth/keys to list; creation is done via TG /api_create
      showToast.info('Send /api_create to the Telegram bot to generate a new key.');
    } finally {
      setCreating(false);
    }
  };

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

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString() : <span className="text-gray-600">—</span>;

  return (
    <>
      <Head>
        <title>API Keys – Wrytes</title>
      </Head>

      <div className="space-y-8">
        <PageHeader
          title="API Keys"
          description="Manage programmatic access tokens"
          icon={faKey}
          userInfo={
            <ButtonInput
              label="How to create"
              variant="secondary"
              size="sm"
              onClick={handleCreate}
            />
          }
        />

        {/* New key banner */}
        {newKey && (
          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg space-y-2">
            <p className="text-green-400 text-sm font-medium">
              New API key — copy it now, it won&apos;t be shown again.
            </p>
            <div
              className="flex items-center justify-between bg-gray-900 rounded px-3 py-2 cursor-pointer group"
              onClick={() => handleCopy(newKey.apiKey)}
            >
              <code className="text-orange-400 text-sm font-mono break-all select-all">
                {newKey.apiKey}
              </code>
              <FontAwesomeIcon
                icon={copied ? faCheckCircle : faCopy}
                className={`ml-3 flex-shrink-0 ${copied ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-300'}`}
              />
            </div>
            <ButtonInput
              label="Done"
              variant="secondary"
              size="sm"
              onClick={() => {
                setNewKey(null);
                load();
              }}
            />
          </div>
        )}

        {/* Info banner — creation is via TG */}
        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-text-secondary">
          API keys are created via the Telegram bot. Send{' '}
          <code className="text-orange-400">/api_create</code> to get a magic link, then visit it to
          retrieve your key.
        </div>

        <Table>
          <TableHead headers={HEADERS} colSpan={HEADERS.length} />
          <TableBody>
            {loading ? (
              <TableRowEmpty>Loading…</TableRowEmpty>
            ) : keys.length === 0 ? (
              <TableRowEmpty>
                No active API keys. Use /api_create in Telegram to generate one.
              </TableRowEmpty>
            ) : (
              keys.map(k => (
                <TableRow key={k.id} headers={HEADERS} colSpan={HEADERS.length} rawHeader>
                  <div className="text-left font-mono text-sm text-text-primary">{k.keyId}</div>
                  <div className="text-right text-text-secondary text-sm">{fmt(k.createdAt)}</div>
                  <div className="text-right text-text-secondary text-sm">{fmt(k.lastUsedAt)}</div>
                  <div className="flex justify-end">
                    {k.expiresAt ? (
                      <Badge
                        text={fmt(k.expiresAt) as string}
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
      </div>

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
