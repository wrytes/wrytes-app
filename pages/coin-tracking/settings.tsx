import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import { faSliders } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import { apiRequest } from '@/lib/api/client';
import { AccountsPanel } from '@/components/features/Accounting/AccountsPanel';
import { TemplatesPanel } from '@/components/features/Accounting/TemplatesPanel';
import type { AccountingAccount, ClassificationTemplate } from '@/components/features/Accounting/types';

export default function CoinTrackingSettingsPage() {
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [templates, setTemplates] = useState<ClassificationTemplate[]>([]);

  const loadAccounts = useCallback(async () => {
    const data = await apiRequest<AccountingAccount[]>('/accounting/accounts');
    setAccounts(data);
  }, []);

  const loadTemplates = useCallback(async () => {
    const data = await apiRequest<ClassificationTemplate[]>('/accounting/templates');
    setTemplates(data);
  }, []);

  useEffect(() => {
    void loadAccounts();
    void loadTemplates();
  }, [loadAccounts, loadTemplates]);

  return (
    <>
      <Head>
        <title>Coin Tracking Settings – Wrytes</title>
        <meta name="description" content="Chart of accounts and classification journal templates." />
      </Head>
      <Section>
        <PageHeader
          title="Settings"
          description="Chart of accounts and classification → journal account mappings."
          icon={faSliders}
        />
        <div className="space-y-3">
          <AccountsPanel
            accounts={accounts}
            onRefresh={async () => {
              await loadAccounts();
              await loadTemplates();
            }}
          />
          <TemplatesPanel templates={templates} accounts={accounts} onRefresh={loadTemplates} />
        </div>
      </Section>
    </>
  );
}
