'use client'
import { useState } from 'react'
import IntegrationsModal from '@/components/IntegrationsModal'

export default function IntegrationsButton() {
    const [showIntegrations, setShowIntegrations] = useState(false)

    return (
        <>
            <button
                onClick={() => setShowIntegrations(true)}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 mr-3 flex items-center gap-2 transition-colors shadow-sm"
            >
                🔌 Connecteurs
            </button>

            <IntegrationsModal
                isOpen={showIntegrations}
                onClose={() => setShowIntegrations(false)}
            />
        </>
    )
}
