import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { faUser, faCheck, faShieldHalved, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { TextInput, ButtonInput } from '@/components/ui/Input';
import { Badge, Card, CardTitle, AddressDisplay, ConfirmModal, showToast } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { apiRequest } from '@/lib/api/client';

// ── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  businessName: string | null;
  dateOfBirth: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
}

type FormState = {
  firstName: string;
  lastName: string;
  businessName: string;
  dateOfBirth: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

interface LinkedWallet {
  id: string;
  address: string;
  label: string | null;
  createdAt: string;
}

interface ApiKey {
  id: string;
  keyId: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  businessName: '',
  dateOfBirth: '',
  street: '',
  city: '',
  postalCode: '',
  country: '',
};

const WALLET_HEADERS = ['Address', 'Label', 'Linked'];
const KEY_HEADERS = ['Key ID', 'Created', 'Last used', 'Expires', ''];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const [wallets, setWallets] = useState<LinkedWallet[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Profile>('/user/profile');
      setProfile(data);
      setForm({
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        businessName: data.businessName ?? '',
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
        street: data.street ?? '',
        city: data.city ?? '',
        postalCode: data.postalCode ?? '',
        country: data.country ?? '',
      });
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status !== 404) showToast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWallets = useCallback(async () => {
    try {
      const data = await apiRequest<{ wallets: LinkedWallet[] }>('/user-wallets');
      setWallets(data.wallets ?? []);
    } catch {
      /* silent */
    }
  }, []);

  const loadKeys = useCallback(async () => {
    try {
      const data = await apiRequest<{ keys: ApiKey[] }>('/auth/keys');
      setKeys(data.keys ?? []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadWallets();
    loadKeys();
  }, [loadProfile, loadWallets, loadKeys]);

  // ── Profile save ─────────────────────────────────────────────────────────────

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (form.country && !/^[A-Z]{2}$/.test(form.country.toUpperCase()))
      e.country = 'Use ISO alpha-2 (e.g. CH, DE, US)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = await apiRequest<Profile>('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          businessName: form.businessName?.trim() || undefined,
          dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : undefined,
          street: form.street?.trim() || undefined,
          city: form.city?.trim() || undefined,
          postalCode: form.postalCode?.trim() || undefined,
          country: form.country?.trim().toUpperCase() || undefined,
        }),
      });
      setProfile(data);
      showToast.success('Profile updated');
    } catch {
      showToast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ── API key revoke ────────────────────────────────────────────────────────────

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await apiRequest('/auth/revoke', {
        method: 'POST',
        body: JSON.stringify({ keyId: revokeTarget.keyId }),
      });
      showToast.success('API key revoked');
      setRevokeTarget(null);
      loadKeys();
    } catch {
      showToast.error('Failed to revoke key');
    }
  };

  const set = (field: keyof FormState) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—');

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>Profile – Wrytes</title>
      </Head>

      <div className="space-y-8">
        <PageHeader
          title="Profile"
          description="Your personal and business information"
          icon={faUser}
        />

        {loading ? (
          <p className="text-text-secondary text-sm">Loading…</p>
        ) : (
          <>
            {/* ── Row 1: Personal (left) | Business (right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardTitle title="Personal" />
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput
                      label="First name"
                      value={form.firstName}
                      onChange={set('firstName')}
                      error={errors.firstName}
                      placeholder="Alice"
                    />
                    <TextInput
                      label="Last name"
                      value={form.lastName}
                      onChange={set('lastName')}
                      error={errors.lastName}
                      placeholder="Smith"
                    />
                  </div>
                  <TextInput
                    label="Date of birth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={set('dateOfBirth')}
                  />
                </div>
              </Card>

              <Card>
                <CardTitle title="Business" />
                <TextInput
                  label="Business name"
                  value={form.businessName}
                  onChange={set('businessName')}
                  placeholder="Wrytes AG"
                  note="Optional — leave blank for personal accounts"
                />
              </Card>
            </div>

            {/* ── Row 2: Address (left) | Verification (right) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardTitle title="Address" />
                <div className="space-y-3">
                  <TextInput
                    label="Street"
                    value={form.street}
                    onChange={set('street')}
                    placeholder="Bahnhofstrasse 1"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <TextInput
                      label="City"
                      value={form.city}
                      onChange={set('city')}
                      placeholder="Zug"
                    />
                    <TextInput
                      label="Postal code"
                      value={form.postalCode}
                      onChange={set('postalCode')}
                      placeholder="6300"
                    />
                  </div>
                  <TextInput
                    label="Country (ISO)"
                    value={form.country}
                    onChange={set('country')}
                    placeholder="CH"
                    error={errors.country}
                    maxLength={2}
                    note="2-letter code — CH, DE, US…"
                  />
                </div>
              </Card>

              <Card>
                <CardTitle title="Verification" />
                {profile?.isVerified ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <FontAwesomeIcon icon={faShieldHalved} />
                      Verified on {new Date(profile.verifiedAt!).toLocaleDateString()}
                    </div>
                    <p className="text-xs text-text-secondary">
                      Your identity has been verified. Contact support to update your details.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Badge
                      text="Not verified"
                      variant="custom"
                      customColor="text-gray-400"
                      customBgColor="bg-gray-400/10"
                    />
                    <p className="text-xs text-text-secondary">
                      Identity verification is handled by the Wrytes team. Contact support to start
                      the process.
                    </p>
                  </div>
                )}
              </Card>
            </div>

            {/* ── Save ── */}
            <div>
              <ButtonInput
                label={saving ? 'Saving…' : 'Save profile'}
                icon={<FontAwesomeIcon icon={faCheck} />}
                variant="primary"
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              />
            </div>

            {/* ── Linked wallets ── */}
            <Section title="Linked Wallets" titleSize="sm" spacing="sm">
              <Table>
                <TableHead headers={WALLET_HEADERS} colSpan={WALLET_HEADERS.length} />
                <TableBody>
                  {wallets.length === 0 ? (
                    <TableRowEmpty>No wallets linked yet.</TableRowEmpty>
                  ) : (
                    wallets.map(w => (
                      <TableRow
                        key={w.id}
                        headers={WALLET_HEADERS}
                        colSpan={WALLET_HEADERS.length}
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

            {/* ── API Keys ── */}
            <Section
              title="API Keys"
              titleSize="sm"
              spacing="sm"
              hint={<>Use <code className="text-orange-400">/api_create</code> in Telegram to generate a key</>}
            >
              <Table>
                <TableHead headers={KEY_HEADERS} colSpan={KEY_HEADERS.length} />
                <TableBody>
                  {keys.length === 0 ? (
                    <TableRowEmpty>No active API keys.</TableRowEmpty>
                  ) : (
                    keys.map(k => (
                      <TableRow
                        key={k.id}
                        headers={KEY_HEADERS}
                        colSpan={KEY_HEADERS.length}
                        rawHeader
                      >
                        <div className="text-left font-mono text-sm text-text-primary">
                          {k.keyId}
                        </div>
                        <div className="text-right text-text-secondary text-sm">
                          {fmt(k.createdAt)}
                        </div>
                        <div className="text-right text-text-secondary text-sm">
                          {fmt(k.lastUsedAt)}
                        </div>
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
            </Section>
          </>
        )}
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
