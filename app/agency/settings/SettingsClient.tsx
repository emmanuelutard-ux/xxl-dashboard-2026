'use client'

import { useState } from 'react'
import Link from 'next/link'
import { RefreshCw, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { testGoogleAdsConnection, type TestResult } from '@/app/actions/testGoogleAdsConnection'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IntegrationStatus {
  google: { is_connected: boolean; last_sync: string | null } | null
  meta:   { is_connected: boolean; last_sync: string | null } | null
}

export interface EnvStatus {
  ANTHROPIC_API_KEY:        boolean
  NEXT_PUBLIC_SUPABASE_URL: boolean
  SUPABASE_SERVICE_ROLE_KEY: boolean
}

interface Props {
  integrations: IntegrationStatus
  env: EnvStatus
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-ds-full border px-2.5 py-0.5 text-[11px] font-medium',
      ok
        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
        : 'bg-rose-50 border-rose-100 text-rose-700'
    )}>
      {ok
        ? <CheckCircle className="h-3 w-3" />
        : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SettingsClient({ integrations, env }: Props) {
  const [testing, setTesting]       = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    const result = await testGoogleAdsConnection()
    setTestResult(result)
    setTesting(false)
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── TopBar ── */}
      <header className="flex items-center justify-between pl-14 pr-4 md:px-6 py-3.5 border-b border-sand-200 bg-white shrink-0">
        <div>
          <div className="text-xs text-sand-500 mb-0.5">Paramètres</div>
          <div className="text-lg font-semibold text-sand-900">Connecteurs &amp; environnement</div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-auto p-5">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* ── Section Connecteurs ── */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold text-sand-500 tracking-[0.06em] uppercase">Connecteurs</h2>

            {/* Google Ads */}
            <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <p className="text-[13px] font-semibold text-sand-900">Google Ads</p>
                    <StatusBadge
                      ok={integrations.google?.is_connected ?? false}
                      label={integrations.google?.is_connected ? 'Connecté' : 'Non connecté'}
                    />
                  </div>
                  {integrations.google?.last_sync && (
                    <p className="mt-1 text-[11px] text-sand-500 tabular-nums">
                      Dernière sync : {fmtDate(integrations.google.last_sync)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={testing}
                    onClick={handleTest}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-ds-md border px-3 py-1.5 text-[12px] font-medium transition-colors',
                      testing
                        ? 'cursor-not-allowed border-sand-200 bg-sand-50 text-sand-400'
                        : 'border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    )}
                  >
                    {testing
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5" />}
                    Tester la connexion
                  </button>

                  <Link
                    href="/api/auth/signin/google_ads"
                    className="inline-flex items-center gap-1.5 rounded-ds-md border border-sand-200 bg-white px-3 py-1.5 text-[12px] font-medium text-sand-700 hover:bg-sand-50 transition-colors"
                  >
                    Reconnecter
                  </Link>
                </div>
              </div>

              {/* Résultat du test */}
              {testResult && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {testResult.success
                      ? <CheckCircle className="h-4 w-4 text-emerald-500" />
                      : <AlertCircle className="h-4 w-4 text-rose-500" />}
                    <p className={cn('text-[12px] font-medium', testResult.success ? 'text-emerald-700' : 'text-rose-700')}>
                      {testResult.success
                        ? `Succès — HTTP ${testResult.status}`
                        : `Échec — ${testResult.status ? `HTTP ${testResult.status}` : 'erreur réseau'}`}
                    </p>
                  </div>
                  <pre className="overflow-x-auto rounded-ds-sm border border-sand-200 bg-sand-50 p-3 text-[11px] text-sand-700 whitespace-pre-wrap tabular-nums">
                    {JSON.stringify(testResult.data ?? testResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Meta Ads */}
            <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm p-5">
              <div className="flex items-center gap-2.5">
                <p className="text-[13px] font-semibold text-sand-900">Meta Ads</p>
                <StatusBadge
                  ok={integrations.meta?.is_connected ?? false}
                  label={integrations.meta?.is_connected ? 'Connecté' : 'Non connecté'}
                />
              </div>
              {integrations.meta?.last_sync && (
                <p className="mt-1 text-[11px] text-sand-500 tabular-nums">
                  Dernière sync : {fmtDate(integrations.meta.last_sync)}
                </p>
              )}
            </div>
          </section>

          {/* ── Section Variables d'environnement ── */}
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold text-sand-500 tracking-[0.06em] uppercase">Variables d&apos;environnement</h2>
            <div className="rounded-[10px] border border-sand-200 bg-white divide-y divide-sand-100 shadow-ds-sm overflow-hidden">
              {(Object.entries(env) as [keyof EnvStatus, boolean][]).map(([key, defined]) => (
                <div key={key} className="flex items-center justify-between px-5 py-3">
                  <code className="text-[12px] text-sand-700 font-mono">{key}</code>
                  <StatusBadge ok={defined} label={defined ? 'Définie' : 'Manquante'} />
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

    </div>
  )
}
