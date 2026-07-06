import Head from 'next/head';
import { useCallback, useRef, useState } from 'react';
import {
  faLayerGroup,
  faCheck,
  faUsers,
  faShieldHalved,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '@/hooks/useAuth';
import { Section, PageHeader } from '@/components/ui/Layout';
import { ButtonInput } from '@/components/ui/Input';
import { apiRequest } from '@/lib/api/client';
import type { Namespace } from '@/lib/auth/types';
import {
  NamespaceDetailsSection,
  NamespaceMembersSection,
  NamespaceSafeSection,
} from '@/components/features/Namespace';

export default function NamespacePage() {
  const { activeNamespace, user, setActiveNamespace } = useAuth();
  const isOwner = activeNamespace?.role === 'OWNER';

  const detailsSaveRef = useRef<(() => void) | null>(null);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [predictOpen, setPredictOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!activeNamespace) return;
    try {
      const namespaces = await apiRequest<Namespace[]>('/namespaces');
      const updated = namespaces.find(n => n.id === activeNamespace.id);
      if (updated) setActiveNamespace(updated);
    } catch {
      /* silent */
    }
  }, [activeNamespace, setActiveNamespace]);

  if (!activeNamespace) {
    return (
      <>
        <Head>
          <title>Namespace – Wrytes</title>

        </Head>
        <Section>
          <p className="text-text-secondary text-sm">No active namespace selected.</p>
        </Section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{activeNamespace.name} – Wrytes</title>
      </Head>
      <Section>
        <PageHeader
          title={activeNamespace.name}
          description="Identity and settings for this namespace"
          icon={faLayerGroup}
          actions={
            isOwner ? (
              <ButtonInput
                label={detailsSaving ? 'Saving…' : 'Save'}
                icon={<FontAwesomeIcon icon={faCheck} />}
                variant="primary"
                size="sm"
                onClick={() => detailsSaveRef.current?.()}
                loading={detailsSaving}
                disabled={detailsSaving}
              />
            ) : undefined
          }
        />
        <NamespaceDetailsSection
          namespace={activeNamespace}
          isOwner={isOwner}
          saveRef={detailsSaveRef}
          onSavingChange={setDetailsSaving}
          onSaved={refresh}
        />

        <PageHeader
          className="pt-12"
          title="Members"
          description="Users with access to this namespace"
          icon={faUsers}
        />
        <NamespaceMembersSection
          namespace={activeNamespace}
          currentUserId={user?.id ?? ''}
          isOwner={isOwner}
          onRemoved={refresh}
        />

        <PageHeader
          className="pt-12"
          title="Safe Wallets"
          description="Multisig wallets managed exclusively by namespace members"
          icon={faShieldHalved}
          actions={
            isOwner ? (
              <div className="flex gap-2">
                <ButtonInput
                  label="Add Existing"
                  variant="secondary"
                  size="sm"
                  onClick={() => setLinkOpen(true)}
                />
                <ButtonInput
                  label="Predict Safe"
                  icon={<FontAwesomeIcon icon={faPlus} />}
                  variant="primary"
                  size="sm"
                  onClick={() => setPredictOpen(true)}
                />
              </div>
            ) : undefined
          }
        />
        <NamespaceSafeSection
          namespaceId={activeNamespace.id}
          predictOpen={predictOpen}
          onClosePredict={() => setPredictOpen(false)}
          linkOpen={linkOpen}
          onCloseLink={() => setLinkOpen(false)}
        />
      </Section>
    </>
  );
}
