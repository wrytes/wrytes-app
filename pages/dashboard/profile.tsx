import Head from 'next/head';
import { useEffect, useState, useCallback } from 'react';
import { faUser, faCheck, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { TextInput } from '@/components/ui/Input';
import { ButtonInput } from '@/components/ui/Input';
import { Badge } from '@/components/ui';
import { showToast } from '@/components/ui';
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const load = useCallback(async () => {
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

  useEffect(() => {
    load();
  }, [load]);

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (form.country && !/^[A-Z]{2}$/.test(form.country.toUpperCase()))
      e.country = 'Use ISO 3166-1 alpha-2 (e.g. CH, DE, US)';
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

  const set = (field: keyof typeof EMPTY) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  return (
    <>
      <Head>
        <title>Profile – Wrytes</title>
      </Head>

      <div className="space-y-8 max-w-xl mx-auto">
        <PageHeader
          title="Profile"
          description="Your personal and business information"
          icon={faUser}
          userInfo={
            profile?.isVerified ? (
              <Badge
                text="Verified"
                variant="custom"
                customColor="text-green-400"
                customBgColor="bg-green-400/10"
              />
            ) : null
          }
        />

        {loading ? (
          <p className="text-text-secondary text-sm">Loading…</p>
        ) : (
          <>
            <Section title="Personal" spacing="sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <TextInput
                  label="Date of birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={set('dateOfBirth')}
                  className="sm:col-span-1"
                />
              </div>
            </Section>

            <Section title="Business" spacing="sm">
              <TextInput
                label="Business name"
                value={form.businessName ?? ''}
                onChange={set('businessName')}
                placeholder="Wrytes AG"
                note="Optional — leave blank for personal accounts"
              />
            </Section>

            <Section title="Address" spacing="sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="Street"
                  value={form.street ?? ''}
                  onChange={set('street')}
                  placeholder="Bahnhofstrasse 1"
                  className="sm:col-span-2"
                />
                <TextInput
                  label="City"
                  value={form.city ?? ''}
                  onChange={set('city')}
                  placeholder="Zug"
                />
                <TextInput
                  label="Postal code"
                  value={form.postalCode ?? ''}
                  onChange={set('postalCode')}
                  placeholder="6300"
                />
                <TextInput
                  label="Country (ISO)"
                  value={form.country ?? ''}
                  onChange={set('country')}
                  placeholder="CH"
                  error={errors.country}
                  maxLength={2}
                  note="2-letter code — CH, DE, US…"
                />
              </div>
            </Section>

            {profile?.isVerified && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <FontAwesomeIcon icon={faShieldHalved} />
                Verified on {new Date(profile.verifiedAt!).toLocaleDateString()}
              </div>
            )}

            <ButtonInput
              label={saving ? 'Saving…' : 'Save profile'}
              icon={<FontAwesomeIcon icon={faCheck} />}
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            />
          </>
        )}
      </div>
    </>
  );
}
