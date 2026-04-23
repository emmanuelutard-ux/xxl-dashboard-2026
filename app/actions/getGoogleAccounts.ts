'use server'
import { getGoogleAccessToken } from '@/utils/googleAuth'
import { GOOGLE_ADS_API_VERSION } from './config'

export async function getGoogleAccounts() {
    try {
        console.log("--- TEST API GOOGLE V19 (2026) ---")

        const tokens = await getGoogleAccessToken()
        const { accessToken, developerToken } = tokens

        const baseUrl = 'https://googleads.googleapis.com'
        const endpoint = 'customers:listAccessibleCustomers'
        const apiUrl = new URL(`/${GOOGLE_ADS_API_VERSION}/${endpoint}`, baseUrl).toString()

        console.log("🔗 URL Ciblée :", apiUrl)

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'developer-token': developerToken,
                'Accept': 'application/json'
            },
            cache: 'no-store'
        })

        const responseText = await response.text()

        let data;
        try {
            data = JSON.parse(responseText)
        } catch (e) {
            console.error("❌ CRASH JSON. Réponse brute :", responseText.substring(0, 200))
            // 404 HTML = version API incorrecte ou endpoint invalide
            if (responseText.includes('Error 404')) {
                return { success: false, error: `La version ${GOOGLE_ADS_API_VERSION} est incorrecte. Mettez à jour GOOGLE_ADS_API_VERSION dans config.ts.` }
            }
            return { success: false, error: "L'API a renvoyé du HTML. Version API incorrecte." }
        }

        if (!response.ok) {
            console.error(`❌ Erreur API (${data.error?.code}):`, data.error?.message)
            if (data.error?.status === 'PERMISSION_DENIED') {
                return { success: false, error: "L'API est activée mais votre projet Cloud n'a pas la permission." }
            }
            return { success: false, error: data.error?.message || "Erreur API Google" }
        }

        const accounts = data.resourceNames ? data.resourceNames.map((res: string) => ({
            id: res.split('/')[1],
            name: `Compte ${res.split('/')[1]}`
        })) : []

        console.log(`✅ Succès ! ${accounts.length} comptes trouvés.`)
        return { success: true, accounts }

    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
