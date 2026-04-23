'use client'
import { useState, useEffect } from 'react'
import { saveIntegrationSettings } from '@/app/actions/saveIntegrationSettings'
import { getIntegrationStatus } from '@/app/actions/getIntegrationStatus'

export default function IntegrationsModal({ isOpen, onClose }: any) {
    const [configMode, setConfigMode] = useState<'google' | 'meta' | null>(null)
    const [status, setStatus] = useState<any>({})

    // Au chargement, on vérifie qui est connecté
    useEffect(() => {
        if (isOpen) {
            getIntegrationStatus().then(setStatus)
        }
    }, [isOpen])

    if (!isOpen) return null

    // --- VUE CONFIGURATION (Inchangée) ---
    if (configMode) {
        const isGoogle = configMode === 'google'
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-[500px] p-6 animate-in fade-in zoom-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Configuration {isGoogle ? 'Google Ads' : 'Meta Ads'} ⚙️</h3>
                        <button onClick={() => setConfigMode(null)} className="text-slate-400 hover:text-slate-600">Retour</button>
                    </div>
                    <form action={async (formData) => {
                        const res = await saveIntegrationSettings(formData)
                        if (res.success) { alert("Sauvegardé !"); setConfigMode(null) }
                        else { alert("Erreur : " + res.error) }
                    }} className="space-y-4">
                        <input type="hidden" name="service" value={isGoogle ? 'google_ads' : 'meta_ads'} />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{isGoogle ? 'OAuth Client ID' : 'App ID'}</label>
                            <input name="client_id" type="text" required className="w-full border p-2 rounded text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{isGoogle ? 'OAuth Client Secret' : 'App Secret'}</label>
                            <input name="client_secret" type="password" required className="w-full border p-2 rounded text-sm" />
                        </div>
                        {isGoogle && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Developer Token</label>
                                <input name="developer_token" type="text" placeholder="Pending approval..." className="w-full border p-2 rounded text-sm bg-yellow-50" />
                                <p className="text-xs text-slate-500 mt-1">Laissez vide si en attente de validation.</p>
                            </div>
                        )}
                        <div className="pt-4 flex justify-end gap-2">
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Sauvegarder</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    // --- VUE PRINCIPALE ---
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[650px] p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800">Connecteurs Publicitaires 🔌</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2">✖️</button>
                </div>

                <div className="space-y-4">
                    {/* GOOGLE ADS */}
                    <div className={`border rounded-lg p-4 flex items-start gap-4 transition-colors bg-white ${status.google_ads ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
                        <div className="text-4xl">🇬</div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                    Google Ads
                                    {status.google_ads && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Connecté ✅</span>}
                                </h3>
                                <button onClick={() => setConfigMode('google')} className="text-xs text-blue-600 hover:underline">⚙️ Configurer</button>
                            </div>
                            <p className="text-sm text-slate-500 mb-3">Synchronisation des campagnes via MCC.</p>

                            {status.google_ads ? (
                                <div className="space-y-2">
                                    <div className="text-sm text-green-700 font-medium">
                                        Connexion active. Prêt à synchroniser.
                                    </div>
                                    {/* BOUTON TEST TEMPORAIRE */}
                                    <form action={async () => {
                                        const { getGoogleAccounts } = await import('@/app/actions/getGoogleAccounts')
                                        const res = await getGoogleAccounts()
                                        if (res.success) {
                                            alert("✅ Comptes trouvés : " + JSON.stringify(res.accounts))
                                        } else {
                                            alert("❌ Erreur : " + res.error)
                                        }
                                    }}>
                                        <button className="text-xs bg-slate-800 text-white px-3 py-1 rounded">Tester l'API 📡</button>
                                    </form>
                                </div>
                            ) : (
                                <a href="/api/auth/signin/google_ads" className="text-xs bg-white text-slate-700 px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 flex items-center gap-2 font-medium w-fit">
                                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Se connecter avec Google
                                </a>
                            )}
                        </div>
                    </div>

                    {/* META ADS (Placeholder) */}
                    <div className="border border-slate-200 rounded-lg p-4 flex items-start gap-4 opacity-75">
                        <div className="text-4xl">♾️</div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <h3 className="font-bold text-slate-700">Meta Ads</h3>
                                <button onClick={() => setConfigMode('meta')} className="text-xs text-blue-600 hover:underline">⚙️ Configurer</button>
                            </div>
                            <p className="text-sm text-slate-500">Bientôt disponible.</p>
                        </div>
                    </div>

                    {/* IMPORT CSV */}
                    <div className="mt-6 pt-6 border-t-2 border-slate-100 border-dashed">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                            📥 Import Manuel (CSV)
                            <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Actif</span>
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <form action={async (formData) => {
                                try {
                                    const { importPrograms } = await import('@/app/actions/importPrograms')
                                    const res = await importPrograms(formData)
                                    if (res.success) { alert("✅ " + res.message); onClose() }
                                    else { alert("❌ Erreur : " + res.error) }
                                } catch (e) { alert("Erreur système.") }
                            }}>
                                <div className="flex gap-2">
                                    <input type="file" name="file" accept=".csv" required className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer bg-white border border-slate-200 rounded-md" />
                                    <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-black whitespace-nowrap font-medium shadow-sm">Importer</button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
