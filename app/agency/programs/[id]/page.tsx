import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Target, TrendingUp, CheckSquare, Megaphone, Users, Sparkles, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { MediaPlan } from '@/app/actions/generateMediaPlan'
import type { Retour } from '@/app/actions/saveRetour'
import PlanChecklistClient from './PlanChecklistClient'
import ProgramInfoEditor from './ProgramInfoEditor'
import RetourButton from './RetourButton'
import ValidatePlanButton from './ValidatePlanButton'
import PrintButton from './PrintButton'
import ManageCampaignsModal from './ManageCampaignsModal'

export const dynamic = 'force-dynamic'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function badgeStatus(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    brief:     { label: 'Brief en cours', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    active:    { label: 'Actif',          cls: 'bg-green-100 text-green-700 border-green-200' },
    paused:    { label: 'En pause',       cls: 'bg-orange-100 text-orange-700 border-orange-200' },
    archived:  { label: 'Archivé',        cls: 'bg-slate-200 text-slate-600 border-slate-300' },
    validated: { label: 'Plan validé',    cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500 border-slate-200' }
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', s.cls)}>
      {s.label}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const [{ data: program, error }, { data: { user } }] = await Promise.all([
    supabase
      .from('real_estate_programs')
      .select('id, name, location, status, budget_google, budget_meta, has_brs, lot_count, ai_media_plan, brief_data, crm_provider, created_at, start_date, end_date, landing_page_url')
      .eq('id', id)
      .single(),
    supabase.auth.getUser(),
  ])

  if (error || !program) notFound()

  const plan = program.ai_media_plan as MediaPlan | null
  const brief = program.brief_data as Record<string, unknown> | null
  const auteur = user?.email ?? 'Anonyme'

  // Retours groupés par section
  const allRetours = (brief?.retours as Retour[]) ?? []
  const retoursPar = (section: string) => allRetours.filter((r) => r.section === section)

  const budgetTotal = (Number(program.budget_google) || 0) + (Number(program.budget_meta) || 0)
  const isValidated = program.status === 'validated'

  const initialCheckedIds: number[] =
    Array.isArray((program.brief_data as Record<string, unknown>)?.checklist_completed)
      ? ((program.brief_data as Record<string, unknown>).checklist_completed as number[])
      : []

  return (
    <div id="program-content" className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* ── En-tête ── */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/agency/media-room"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors print:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour Media Room
            </Link>
            <div className="flex items-center gap-2">
              <ManageCampaignsModal programId={id} />
              <PrintButton programName={program.name} />
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">{program.name}</h1>
                {badgeStatus(program.status)}
              </div>
              {program.location && (
                <p className="mt-1 text-sm text-slate-500">{program.location}</p>
              )}
            </div>

            <div className="flex gap-4 text-right">
              {program.budget_google ? (
                <div>
                  <p className="text-xs text-slate-500">Google Ads</p>
                  <p className="font-bold text-slate-900">{Number(program.budget_google).toLocaleString('fr-FR')} €</p>
                </div>
              ) : null}
              {program.budget_meta ? (
                <div>
                  <p className="text-xs text-slate-500">Meta Ads</p>
                  <p className="font-bold text-slate-900">{Number(program.budget_meta).toLocaleString('fr-FR')} €</p>
                </div>
              ) : null}
              {budgetTotal > 0 && (
                <div className="border-l border-slate-200 pl-4">
                  <p className="text-xs text-slate-500">Budget total</p>
                  <p className="font-bold text-blue-600">{budgetTotal.toLocaleString('fr-FR')} €</p>
                </div>
              )}
            </div>
          </div>

          {/* Infos rapides */}
          <div className="mt-4 flex flex-wrap gap-2">
            {program.has_brs && (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                Lots BRS inclus
              </span>
            )}
            {program.lot_count && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                {program.lot_count} lots
              </span>
            )}
            {brief?.promoteur && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
                {String(brief.promoteur)}
              </span>
            )}
            {plan?.cpl_cible && (
              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                CPL cible : {plan.cpl_cible} €
              </span>
            )}
          </div>
        </div>

        {/* ── Informations campagne ── */}
        <ProgramInfoEditor
          programId={program.id}
          initial={{
            start_date:       program.start_date       ?? null,
            end_date:         program.end_date         ?? null,
            budget_google:    program.budget_google    ? Number(program.budget_google)    : null,
            budget_meta:      program.budget_meta      ? Number(program.budget_meta)      : null,
            landing_page_url: program.landing_page_url ?? null,
          }}
        />

        {/* ── Pas de plan encore ── */}
        {!plan && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">Le plan média n&apos;a pas encore été généré pour ce programme.</p>
            </CardContent>
          </Card>
        )}

        {plan && (
          <>
            {/* ── Note stratégique ── */}
            {plan.notes_strategie && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
                <p className="text-sm font-semibold text-blue-800">Note stratégique</p>
                <p className="mt-1 text-sm text-blue-700">{plan.notes_strategie}</p>
              </div>
            )}

            {/* ── Cibles & Positionnement ── */}
            {(plan.personas?.length > 0 || plan.uvp) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    Cibles & Positionnement
                  </h2>
                  <RetourButton
                    programId={program.id}
                    section="cibles-positionnement"
                    initialRetours={retoursPar('cibles-positionnement')}
                    auteur={auteur}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                  {/* Personas */}
                  {plan.personas?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-blue-500" />
                          Personas cibles
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {plan.personas.map((p, i) => (
                          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-900 text-sm">{p.nom}</p>
                              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                {p.age_range}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                            <div className="mt-2 flex flex-col gap-1">
                              <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="shrink-0 font-medium text-slate-500">Frein :</span>
                                <span>{p.point_de_douleur}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                <span className="shrink-0 font-medium text-slate-500">Canal :</span>
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                  {p.canal_privilegie}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* UVP */}
                  {plan.uvp && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-blue-500" />
                          Proposition de valeur
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Accroche</p>
                          <p className="mt-1 text-base font-bold text-slate-900">&ldquo;{plan.uvp.accroche}&rdquo;</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Arguments de vente</p>
                          <ul className="mt-1 space-y-1">
                            {plan.uvp.arguments_vente.map((arg, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
                                  {i + 1}
                                </span>
                                {arg}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Angle créatif</p>
                          <p className="mt-1 text-sm text-slate-600 italic">{plan.uvp.angle_creatif}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* ── Timeline des phases ── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Phases du plan média
                  </CardTitle>
                  <RetourButton
                    programId={program.id}
                    section="phases"
                    initialRetours={retoursPar('phases')}
                    auteur={auteur}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />
                  <div className="space-y-6 pl-6">
                    {plan.phases.map((phase, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-6 mt-1 h-3.5 w-3.5 rounded-full border-2 border-blue-600 bg-white" />
                        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-900">{phase.nom}</p>
                              <p className="text-xs text-blue-600 font-medium">{phase.duree}</p>
                            </div>
                            <div className="flex gap-3 text-right text-sm">
                              <div>
                                <p className="text-xs text-slate-500">Google</p>
                                <p className="font-bold text-slate-900">{phase.budget_google.toLocaleString('fr-FR')} €</p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Meta</p>
                                <p className="font-bold text-slate-900">{phase.budget_meta.toLocaleString('fr-FR')} €</p>
                              </div>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{phase.objectif}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Tableau des campagnes ── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Megaphone className="h-4 w-4 text-blue-600" />
                    Campagnes
                  </CardTitle>
                  <RetourButton
                    programId={program.id}
                    section="campagnes"
                    initialRetours={retoursPar('campagnes')}
                    auteur={auteur}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                        <th className="px-5 py-3 text-left">Canal</th>
                        <th className="px-5 py-3 text-left">Nom</th>
                        <th className="px-5 py-3 text-left">Type</th>
                        <th className="px-5 py-3 text-right">Budget</th>
                        <th className="px-5 py-3 text-right">Budget/jour</th>
                        <th className="px-5 py-3 text-left">Détails</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plan.campagnes.map((c, i) => {
                        const budgetFaible = c.budget_quotidien !== undefined && c.budget_quotidien < 40
                        return (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3">
                              <span className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-semibold',
                                c.canal === 'google' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                              )}>
                                {c.canal === 'google' ? 'Google' : 'Meta'}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-medium text-slate-900">{c.nom}</td>
                            <td className="px-5 py-3">
                              <span className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                c.type_accession === 'brs' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                              )}>
                                {c.type_accession === 'brs' ? 'BRS' : 'Classique'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-slate-900">
                              {c.budget.toLocaleString('fr-FR')} €
                            </td>
                            <td className="px-5 py-3 text-right">
                              {c.budget_quotidien !== undefined ? (
                                <span className={cn('font-semibold tabular-nums', budgetFaible ? 'text-orange-600' : 'text-slate-700')}>
                                  {c.budget_quotidien.toLocaleString('fr-FR')} €
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3 max-w-xs">
                              <div className="flex flex-col gap-1">
                                {c.canal === 'google' && c.mots_cles && (
                                  <span className="text-xs text-slate-500">
                                    {c.mots_cles.slice(0, 4).join(', ')}
                                    {c.mots_cles.length > 4 && ` +${c.mots_cles.length - 4}`}
                                  </span>
                                )}
                                {c.canal === 'meta' && (
                                  <span className="text-xs text-slate-500">
                                    {[c.type_lead_gen, c.format, c.ciblage].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                                {budgetFaible && c.recommandation_structure && (
                                  <div className="flex items-start gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1">
                                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-orange-500" />
                                    <span className="text-[10px] leading-tight text-orange-700">
                                      {c.recommandation_structure}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* ── Checklist ── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckSquare className="h-4 w-4 text-blue-600" />
                    Checklist de lancement
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      {plan.checklist.length} tâches
                    </span>
                  </CardTitle>
                  <RetourButton
                    programId={program.id}
                    section="checklist"
                    initialRetours={retoursPar('checklist')}
                    auteur={auteur}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <PlanChecklistClient
                  programId={program.id}
                  checklist={plan.checklist}
                  initialCheckedIds={initialCheckedIds}
                />
              </CardContent>
            </Card>

            {/* ── Validation du plan média ── */}
            <ValidatePlanButton
              programId={program.id}
              initialValidated={isValidated}
            />
          </>
        )}

        {/* ── Données du brief ── */}
        {brief && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-slate-400" />
                Données du brief
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                {[
                  ['Promoteur', brief.promoteur],
                  ['Durée campagne', brief.campaign_duration_days ? `${brief.campaign_duration_days} jours` : null],
                  ['LP fournie par', brief.lp_provider],
                  ['CRM', brief.crm_autre ?? program.crm_provider],
                  ['Pixel Meta', brief.pixel_meta_status],
                  ['Tracking Google', brief.google_ads_tracking_status],
                  ['GA4', brief.ga4_status],
                  ['Page Facebook', brief.facebook_access_status],
                  ['GTM', brief.gtm_status],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={String(label)}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-800 capitalize">{String(value).replace(/_/g, ' ')}</dd>
                  </div>
                ))}
              </dl>
              {!!brief.notes && (
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
                  <p>{String(brief.notes)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
