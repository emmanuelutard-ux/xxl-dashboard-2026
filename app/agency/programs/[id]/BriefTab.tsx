'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronRight, Globe } from 'lucide-react'
import { ChannelLogo } from '@/components/ds/ChannelLogo'

interface BriefTabProps {
  briefData: Record<string, unknown> | null
  program: {
    name: string
    location: string | null
    has_brs: boolean
    lot_count: number | null
    budget_google: number
    budget_meta: number
    status: string
    created_at?: string | null
    updated_at?: string | null
  }
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '–'
  const d = iso.split('T')[0]
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-sand-100">
        <p className="text-[13px] font-semibold text-sand-900">{title}</p>
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] text-sand-400 w-36 shrink-0 pt-0.5 uppercase tracking-[0.05em]">
        {label}
      </span>
      <span className="text-[13px] text-sand-900">{children}</span>
    </div>
  )
}

const CRM_LABELS: Record<string, string> = {
  unlatch:      'Unlatch',
  adlead:       'AdLead',
  google_sheets: 'Google Sheets',
  aucun:        'Aucun',
  autre:        'Autre',
}

export default function BriefTab({ briefData, program }: BriefTabProps) {
  const [metaOpen, setMetaOpen] = useState(false)

  if (!briefData) {
    return (
      <div className="rounded-[10px] border border-dashed border-sand-300 bg-white py-16 text-center">
        <p className="text-[13px] font-medium text-sand-500">Aucun brief renseigné</p>
        <p className="mt-1 text-[12px] text-sand-400">
          Créez d&apos;abord un brief pour ce programme.
        </p>
      </div>
    )
  }

  const promoteur     = briefData.promoteur      ? String(briefData.promoteur)      : null
  const targetProfiles = Array.isArray(briefData.target_profiles)
    ? (briefData.target_profiles as string[])
    : []
  const usp           = briefData.usp            ? String(briefData.usp)            : null
  const notes         = briefData.notes          ? String(briefData.notes)          : null
  const googleActive  = Boolean(briefData.google_active)
  const metaActive    = Boolean(briefData.meta_active)
  const googleStart   = briefData.google_start   ? String(briefData.google_start)   : null
  const googleEnd     = briefData.google_end     ? String(briefData.google_end)     : null
  const metaStart     = briefData.meta_start     ? String(briefData.meta_start)     : null
  const metaEnd       = briefData.meta_end       ? String(briefData.meta_end)       : null
  const lpNotReady    = Boolean(briefData.lp_not_ready)
  const lpUrl         = briefData.landing_page_url ? String(briefData.landing_page_url) : null
  const crmProvider   = briefData.crm_provider   ? String(briefData.crm_provider)   : null

  const uspLines = usp
    ? usp.split('\n').map(l => l.replace(/^[-•*]\s*/, '')).filter(Boolean)
    : []

  return (
    <div className="space-y-4">

      {/* Bloc Programme */}
      <SectionCard title="Programme">
        <FieldRow label="Nom">
          <span className="font-medium">{program.name}</span>
        </FieldRow>
        {promoteur && <FieldRow label="Promoteur">{promoteur}</FieldRow>}
        {program.location && <FieldRow label="Localisation">{program.location}</FieldRow>}
        {program.lot_count !== null && (
          <FieldRow label="Lots">
            {program.lot_count} lots
            {program.has_brs && (
              <span className="ml-2 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5">
                inclut BRS
              </span>
            )}
          </FieldRow>
        )}
        {crmProvider && (
          <FieldRow label="CRM">{CRM_LABELS[crmProvider] ?? crmProvider}</FieldRow>
        )}
        <FieldRow label="Landing page">
          {lpNotReady ? (
            <span className="text-amber-600 text-[12px]">Non disponible au lancement</span>
          ) : lpUrl ? (
            <a
              href={lpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline text-[12px] flex items-center gap-1 break-all"
            >
              <Globe className="h-3 w-3 shrink-0" />
              {lpUrl}
            </a>
          ) : (
            <span className="text-sand-400">–</span>
          )}
        </FieldRow>
      </SectionCard>

      {/* Bloc Cible & USP */}
      {(targetProfiles.length > 0 || uspLines.length > 0 || notes) && (
        <SectionCard title="Cible & USP">
          {targetProfiles.length > 0 && (
            <div>
              <p className="text-[11px] text-sand-400 uppercase tracking-[0.05em] mb-2">
                Profils cibles
              </p>
              <div className="flex flex-wrap gap-1.5">
                {targetProfiles.map(p => (
                  <span
                    key={p}
                    className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {uspLines.length > 0 && (
            <div>
              <p className="text-[11px] text-sand-400 uppercase tracking-[0.05em] mb-2">
                Arguments de vente (USP)
              </p>
              <ul className="space-y-1.5">
                {uspLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-sand-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {notes && (
            <div>
              <p className="text-[11px] text-sand-400 uppercase tracking-[0.05em] mb-1.5">
                Notes complémentaires
              </p>
              <p className="text-[13px] text-sand-500 whitespace-pre-line">{notes}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* Bloc Budget & dates par régie */}
      <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-sand-100">
          <p className="text-[13px] font-semibold text-sand-900">Budget & dates par régie</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-sand-100">
          {/* Google */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <ChannelLogo channel="google" size={14} />
              <span className="text-[13px] font-semibold text-sand-900">Google Ads</span>
              {!googleActive && (
                <span className="text-[10px] text-sand-400 font-medium bg-sand-100 rounded-full px-2 py-0.5">
                  Non activé
                </span>
              )}
            </div>
            {googleActive ? (
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] text-sand-400 uppercase tracking-[0.05em] mb-0.5">Budget</p>
                  <p className="text-[20px] font-bold tabular-nums text-sand-900">
                    {program.budget_google.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-sand-400 uppercase tracking-[0.05em] mb-0.5">Période</p>
                  <p className="text-[13px] tabular-nums text-sand-800">
                    {fmtDate(googleStart)} → {fmtDate(googleEnd)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-sand-400">Google Ads non activé pour ce programme.</p>
            )}
          </div>

          {/* Meta */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <ChannelLogo channel="meta" size={14} />
              <span className="text-[13px] font-semibold text-sand-900">Meta Ads</span>
              {!metaActive && (
                <span className="text-[10px] text-sand-400 font-medium bg-sand-100 rounded-full px-2 py-0.5">
                  Non activé
                </span>
              )}
            </div>
            {metaActive ? (
              <div className="space-y-2">
                <div>
                  <p className="text-[11px] text-sand-400 uppercase tracking-[0.05em] mb-0.5">Budget</p>
                  <p className="text-[20px] font-bold tabular-nums text-sand-900">
                    {program.budget_meta.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-sand-400 uppercase tracking-[0.05em] mb-0.5">Période</p>
                  <p className="text-[13px] tabular-nums text-sand-800">
                    {fmtDate(metaStart)} → {fmtDate(metaEnd)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[12px] text-sand-400">Meta Ads non activé pour ce programme.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bloc Métadonnées (collapsible) */}
      <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
        <button
          onClick={() => setMetaOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-sand-50 transition-colors"
        >
          <p className="text-[13px] font-semibold text-sand-900">Métadonnées</p>
          {metaOpen
            ? <ChevronDown className="h-4 w-4 text-sand-400" />
            : <ChevronRight className="h-4 w-4 text-sand-400" />
          }
        </button>
        {metaOpen && (
          <div className="px-5 py-4 border-t border-sand-100 space-y-2">
            {program.created_at && (
              <FieldRow label="Créé le">{fmtDate(program.created_at)}</FieldRow>
            )}
            {program.updated_at && (
              <FieldRow label="Mis à jour">{fmtDate(program.updated_at)}</FieldRow>
            )}
            <FieldRow label="Statut">{program.status}</FieldRow>
          </div>
        )}
      </div>

    </div>
  )
}
