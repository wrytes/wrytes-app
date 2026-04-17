import { useEffect, useState, useCallback } from 'react';
import { faUser, faCheck, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { TextInput, ButtonInput } from '@/components/ui/Input';
import { Badge, Card, CardTitle, showToast } from '@/components/ui';
import { apiRequest } from '@/lib/api/client';

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

interface Props {
  isAdmin?: boolean;
  hasScope?: boolean;
  userId?: string;
}

export default function ProfileFormSection({ isAdmin = false, hasScope = false, userId }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const loadProfile = useCallback(async () => {
    if (!hasScope) {
      setLoading(false);
      return;
    }
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
  }, [hasScope]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const set = (field: keyof FormState) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

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

  return (
    <Section>
      <PageHeader
        title="Profile"
        description="Your personal and business information"
        icon={faUser}
        actions={
          hasScope && !loading ? (
            <ButtonInput
              label={saving ? 'Saving…' : 'Save profile'}
              icon={<FontAwesomeIcon icon={faCheck} />}
              variant="primary"
              size="sm"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            />
          ) : undefined
        }
      />

      {!hasScope ? (
        <p className="text-text-secondary text-sm">
          Profile management requires{' '}
          <Badge
            text="LOGIN"
            variant="custom"
            customColor="text-brand"
            customBgColor="bg-brand/10"
            size="sm"
          />
        </p>
      ) : loading ? (
        <p className="text-text-secondary text-sm">Loading…</p>
      ) : (
        <>
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
                  <div className="flex items-center gap-2 text-xs text-success">
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
                    customColor="text-text-muted"
                    customBgColor="bg-surface"
                  />
                  <p className="text-xs text-text-secondary">
                    Identity verification is handled by the Wrytes team. Contact support to start the
                    process.
                  </p>
                  {isAdmin && userId && (
                    <ButtonInput
                      label="Verify profile"
                      variant="primary"
                      size="sm"
                      onClick={async () => {
                        try {
                          await apiRequest(`/user/profile/${userId}/verify`, { method: 'POST' });
                          showToast.success('Profile verified');
                          loadProfile();
                        } catch {
                          showToast.error('Failed to verify profile');
                        }
                      }}
                    />
                  )}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </Section>
  );
}
