import Head from 'next/head';
import { useRef, useState } from 'react';
import {
  faUser,
  faCheck,
  faBuildingColumns,
  faShield,
  faLink,
  faKey,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '@/hooks/useAuth';
import PageTabInput from '@/components/ui/Input/PageTabInput';
import { Section, PageHeader } from '@/components/ui/Layout';
import { ButtonInput } from '@/components/ui/Input';
import {
  ProfileFormSection,
  LinkedWalletsSection,
  ApiKeysSection,
} from '@/components/features/Profile';
import { BankAccountsSection, SafeWalletsSection } from '@/components/features/Accounts';

export default function ProfilePage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const hasLoginScope = isAdmin || (user?.scopes.includes('LOGIN') ?? false);
  const hasBankScope = isAdmin || (user?.scopes.includes('BANK') ?? false);
  const hasSafeScope = isAdmin || (user?.scopes.includes('SAFE') ?? false);

  const profileSaveRef = useRef<(() => void) | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [bankAddOpen, setBankAddOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Profile – Wrytes</title>
      </Head>
      <PageTabInput
        tabs={[
          {
            label: 'Profile',
            content: (
              <Section>
                <PageHeader
                  title="Profile"
                  description="Your personal and business information"
                  icon={faUser}
                  actions={
                    hasLoginScope ? (
                      <ButtonInput
                        label={profileSaving ? 'Saving…' : 'Save profile'}
                        icon={<FontAwesomeIcon icon={faCheck} />}
                        variant="primary"
                        size="sm"
                        onClick={() => profileSaveRef.current?.()}
                        loading={profileSaving}
                        disabled={profileSaving}
                      />
                    ) : undefined
                  }
                />
                <ProfileFormSection
                  isAdmin={isAdmin}
                  hasScope={hasLoginScope}
                  userId={user?.id}
                  saveRef={profileSaveRef}
                  onSavingChange={setProfileSaving}
                />
              </Section>
            ),
          },
          {
            label: 'Accounts',
            content: (
              <Section>
                <PageHeader
                  title="Accounts"
                  description="Bank Account and Safe Wallet destinations"
                  icon={faBuildingColumns}
                  actions={
                    hasBankScope ? (
                      <ButtonInput
                        label="Add account"
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        variant="primary"
                        size="sm"
                        onClick={() => setBankAddOpen(true)}
                      />
                    ) : undefined
                  }
                />
                <BankAccountsSection
                  hasScope={hasBankScope}
                  addOpen={bankAddOpen}
                  onCloseAdd={() => setBankAddOpen(false)}
                />

                <PageHeader
                  title="Safe Accounts"
                  description="Company-managed multi-sig deposit addresses"
                  icon={faShield}
                />
                <SafeWalletsSection hasScope={hasSafeScope} />
              </Section>
            ),
          },
          {
            label: 'Wallets',
            content: (
              <Section>
                <PageHeader
                  title="Linked Wallets"
                  description="EOA addresses you can use to sign in"
                  icon={faLink}
                  actions={
                    hasLoginScope ? (
                      <ButtonInput
                        label="Link wallet"
                        icon={<FontAwesomeIcon icon={faPlus} />}
                        variant="primary"
                        size="sm"
                        onClick={() => setLinkOpen(true)}
                      />
                    ) : undefined
                  }
                />
                <LinkedWalletsSection
                  hasScope={hasLoginScope}
                  linkOpen={linkOpen}
                  onCloseLink={() => setLinkOpen(false)}
                />
              </Section>
            ),
          },
          {
            label: 'API Keys',
            content: (
              <Section>
                <PageHeader
                  title="API Keys"
                  description="Programmatic access tokens — use /api_create in Telegram to generate one"
                  icon={faKey}
                />
                <ApiKeysSection hasScope={hasLoginScope} />
              </Section>
            ),
          },
        ]}
      />
    </>
  );
}
