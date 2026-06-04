import Head from 'next/head';
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faKey, faTrash, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useKrakenCredentials } from '@/hooks/redux/useKrakenCredentials';
import { Section } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import TextInput from '@/components/ui/Input/TextInput';
import ButtonInput from '@/components/ui/Input/ButtonInput';
import { cn } from '@/lib/utils';

export default function RoutesSettingsPage() {
  const { apiKey, apiSecret, isConfigured, save, clear } = useKrakenCredentials();

  const [keyDraft, setKeyDraft] = useState(apiKey);
  const [secretDraft, setSecretDraft] = useState(apiSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeyDraft(apiKey);
    setSecretDraft(apiSecret);
  }, [apiKey, apiSecret]);

  const isDirty = keyDraft !== apiKey || secretDraft !== apiSecret;
  const isValid = keyDraft.trim().length > 0 && secretDraft.trim().length > 0;

  function handleSave() {
    save(keyDraft.trim(), secretDraft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleClear() {
    clear();
    setKeyDraft('');
    setSecretDraft('');
  }

  return (
    <>
      <Head>
        <title>Settings – Wrytes Routes</title>
      </Head>

      <Section
        title="Kraken API Credentials"
        description="Connect your Kraken account to enable automated fiat conversion for onramp and offramp routes."
        padding="lg"
        spacing="lg"
      >
        <Card className="max-w-lg">
          <div className="flex flex-col gap-5">
            {/* Status badge */}
            <div className={cn(
              'flex items-center gap-2 text-sm px-3 py-2 rounded-lg',
              isConfigured ? 'bg-success-bg text-success border border-success-border' : 'bg-surface text-text-muted'
            )}>
              <span className={cn('w-2 h-2 rounded-full', isConfigured ? 'bg-success' : 'bg-text-muted')} />
              {isConfigured ? 'Credentials saved — Kraken connected' : 'No credentials configured'}
            </div>

            {/* API Key */}
            <TextInput
              label="API Key"
              placeholder="Enter your Kraken API key"
              value={keyDraft}
              onChange={setKeyDraft}
            />

            {/* API Secret — manual password field with show/hide */}
            <div>
              <div className="border-2 rounded-lg px-3 py-1 transition-colors border-input-border hover:border-brand focus-within:!border-brand">
                <div className="text-input-label mt-1 mb-0.5 text-sm">API Secret</div>
                <div className="flex items-center gap-2">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={secretDraft}
                    onChange={e => setSecretDraft(e.target.value)}
                    placeholder="Enter your Kraken API secret"
                    className="w-full bg-transparent text-lg py-1.5 outline-none text-text-primary placeholder:text-input-empty"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(v => !v)}
                    className="text-text-muted hover:text-brand transition-colors shrink-0"
                  >
                    <FontAwesomeIcon icon={showSecret ? faEyeSlash : faEye} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <ButtonInput
                label={saved ? 'Saved' : 'Save credentials'}
                onClick={handleSave}
                disabled={!isDirty || !isValid || saved}
                variant="primary"
                icon={
                  saved
                    ? <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                    : <FontAwesomeIcon icon={faKey} className="w-4 h-4" />
                }
              />
              {isConfigured && (
                <ButtonInput
                  label="Clear"
                  onClick={handleClear}
                  variant="error"
                  icon={<FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />}
                />
              )}
            </div>

            {/* Security note */}
            <p className="text-xs text-text-muted border-t border-surface pt-4">
              Credentials are stored locally in your browser and never sent to our servers.
              Use a Kraken API key scoped to <strong>Query Funds</strong> and <strong>Withdraw Funds</strong> only.
            </p>
          </div>
        </Card>

        {/* Getting started hint */}
        {!isConfigured && (
          <Card className="max-w-lg bg-surface/40">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-text-primary">How to get your Kraken API key</p>
              <ol className="text-sm text-text-secondary space-y-1 list-decimal list-inside">
                <li>Log in to your Kraken account</li>
                <li>Go to <strong>Security → API</strong></li>
                <li>Create a new key with <em>Query Funds</em> and <em>Withdraw Funds</em> permissions</li>
                <li>Copy the key and secret, then paste them above</li>
              </ol>
            </div>
          </Card>
        )}
      </Section>
    </>
  );
}
