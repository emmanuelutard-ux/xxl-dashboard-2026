import { Building2 } from 'lucide-react'
import LogoutButton from './LogoutButton'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-slate-800">XXL Communication</span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-sm text-slate-500">Espace promoteur</span>
        </div>
        <LogoutButton />
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}
