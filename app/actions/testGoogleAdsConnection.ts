'use server'

import { getGoogleAccessToken } from '@/utils/googleAuth'

const MCC_ID = '8667313568'

export interface TestResult {
  success: boolean
  status: number | null
  data: unknown
  error: string | null
}

export async function testGoogleAdsConnection(): Promise<TestResult> {
  try {
    const { accessToken, developerToken } = await getGoogleAccessToken()

    if (!developerToken) {
      return {
        success: false,
        status: null,
        data: null,
        error: 'developer_token est NULL en base — renseignez-le dans integration_settings',
      }
    }

    const res = await fetch(
      'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers',
      {
        method: 'GET',
        headers: {
          'Authorization':       `Bearer ${accessToken}`,
          'developer-token':     developerToken.trim(),
          'login-customer-id':   MCC_ID,
          'x-goog-api-version':  '17',
        },
        cache: 'no-store',
      }
    )

    const data = await res.json()

    console.log('[testGoogleAdsConnection] status:', res.status)
    console.log('[testGoogleAdsConnection] body:', JSON.stringify(data).slice(0, 500))

    return {
      success: res.ok,
      status: res.status,
      data,
      error: res.ok ? null : JSON.stringify(data, null, 2),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[testGoogleAdsConnection]', message)
    return { success: false, status: null, data: null, error: message }
  }
}
