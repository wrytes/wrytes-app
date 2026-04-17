import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import {
  faCheckCircle,
  faCopy,
  faExclamationTriangle,
  faKey,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Section } from '@/components/ui/Layout';
import { PageHeader } from '@/components/ui/Layout';
import { Card } from '@/components/ui';
import { ButtonInput } from '@/components/ui/Input';
import { Badge } from '@/components/ui';
import { CONFIG } from '@/lib/constants';

type PageState = 'loading' | 'success' | 'error'

interface VerifyResult {
  apiKey: string
  expiresAt: string | null
}

export default function ApiKeyConfirmPage() {
  const router = useRouter()
  const { token } = router.query

  const [state, setState] = useState<PageState>('loading')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const copyRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const consumed = useRef(false)

  useEffect(() => {
    if (!token || typeof token !== 'string') return
    if (consumed.current) return
    consumed.current = true

    fetch(`${CONFIG.api}/auth/verify?token=${token}`)
      .then(async res => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.message || `HTTP ${res.status}`)
        return body as VerifyResult
      })
      .then(data => { setResult(data); setState('success') })
      .catch(err => { setErrorMsg(err.message || 'Something went wrong'); setState('error') })
  }, [token])

  const handleCopy = () => {
    if (!result?.apiKey) return
    navigator.clipboard.writeText(result.apiKey)
    setCopied(true)
    if (copyRef.current) clearTimeout(copyRef.current)
    copyRef.current = setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      <Head>
        <title>API Key – Wrytes</title>
      </Head>

      <div className="w-full max-w-lg mx-auto">
        <Section>
            <PageHeader
              title="API Key"
              description="Wrytes — programmatic access token"
              icon={faKey}
            />

            <Card>
              {/* Loading */}
              {state === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <FontAwesomeIcon icon={faSpinner} className="text-3xl text-brand animate-spin" />
                  <p className="text-text-secondary text-sm">Verifying token…</p>
                </div>
              )}

              {/* Error */}
              {state === 'error' && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-red-900/20 rounded-lg">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">Verification failed</p>
                      <p className="text-red-400/70 text-xs mt-1">{errorMsg}</p>
                    </div>
                  </div>
                  <p className="text-text-secondary text-xs">
                    Magic links are single-use and expire after 15 minutes. Generate a new one with{' '}
                    <code className="text-brand">/api_create</code> in Telegram.
                  </p>
                  <ButtonInput
                    label="Go to dashboard"
                    variant="secondary"
                    onClick={() => router.push('/dashboard')}
                    className="w-full"
                  />
                </div>
              )}

              {/* Success */}
              {state === 'success' && result && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      <span>Key created successfully</span>
                    </div>
                    {result.expiresAt && (
                      <Badge
                        text={`Expires ${new Date(result.expiresAt).toLocaleDateString()}`}
                        variant="custom"
                        customColor="text-gray-400"
                        customBgColor="bg-gray-400/10"
                        size="sm"
                      />
                    )}
                  </div>

                  <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-xs font-medium">
                      Copy this key now — it will not be shown again.
                    </p>
                  </div>

                  <div
                    onClick={handleCopy}
                    className="group flex items-center justify-between gap-3 bg-surface rounded-lg px-4 py-3 cursor-pointer hover:bg-surface/80 transition-colors"
                  >
                    <code className="text-brand text-sm font-mono break-all select-all flex-1">
                      {result.apiKey}
                    </code>
                    <FontAwesomeIcon
                      icon={copied ? faCheckCircle : faCopy}
                      className={`flex-shrink-0 text-sm transition-colors ${
                        copied ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-300'
                      }`}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-text-secondary text-xs">
                      Send this key in the{' '}
                      <code className="text-brand">X-API-Key</code> request header.
                    </p>
                    <ButtonInput
                      label="Go to dashboard"
                      variant="primary"
                      onClick={() => router.push('/dashboard')}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </Card>
          </Section>
      </div>
    </>
  )
}
