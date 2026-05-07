import Head from 'next/head';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faTrash, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import TextInput from '@/components/ui/Input/TextInput';
import {
  useDeribitFetch, agentFetch,
  type DeribitAccount, type UpsertAccountBody,
} from '@/lib/deribit-agent/client';
import { fmtDate } from '@/lib/deribit-agent/ui';

const DEFAULT_BASE_URL = 'wss://www.deribit.com/ws/api/v2';

export default function DeribitSettingsPage() {
  const account = useDeribitFetch<DeribitAccount>('/deribit-account');

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [isTestnet, setIsTestnet] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (account.data) {
      setClientId(account.data.clientId);
      setBaseUrl(account.data.baseUrl);
      setIsTestnet(account.data.isTestnet);
    }
  }, [account.data]);

  const save = async () => {
    if (!clientId || !clientSecret) {
      toast.error('Client ID and Client Secret are required.');
      return;
    }
    setSubmitting(true);
    try {
      const body: UpsertAccountBody = {
        clientId,
        clientSecret,
        baseUrl: baseUrl || DEFAULT_BASE_URL,
        isTestnet,
      };
      await agentFetch('/deribit-account', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.success('Deribit account saved.');
      setClientSecret('');
      account.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save account.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeAccount = async () => {
    if (!confirm('Remove the Deribit account credentials?')) return;
    setRemoving(true);
    try {
      await agentFetch('/deribit-account', { method: 'DELETE' });
      toast.success('Account removed.');
      setClientId('');
      setClientSecret('');
      setBaseUrl(DEFAULT_BASE_URL);
      setIsTestnet(false);
      account.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove account.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Head>
        <title>Deribit Agent — Settings</title>
      </Head>

      <Section>
        <PageHeader
          title="Settings"
          description="Configure Deribit API credentials and agent parameters."
          icon={faSliders}
        />

        {/* Current account status */}
        {!account.loading && account.data && (
          <Card className="mt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
                  Current Account
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex gap-4">
                    <span className="text-text-muted w-24">Client ID</span>
                    <span className="text-text-primary font-mono">{account.data.clientId}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-24">Base URL</span>
                    <span className="text-text-primary font-mono text-xs">{account.data.baseUrl}</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-24">Testnet</span>
                    <span className={account.data.isTestnet ? 'text-yellow-400 font-medium' : 'text-success'}>
                      {account.data.isTestnet ? 'Yes' : 'No (Mainnet)'}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-text-muted w-24">Updated</span>
                    <span className="text-text-secondary">{fmtDate(account.data.updatedAt)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={removing}
                onClick={removeAccount}
                className="p-2 rounded text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                title="Remove account"
              >
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              </button>
            </div>
          </Card>
        )}

        {account.error && !account.data && (
          <p className="mt-4 text-text-muted text-sm">No account configured yet.</p>
        )}

        {/* Credentials form */}
        <Card className="mt-4">
          <p className="text-sm font-semibold text-text-primary mb-4">
            {account.data ? 'Update Credentials' : 'Add Deribit Account'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Client ID"
              placeholder="Your Deribit API Client ID"
              value={clientId}
              onChange={setClientId}
            />

            <div>
              <div className="border-2 rounded-lg px-3 py-1 border-input-border hover:border-brand focus-within:!border-brand transition-colors">
                <div className="text-input-label mt-1 mb-0.5 text-xs">Client Secret</div>
                <div className="flex items-center gap-2">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={e => setClientSecret(e.target.value)}
                    placeholder={account.data ? 'Enter new secret to update' : 'Your Deribit API Client Secret'}
                    className="flex-1 bg-transparent text-lg py-1.5 outline-none text-text-primary placeholder:text-input-empty"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(v => !v)}
                    className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                  >
                    <FontAwesomeIcon icon={showSecret ? faEyeSlash : faEye} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <TextInput
              label="Base URL"
              placeholder={DEFAULT_BASE_URL}
              value={baseUrl}
              onChange={setBaseUrl}
            />

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary select-none">
                <input
                  type="checkbox"
                  checked={isTestnet}
                  onChange={e => setIsTestnet(e.target.checked)}
                  className="w-4 h-4 accent-brand"
                />
                Use Testnet
              </label>
              {isTestnet && (
                <span className="text-yellow-400 text-xs font-medium">
                  Connecting to test.deribit.com
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={save}
              disabled={submitting}
              className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : account.data ? 'Update Account' : 'Save Account'}
            </button>
          </div>

          {account.data && (
            <p className="mt-3 text-text-muted text-xs">
              Leave Client Secret blank to keep the existing secret.
              Enter a new value only to rotate it.
            </p>
          )}
        </Card>

        {/* Env info */}
        <Card className="mt-4">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
            Environment
          </p>
          <div className="space-y-3 text-sm">
            {([
              {
                key: 'NEXT_PUBLIC_DERIBIT_AGENT_URL',
                val: process.env.NEXT_PUBLIC_DERIBIT_AGENT_URL,
                example: 'http://localhost:3030',
                note: 'Origin only — no path, no API key',
              },
              {
                key: 'NEXT_PUBLIC_DERIBIT_AGENT_API_KEY',
                val: process.env.NEXT_PUBLIC_DERIBIT_AGENT_API_KEY,
                example: 'rw_prod_<keyId>.<secret>',
                note: 'Sent as X-API-Key header on every request',
              },
            ] as const).map(({ key, val, example, note }) => (
              <div key={key}>
                <div className="flex items-center gap-3">
                  <span className="text-text-muted font-mono text-xs">{key}</span>
                  <span className={val ? 'text-success text-xs font-medium' : 'text-error text-xs font-medium'}>
                    {val ? 'Set' : 'Not set'}
                  </span>
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  e.g. <span className="font-mono">{example}</span> — {note}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-surface rounded-lg p-3 font-mono text-xs text-text-secondary space-y-1">
            <p className="text-text-muted mb-1"># .env.local</p>
            <p>NEXT_PUBLIC_DERIBIT_AGENT_URL=http://localhost:3030</p>
            <p>NEXT_PUBLIC_DERIBIT_AGENT_API_KEY=rw_prod_{'<keyId>.<secret>'}</p>
          </div>
        </Card>
      </Section>
    </>
  );
}
