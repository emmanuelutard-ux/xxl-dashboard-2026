import { syncGoogleAds } from '@/app/actions/syncGoogleAds'
import { type NextRequest, NextResponse } from 'next/server'

// Déclenchement manuel ou cron Vercel (Authorization: Bearer CRON_SECRET)
export async function POST(request: NextRequest) {
  // Vérification optionnelle du secret cron en production
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const body = await request.json().catch(() => ({})) as { programId?: string }
  const result = await syncGoogleAds(body.programId)

  return NextResponse.json(result, { status: result.success ? 200 : 500 })
}
