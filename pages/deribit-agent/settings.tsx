import Head from 'next/head';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSliders, faTrash, faEye, faEyeSlash, faPlus, faStar, faPencil, faCheck, faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import TextInput from '@/components/ui/Input/TextInput';
import {
  useDeribitFetch, agentFetch,
  type DeribitAccount, type CreateAccountBody, type UpdateAccountBody,
} from '@/lib/deribit-agent/client';
import { fmtDate } from '@/lib/deribit-agent/ui';

const DEFAULT_BASE_URL = 'wss://www.deribit.com/ws/api/v2';
const TESTNET_BASE_URL = 'wss://test.deribit.com/ws/api/v2';

const BLANK_CREATE: CreateAccountBody = {
  label: '',
  clientId: '',
  clientSecret: '',
  baseUrl: DEFAULT_BASE_URL,
  isTestnet: false,
  isDefault: false,
};

interface EditState {
  label: string;
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  isTestnet: boolean;
}

export default function DeribitSettingsPage() {
  const accounts = useDeribitFetch<DeribitAccount[]>('/deribit-account');

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<CreateAccountBody>(BLANK_CREATE);
  const [showSecret, setShowSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditState | null>(null);
  const [editShowSecret, setEditShowSecret] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [removing, setRemoving] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  const patchForm = (k: keyof CreateAccountBody, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const addAccount = async () => {
    if (!form.clientId || !form.clientSecret) {
      toast.error('Client ID and Client Secret are required.');
      return;
    }
    setSubmitting(true);
    try {
      await agentFetch('/deribit-account', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          label: form.label || 'default',
        }),
      });
      toast.success('Account added.');
      setForm(BLANK_CREATE);
      setShowAdd(false);
      accounts.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add account.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (account: DeribitAccount) => {
    setEditId(account.id);
    setEditForm({
      label: account.label,
      clientId: account.clientId,
      clientSecret: '',
      baseUrl: account.baseUrl,
      isTestnet: account.isTestnet,
    });
    setEditShowSecret(false);
  };

  const saveEdit = async () => {
    if (!editId || !editForm) return;
    setEditSubmitting(true);
    try {
      const body: UpdateAccountBody = {
        label: editForm.label || undefined,
        clientId: editForm.clientId || undefined,
        ...(editForm.clientSecret ? { clientSecret: editForm.clientSecret } : {}),
        baseUrl: editForm.baseUrl || undefined,
        isTestnet: editForm.isTestnet,
      };
      await agentFetch(`/deribit-account/${editId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      toast.success('Account updated.');
      setEditId(null);
      setEditForm(null);
      accounts.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update account.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const removeAccount = async (id: string) => {
    if (!confirm('Remove this Deribit account?')) return;
    setRemoving(id);
    try {
      await agentFetch(`/deribit-account/${id}`, { method: 'DELETE' });
      toast.success('Account removed.');
      accounts.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove account.');
    } finally {
      setRemoving(null);
    }
  };

  const setDefault = async (id: string) => {
    setSettingDefault(id);
    try {
      await agentFetch(`/deribit-account/${id}/default`, { method: 'POST' });
      toast.success('Default account updated.');
      accounts.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update default.');
    } finally {
      setSettingDefault(null);
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
          description="Manage Deribit API accounts and agent configuration."
          icon={faSliders}
          actions={
            <button
              type="button"
              onClick={() => setShowAdd(v => !v)}
              className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              Add Account
            </button>
          }
        />

        {/* Add account form */}
        {showAdd && (
          <Card className="mt-4">
            <p className="text-sm font-semibold text-text-primary mb-4">Add Deribit Account</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Label"
                placeholder="main, testnet, paper-1…"
                value={form.label ?? ''}
                onChange={v => patchForm('label', v)}
              />
              <TextInput
                label="Client ID"
                placeholder="Your Deribit API Client ID"
                value={form.clientId}
                onChange={v => patchForm('clientId', v)}
              />

              {/* Secret field */}
              <div>
                <div className="border-2 rounded-lg px-3 py-1 border-input-border hover:border-brand focus-within:!border-brand transition-colors">
                  <div className="text-input-label mt-1 mb-0.5 text-xs">Client Secret</div>
                  <div className="flex items-center gap-2">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={form.clientSecret}
                      onChange={e => patchForm('clientSecret', e.target.value)}
                      placeholder="Your Deribit API Client Secret"
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
                value={form.baseUrl ?? DEFAULT_BASE_URL}
                onChange={v => patchForm('baseUrl', v)}
              />

              <div className="flex items-center gap-6 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary select-none">
                  <input
                    type="checkbox"
                    checked={form.isTestnet ?? false}
                    onChange={e => {
                      const testnet = e.target.checked;
                      patchForm('isTestnet', testnet);
                      patchForm('baseUrl', testnet ? TESTNET_BASE_URL : DEFAULT_BASE_URL);
                    }}
                    className="w-4 h-4 accent-brand"
                  />
                  Testnet
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary select-none">
                  <input
                    type="checkbox"
                    checked={form.isDefault ?? false}
                    onChange={e => patchForm('isDefault', e.target.checked)}
                    className="w-4 h-4 accent-brand"
                  />
                  Set as default
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={addAccount}
                disabled={submitting}
                className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Adding…' : 'Add Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </Card>
        )}

        {/* Accounts list */}
        <div className="mt-6">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
            Deribit Accounts
          </p>

          {accounts.loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-20 bg-card rounded-lg animate-pulse" />)}
            </div>
          ) : !accounts.data?.length ? (
            <Card>
              <p className="text-text-muted text-sm text-center py-4">
                No Deribit accounts configured. Add one above.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {accounts.data.map(account => {
                const isEditing = editId === account.id;
                const ef = editForm;

                return (
                  <Card key={account.id} className="p-0 overflow-hidden">
                    {isEditing && ef ? (
                      <div className="px-4 py-4">
                        <p className="text-sm font-semibold text-text-primary mb-4">Edit Account</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextInput
                            label="Label"
                            placeholder="main, testnet…"
                            value={ef.label}
                            onChange={v => setEditForm(f => f && ({ ...f, label: v }))}
                          />
                          <TextInput
                            label="Client ID"
                            placeholder="Client ID"
                            value={ef.clientId}
                            onChange={v => setEditForm(f => f && ({ ...f, clientId: v }))}
                          />
                          <div>
                            <div className="border-2 rounded-lg px-3 py-1 border-input-border hover:border-brand focus-within:!border-brand transition-colors">
                              <div className="text-input-label mt-1 mb-0.5 text-xs">Client Secret</div>
                              <div className="flex items-center gap-2">
                                <input
                                  type={editShowSecret ? 'text' : 'password'}
                                  value={ef.clientSecret}
                                  onChange={e => setEditForm(f => f && ({ ...f, clientSecret: e.target.value }))}
                                  placeholder="Leave blank to keep existing"
                                  className="flex-1 bg-transparent text-lg py-1.5 outline-none text-text-primary placeholder:text-input-empty"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditShowSecret(v => !v)}
                                  className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                                >
                                  <FontAwesomeIcon icon={editShowSecret ? faEyeSlash : faEye} className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <TextInput
                            label="Base URL"
                            placeholder={DEFAULT_BASE_URL}
                            value={ef.baseUrl}
                            onChange={v => setEditForm(f => f && ({ ...f, baseUrl: v }))}
                          />
                          <div className="flex items-center gap-3 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary select-none">
                              <input
                                type="checkbox"
                                checked={ef.isTestnet}
                                onChange={e => setEditForm(f => f && ({ ...f, isTestnet: e.target.checked }))}
                                className="w-4 h-4 accent-brand"
                              />
                              Testnet
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            type="button"
                            disabled={editSubmitting}
                            onClick={saveEdit}
                            className="inline-flex items-center gap-1.5 bg-brand text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                          >
                            <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                            {editSubmitting ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditId(null); setEditForm(null); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                          >
                            <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-text-primary">{account.label}</span>
                            {account.isDefault && (
                              <Badge text="default" variant="custom" customColor="#16a34a" customBgColor="#f0fdf4" />
                            )}
                            {account.isTestnet && (
                              <Badge text="testnet" variant="custom" customColor="#b45309" customBgColor="#fffbeb" />
                            )}
                          </div>
                          <div className="flex gap-4 mt-1.5 text-xs text-text-muted flex-wrap">
                            <span>ID: <span className="font-mono text-text-secondary">{account.clientId}</span></span>
                            <span>Added {fmtDate(account.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!account.isDefault && (
                            <button
                              type="button"
                              disabled={settingDefault === account.id}
                              onClick={() => setDefault(account.id)}
                              title="Set as default"
                              className="p-1.5 rounded text-text-muted hover:text-yellow-500 transition-colors disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(account)}
                            title="Edit"
                            className="p-1.5 rounded text-text-muted hover:text-brand transition-colors"
                          >
                            <FontAwesomeIcon icon={faPencil} className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={removing === account.id}
                            onClick={() => removeAccount(account.id)}
                            title="Remove"
                            className="p-1.5 rounded text-text-muted hover:text-error transition-colors disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Env info */}
        <Card className="mt-8">
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
