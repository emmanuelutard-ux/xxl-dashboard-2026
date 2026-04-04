import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ExpertProgramList, { ExpertProgramData } from '@/components/ExpertProgramList'
import CreateProgramButton from '@/components/CreateProgramButton'
import IntegrationsButton from '@/components/IntegrationsButton'

export const dynamic = 'force-dynamic'

export default async function ExpertCockpitPage() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { }
            }
        }
    )

    // 1. Fetch User (Safety Check)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Access Denied</div>

    // 2. Fetch Programs
    const { data: programs, error: programsError } = await supabase
        .from('real_estate_programs')
        .select('*')
        .order('created_at', { ascending: false })

    if (programsError || !programs) {
        return <div className="p-10 text-red-500">Erreur chargement programmes: {programsError?.message}</div>
    }

    // 3. Fetch Metrics & Aggregate per program
    const programsWithMetrics: ExpertProgramData[] = await Promise.all(programs.map(async (p) => {
        const { data: metrics } = await supabase
            .from('daily_ad_metrics')
            .select('spend, platform_conversions, ga4_conversions')
            .eq('program_id', p.id)

        const total_spend = metrics?.reduce((sum, m) => sum + (Number(m.spend) || 0), 0) || 0
        const total_leads_platform = metrics?.reduce((sum, m) => sum + (Number(m.platform_conversions) || 0), 0) || 0
        const total_leads_ga4 = metrics?.reduce((sum, m) => sum + (Number(m.ga4_conversions) || 0), 0) || 0

        const cpl_platform = total_leads_platform > 0 ? total_spend / total_leads_platform : 0
        const cpl_ga4 = total_leads_ga4 > 0 ? total_spend / total_leads_ga4 : 0

        return {
            id: p.id,
            name: p.name,
            status: p.status as 'active' | 'archived',
            conversion_source: p.conversion_source as 'platform' | 'ga4',
            metrics: {
                total_spend,
                total_leads_platform,
                total_leads_ga4,
                cpl_platform,
                cpl_ga4
            },
            total_budget: p.total_budget,
            start_date: p.start_date,
            end_date: p.end_date
        }
    }))

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-10 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Cockpit Expert 🚀</h1>
                        <p className="text-slate-500 mt-2">
                            Gérez les sources de vérité et analysez les écarts de conversion.
                        </p>
                    </div>
                    <div className="flex items-center">
                        <IntegrationsButton />
                        <CreateProgramButton />
                    </div>
                </header>

                <ExpertProgramList programs={programsWithMetrics} />
            </div>
        </div>
    )
}