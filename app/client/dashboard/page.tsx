import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ClientProgramCard from '@/components/ClientProgramCard'

export const dynamic = 'force-dynamic'

export default async function ClientDashboardPage() {
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

    // 2. Fetch Programs with total_budget
    const { data: programs, error: programsError } = await supabase
        .from('real_estate_programs')
        .select('*')
        .order('created_at', { ascending: false })

    if (programsError || !programs) {
        return <div className="p-10 text-red-500">Erreur chargement: {programsError?.message}</div>
    }

    // 3. For each program, fetch granular history (Daily Metrics)
    // In a real optimized app, we would use a JOIN or a single query for all history.
    // Given the small number of programs (3), mapping promises is acceptable.
    const programsWithHistory = await Promise.all(programs.map(async (program) => {
        const { data: history } = await supabase
            .from('daily_ad_metrics')
            .select('*')
            .eq('program_id', program.id)
            .order('date', { ascending: true })

        return {
            ...program,
            history: history || []
        }
    }))

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 ml-[260px]"> {/* ml-[260px] to account for sidebar if it exists, otherwise remove */}
            <div className="max-w-5xl mx-auto space-y-10">
                <header>
                    <h1 className="text-3xl font-bold text-slate-900">Mon Espace Promoteur 🏢</h1>
                    <p className="text-slate-500 mt-2">Suivez la performance et l'engagement budgetaire de vos programmes.</p>
                </header>

                <div className="space-y-8">
                    {programsWithHistory.map(program => (
                        <ClientProgramCard
                            key={program.id}
                            program={{
                                id: program.id,
                                name: program.name,
                                status: program.status,
                                total_budget: Number(program.total_budget || 0),
                                conversion_source: program.conversion_source as 'platform' | 'ga4' // Cast legacy type
                            }}
                            history={program.history}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
