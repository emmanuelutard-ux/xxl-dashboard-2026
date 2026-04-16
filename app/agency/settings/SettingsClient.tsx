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
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
      ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    )}>
      {ok
        ? <CheckCircle className="h-3.5 w-3.5" />
        : <XCircle className="h-3.5 w-3.5" />}
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
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>
        <p className="mt-1 text-sm text-slate-500">Configuration des connecteurs et variables d&apos;environnement.</p>
      </div>

      {/* ── Section Connecteurs ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Connecteurs</h2>

        {/* Google Ads */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-slate-900">Google Ads</p>
                <StatusBadge
                  ok={integrations.google?.is_connected ?? false}
                  label={integrations.google?.is_connected ? 'Connecté' : 'Non connecté'}
                />
              </div>
              {integrations.google?.last_sync && (
                <p className="mt-1 text-xs text-slate-500">
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
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  testing
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'
                )}
              >
                {testing
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                Tester la connexion
              </button>

              <Link
                href="/api/auth/signin/google"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
                  ? <CheckCircle className="h-4 w-4 text-green-600" />
                  : <AlertCircle className="h-4 w-4 text-red-500" />}
                <p className={cn('text-sm font-medium', testResult.success ? 'text-green-700' : 'text-red-700')}>
                  {testResult.success
                    ? `Succès — HTTP ${testResult.status}`
                    : `Échec — ${testResult.status ? `HTTP ${testResult.status}` : 'erreur réseau'}`}
                </p>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap">
                {JSON.stringify(testResult.data ?? testResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Meta Ads */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <p className="font-semibold text-slate-900">Meta Ads</p>
            <StatusBadge
              ok={integrations.meta?.is_connected ?? false}
              label={integrations.meta?.is_connected ? 'Connecté' : 'Non connecté'}
            />
          </div>
          {integrations.meta?.last_sync && (
            <p className="mt-1 text-xs text-slate-500">
              Dernière sync : {fmtDate(integrations.meta.last_sync)}
            </p>
          )}
        </div>
      </section>

      {/* ── Section Variables d'environnement ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Variables d&apos;environnement</h2>
        <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm">
          {(Object.entries(env) as [keyof EnvStatus, boolean][]).map(([key, defined]) => (
            <div key={key} className="flex items-center justify-between px-5 py-3">
              <code className="text-sm text-slate-700">{key}</code>
              <StatusBadge ok={defined} label={defined ? 'Définie' : 'Manquante'} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
