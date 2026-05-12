'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Building2 } from 'lucide-react'

export default function ClientLoginPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/client`,
      },
    })

    if (error) {
      setError("Une erreur s'est produite. Vérifiez votre adresse email et réessayez.")
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-xl bg-blue-50 p-3">
              <Building2 className="h-7 w-7 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Espace promoteur</h1>
          <p className="mt-1 text-sm text-slate-500">XXL Communication</p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
            <p className="font-semibold text-green-800">Email envoyé !</p>
            <p className="mt-1 text-sm text-green-700">
              Vérifiez votre boîte de réception et cliquez sur le lien de connexion.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="vous@exemple.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Envoi en cours…' : 'Recevoir mon lien de connexion'}
            </button>

            <p className="text-center text-xs text-slate-400">
              Saisissez votre adresse email pour recevoir un lien de connexion sécurisé.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
