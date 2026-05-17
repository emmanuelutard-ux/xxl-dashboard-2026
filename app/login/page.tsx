'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        console.log("Tentative de connexion avec:", email)

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error("Erreur Supabase:", error)
            setError(error.message)
            setLoading(false)
            return
        }

        console.log("Connexion réussie, récupération du profil...")

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        const role = profile?.role || 'client'
        console.log("Rôle détecté:", role)

        if (role === 'expert') router.push('/agency')
        else if (role === 'agency') router.push('/agency/media-room')
        else router.push('/client/dashboard')

        router.refresh()
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
            <div className="w-full max-w-md">

                {/* ── Logo + accroche ── */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-11 h-11 rounded-[10px] bg-indigo-600 grid place-items-center text-white text-xl font-semibold italic leading-none">
                        x
                    </div>
                    <div className="mt-3 text-center">
                        <div className="text-[15px] font-semibold text-sand-900 leading-tight">XXL</div>
                        <div className="text-[10px] text-sand-500 uppercase tracking-[0.08em] leading-tight mt-0.5">Agence</div>
                    </div>
                </div>

                {/* ── Carte de connexion ── */}
                <div className="bg-white border border-sand-200 rounded-[10px] shadow-ds-md p-7">
                    <div className="mb-5">
                        <h1 className="text-[18px] font-semibold text-sand-900 leading-tight">Connexion</h1>
                        <p className="mt-1 text-[12px] text-sand-500">
                            Accédez à votre espace de pilotage des campagnes.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 flex items-start gap-2 rounded-[10px] border border-rose-100 bg-rose-50 px-3 py-2.5">
                            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-rose-700 leading-snug">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-semibold text-sand-500 tracking-[0.04em] uppercase mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-ds-sm border border-sand-200 bg-white px-3 py-2 text-[13px] text-sand-900 placeholder:text-sand-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
                                placeholder="vous@xxl.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-sand-500 tracking-[0.04em] uppercase mb-1.5">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-ds-sm border border-sand-200 bg-white px-3 py-2 text-[13px] text-sand-900 placeholder:text-sand-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-ds-md bg-indigo-600 text-white text-[13px] font-medium py-2.5 px-4 border border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {loading ? 'Connexion…' : 'Se connecter'}
                        </button>
                    </form>
                </div>

                {/* ── Footer ── */}
                <p className="mt-5 text-center text-[11px] text-sand-400">
                    Plateforme interne · XXL Communication
                </p>
            </div>
        </div>
    )
}
