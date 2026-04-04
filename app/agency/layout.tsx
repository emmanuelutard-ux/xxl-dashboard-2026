import AgencyNav from '@/components/AgencyNav'

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <AgencyNav />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
