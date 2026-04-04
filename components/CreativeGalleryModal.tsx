'use client'

import { useState, useEffect, useCallback } from 'react'
import { uploadAsset } from '@/app/actions/uploadAsset'
import { updateAssetStatus } from '@/app/actions/updateAssetStatus'
import { createBrowserClient } from '@supabase/ssr'

// --- VISUEL DES BADGES ---
const getStatusColor = (status: string) => {
    switch (status) {
        case 'validated': return 'bg-green-100 text-green-800 border-green-200'
        case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
        default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
}
const getStatusEmoji = (status: string) => {
    switch (status) {
        case 'validated': return '✅'
        case 'rejected': return '❌'
        default: return '⏳'
    }
}

export default function CreativeGalleryModal({ isOpen, onClose, program }: any) {
    const [isUploading, setIsUploading] = useState(false)
    const [loadingUpload, setLoadingUpload] = useState(false)
    const [assets, setAssets] = useState<any[]>([])
    const [loadingAssets, setLoadingAssets] = useState(false)
    const [processingAssetId, setProcessingAssetId] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // --- CHARGEMENT DES ASSETS ---
    const fetchAssets = useCallback(async () => {
        if (!program?.id) return
        setLoadingAssets(true)
        const { data, error } = await supabase
            .from('creative_assets')
            .select('*')
            .eq('program_id', program.id)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setAssets(data)
        }
        setLoadingAssets(false)
    }, [program?.id, supabase])

    useEffect(() => {
        if (isOpen) {
            fetchAssets()
            setIsUploading(false)
        }
    }, [isOpen, fetchAssets])

    if (!isOpen) return null

    // --- LOGIQUE TOGGLE (ROLLBACK) ---
    const handleStatusChange = async (assetId: string, currentStatus: string, action: 'validated' | 'rejected') => {
        setProcessingAssetId(assetId)

        // Logique de bascule : Si on clique sur le statut actuel, on revient à "pending"
        const newStatus = (currentStatus === action) ? 'pending' : action

        const result = await updateAssetStatus(assetId, newStatus)

        if (result.success) {
            await fetchAssets() // Mise à jour de l'affichage
        } else {
            // Affiche la vraie erreur technique pour le débogage
            alert("⚠️ Erreur : " + result.error)
        }
        setProcessingAssetId(null)
    }

    const handleUpload = async (formData: FormData) => {
        setLoadingUpload(true)
        formData.append('programId', program.id)
        const result = await uploadAsset(formData)
        setLoadingUpload(false)

        if (result.success) {
            await fetchAssets()
            setIsUploading(false)
        } else {
            alert("Erreur d'upload : " + result.error)
        }
    }

    // --- AFFICHAGE ---
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[900px] max-h-[85vh] overflow-y-auto font-inter">

                {/* En-tête */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Médiathèque 🎨</h2>
                        <p className="text-sm text-slate-500">Programme : <span className="font-medium">{program.name}</span></p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2">✖️</button>
                </div>

                {/* Mode Upload ou Mode Galerie */}
                {isUploading ? (
                    <div className="bg-slate-50 p-8 rounded-xl border-2 border-dashed border-slate-300 text-center animate-in fade-in">
                        <h3 className="text-lg font-bold text-slate-700 mb-6">Importer un nouveau fichier</h3>
                        <form action={handleUpload} className="space-y-6 max-w-md mx-auto text-left">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Fichier</label>
                                <input type="file" name="file" accept="image/*,video/*" required className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                                <select name="type" className="w-full border-slate-300 p-2 rounded-md">
                                    <option value="image">🖼️ Image</option>
                                    <option value="video">🎥 Vidéo</option>
                                </select>
                            </div>
                            <div className="flex justify-center gap-3 pt-4">
                                <button type="button" onClick={() => setIsUploading(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md">Annuler</button>
                                <button type="submit" disabled={loadingUpload} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                                    {loadingUpload ? 'Import...' : 'Importer l\'image'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-700">Visuels ({assets.length})</h3>
                            <button onClick={() => setIsUploading(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                                ➕ Ajouter un visuel
                            </button>
                        </div>

                        {loadingAssets ? (
                            <div className="text-center py-10 text-slate-500">Chargement... 🔄</div>
                        ) : assets.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Aucun visuel.</div>
                        ) : (
                            <div className="grid grid-cols-3 gap-6">
                                {assets.map((asset) => (
                                    <div key={asset.id} className="relative group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                        <div className="aspect-square bg-slate-100 relative">
                                            {asset.type === 'video' ? (<video src={asset.url} className="w-full h-full object-cover" controls />) : (<img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />)}
                                        </div>
                                        <div className="p-3 border-t border-slate-100">
                                            <p className="text-xs text-slate-500 truncate mb-2">{asset.name}</p>
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusColor(asset.status)}`}>
                                                    {getStatusEmoji(asset.status)} {asset.status === 'pending' ? 'En attente' : (asset.status === 'validated' ? 'Validé' : 'Rejeté')}
                                                </span>

                                                {/* BOUTONS AVEC LOGIQUE ROLLBACK */}
                                                <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleStatusChange(asset.id, asset.status, 'validated')}
                                                        disabled={processingAssetId === asset.id}
                                                        className={`p-1 rounded transition-colors ${asset.status === 'validated' ? 'bg-green-100 text-green-700' : 'hover:bg-green-50 text-slate-400 hover:text-green-600'}`}
                                                        title={asset.status === 'validated' ? 'Annuler la validation' : 'Valider'}
                                                    >
                                                        ✅
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(asset.id, asset.status, 'rejected')}
                                                        disabled={processingAssetId === asset.id}
                                                        className={`p-1 rounded transition-colors ${asset.status === 'rejected' ? 'bg-red-100 text-red-700' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'}`}
                                                        title={asset.status === 'rejected' ? 'Annuler le rejet' : 'Rejeter'}
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
