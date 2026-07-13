import Head from 'next/head';
import { useRef, useState } from 'react';
import { faUser, faCheck, faLink, faKey, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '@/hooks/useAuth';
import { Section, PageHeader } from '@/components/ui/layout';
import { ButtonInput } from '@/components/ui/input';
import {
  ProfileFormSection,
  LinkedWalletsSection,
  ApiKeysSection,
} from '@/components/features/profile';

export default function ProfilePage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const hasLoginScope = isAdmin || (user?.scopes.includes('LOGIN') ?? false);

  const profileSaveRef = useRef<(() => void) | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Profile – Wrytes</title>
      </Head>
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

        <PageHeader
          className="pt-12"
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

        <PageHeader
          className="pt-12"
          title="API Keys"
          description="Programmatic access tokens — use /api_create in Telegram to generate one"
          icon={faKey}
        />
        <ApiKeysSection hasScope={hasLoginScope} />
      </Section>
    </>
  );
}
