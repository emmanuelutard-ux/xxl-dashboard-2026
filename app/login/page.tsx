'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr' // La bonne librairie !
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Initialisation du client Supabase version 2025
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

        // Récupérer le rôle
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        const role = profile?.role || 'client'
        console.log("Rôle détecté:", role)

        // Redirection
        if (role === 'expert') router.push('/expert/cockpit')
        else if (role === 'agency') router.push('/agency/media-room')
        else router.push('/client/dashboard')

        router.refresh()
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
                <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">XXL LOGIN (SSR)</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-slate-900"
                            placeholder="client@xxl.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-slate-900"
                            placeholder="password123"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Connexion...' : 'Se connecter'}
                    </button>
                </form>
            </div>
        </div>
    )
}