import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AgencyDashboardClient, { AgencyProgramData } from '@/components/AgencyDashboardClient'

export const dynamic = 'force-dynamic'

const PERIOD_START = '2026-01-01'

export default async function AgencyDashboardPage() {
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

    // 1. Fetch User
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

    const periodEnd = new Date().toISOString().split('T')[0]

    // 3. Fetch & Aggregate Metrics depuis PERIOD_START uniquement
    const portfolio: AgencyProgramData[] = await Promise.all(programs.map(async (p) => {
        const { data: metrics } = await supabase
            .from('daily_ad_metrics')
            .select('spend, platform_conversions, ga4_conversions')
            .eq('program_id', p.id)
            .gte('date', PERIOD_START)

        const spent          = metrics?.reduce((sum, m) => sum + (Number(m.spend) || 0), 0) || 0
        const leads_platform = metrics?.reduce((sum, m) => sum + (Number(m.platform_conversions) || 0), 0) || 0
        const leads_ga4      = metrics?.reduce((sum, m) => sum + (Number(m.ga4_conversions) || 0), 0) || 0

        return {
            id:           p.id,
            name:         p.name,
            status:       p.status,
            total_budget: Number(p.total_budget || 0),
            start_date:   p.start_date || null,
            end_date:     p.end_date   || null,
            metrics:      { spent, leads_platform, leads_ga4 },
        }
    }))

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Media Room Agence 📈</h1>
                        <p className="text-slate-500 mt-2">Vue consolidée de la performance des campagnes.</p>
                    </div>
                </header>

                <AgencyDashboardClient
                    programs={portfolio}
                    periodStart={PERIOD_START}
                    periodEnd={periodEnd}
                />
            </div>
        </div>
    )
}
