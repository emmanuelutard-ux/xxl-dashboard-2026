'use client'
import { useState } from 'react'
import { updateProgram } from '@/app/actions/updateProgram'
import CreativeGalleryModal from './CreativeGalleryModal' // On importe la galerie

export default function EditProgramModal({ isOpen, onClose, program }: any) {
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('infos') // 'infos' | 'brief'
    const [showGallery, setShowGallery] = useState(false) // Pour ouvrir la galerie depuis ici

    if (!isOpen) return null

    // Si on veut ouvrir la galerie, on affiche le composant galerie par-dessus
    if (showGallery) {
        return <CreativeGalleryModal isOpen={true} program={program} onClose={() => setShowGallery(false)} />
    }

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        await updateProgram(program.id, formData)
        setLoading(false)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] overflow-hidden flex flex-col max-h-[90vh] font-inter">

                {/* En-tête coloré */}
                <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Gestion du Programme 🛠️</h2>
                        <p className="text-sm text-slate-500">{program.name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-white border rounded-full p-2 hover:bg-slate-100 transition-colors">✖️</button>
                </div>

                <form action={handleSubmit} className="flex-1 overflow-y-auto">

                    {/* Onglets de navigation */}
                    <div className="flex border-b bg-white sticky top-0 z-10">
                        <button
                            type="button"
                            onClick={() => setActiveTab('infos')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'infos' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            📊 Paramètres & Dates
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('brief')}
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'brief' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            📝 Brief & URL
                        </button>
                    </div>

                    <div className="p-6 space-y-6">

                        {/* --- CONTENU ONGLET 1 : INFOS --- */}
                        <div className={activeTab === 'infos' ? 'block space-y-5' : 'hidden'}>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-blue-900">Médiathèque du programme</h4>
                                    <p className="text-xs text-blue-700">Gérez les photos et vidéos de la campagne.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowGallery(true)}
                                    className="bg-white text-blue-600 border border-blue-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-50 shadow-sm transition-colors"
                                >
                                    📂 Ouvrir la Médiathèque
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Statut du Programme</label>
                                    <select name="status" defaultValue={program.status} className="w-full border-slate-300 p-2.5 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                        <option value="active">🟢 En cours (Active)</option>
                                        <option value="pending">🟡 En préparation (Pending)</option>
                                        <option value="archived">⚫ Terminé / Archivé</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Budget Total (€)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400">€</span>
                                        <input name="total_budget" type="number" defaultValue={program.total_budget} className="w-full border-slate-300 pl-8 p-2.5 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                                    <input name="start_date" type="date" defaultValue={program.start_date ? program.start_date.split('T')[0] : ''} className="w-full border-slate-300 p-2.5 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date de fin</label>
                                    <input name="end_date" type="date" defaultValue={program.end_date ? program.end_date.split('T')[0] : ''} className="w-full border-slate-300 p-2.5 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                                </div>
                            </div>
                        </div>

                        {/* --- CONTENU ONGLET 2 : BRIEF --- */}
                        <div className={activeTab === 'brief' ? 'block space-y-5' : 'hidden'}>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Landing Page (URL)</label>
                                <input
                                    name="landing_page_url"
                                    type="url"
                                    placeholder="https://www.mon-programme.com"
                                    defaultValue={program.landing_page_url || ''}
                                    className="w-full border-slate-300 p-2.5 rounded-md shadow-sm bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                />
                                <p className="text-xs text-slate-500 mt-1">Lien vers la page de vente du programme.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Briefing & Notes pour l'Expert</label>
                                <textarea
                                    name="campaign_brief"
                                    rows={8}
                                    placeholder="Instructions particulières, cibles prioritaires, message clé à faire passer..."
                                    defaultValue={program.campaign_brief || ''}
                                    className="w-full border-slate-300 p-3 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                    </div>

                    {/* Pied de page */}
                    <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium transition-colors">Annuler</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md font-medium transition-all disabled:opacity-50">
                            {loading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
