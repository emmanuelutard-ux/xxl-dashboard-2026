'use server'

import { getGoogleAccessToken } from '@/utils/googleAuth'

const MCC_ID    = '8667313568'
const API_URL   = 'https://googleads.googleapis.com/v17/customers:listAccessibleCustomers'

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

    const headers = {
      'Authorization':      `Bearer ${accessToken.slice(0, 10)}…`,
      'developer-token':    `${developerToken.trim().slice(0, 6)}…`,
      'login-customer-id':  MCC_ID,
      'x-goog-api-version': '17',
    }

    console.log('[testGoogleAdsConnection] URL appelée:', API_URL)
    console.log('[testGoogleAdsConnection] Headers envoyés:', headers)

    const res = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization':      `Bearer ${accessToken}`,
        'developer-token':    developerToken.trim(),
        'login-customer-id':  MCC_ID,
        'x-goog-api-version': '17',
      },
      cache: 'no-store',
    })

    const rawText = await res.text()

    console.log('[testGoogleAdsConnection] status:', res.status)
    console.log('[testGoogleAdsConnection] réponse brute (500 chars):', rawText.slice(0, 500))

    return {
      success: res.ok,
      status: res.status,
      data: rawText,
      error: res.ok ? null : rawText,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[testGoogleAdsConnection]', message)
    return { success: false, status: null, data: null, error: message }
  }
}
