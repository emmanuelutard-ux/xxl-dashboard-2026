"use client";

import { useState } from "react";
import { Check, X, Image as ImageIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";

type VisualStatus = 'En attente' | 'Validé' | 'Refusé';
type VisualType = 'Image' | 'Video';

interface Visual {
    id: string;
    title: string;
    type: VisualType;
    status: VisualStatus;
    url: string;
}

const MOCK_VISUALS: Visual[] = [
    {
        id: '1',
        title: 'Campagne Lancement FB',
        type: 'Image',
        status: 'En attente',
        url: 'https://placehold.co/600x400?text=Pub+Facebook',
    },
    {
        id: '2',
        title: 'Bannière Google 300x250',
        type: 'Image',
        status: 'En attente',
        url: 'https://placehold.co/300x250?text=Banniere+Google',
    },
    {
        id: '3',
        title: 'Story Instagram',
        type: 'Video',
        status: 'Validé',
        url: 'https://placehold.co/400x700?text=Story+Instagram',
    },
    {
        id: '4',
        title: 'Carrousel LinkedIn',
        type: 'Image',
        status: 'Refusé',
        url: 'https://placehold.co/500x500?text=Carrousel+LinkedIn',
    },
];

const STATUS_STYLES: Record<VisualStatus, string> = {
    'En attente': 'bg-yellow-100 text-yellow-800',
    'Validé': 'bg-green-100 text-green-800',
    'Refusé': 'bg-red-100 text-red-800',
};

export default function MediaRoomPage() {
    const [visuals, setVisuals] = useState<Visual[]>(MOCK_VISUALS);

    const handleStatusChange = (id: string, newStatus: VisualStatus) => {
        setVisuals(prev =>
            prev.map(visual =>
                visual.id === id ? { ...visual, status: newStatus } : visual
            )
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Media Room</h1>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-800">Validation des supports</h2>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {visuals.map((visual) => (
                        <div
                            key={visual.id}
                            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                        >
                            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                                {/* Placeholder for image/video */}
                                <img
                                    src={visual.url}
                                    alt={visual.title}
                                    className="h-full w-full object-cover transition-transform hover:scale-105"
                                />
                                <div className="absolute top-2 right-2">
                                    <span className={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                                        STATUS_STYLES[visual.status]
                                    )}>
                                        {visual.status}
                                    </span>
                                </div>
                                <div className="absolute top-2 left-2">
                                    <span className="inline-flex items-center rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                        {visual.type === 'Video' ? <Video className="mr-1 h-3 w-3" /> : <ImageIcon className="mr-1 h-3 w-3" />}
                                        {visual.type}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-semibold leading-none tracking-tight mb-4 text-slate-900">{visual.title}</h3>

                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        onClick={() => handleStatusChange(visual.id, 'Validé')}
                                        className="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-200 h-9 px-3"
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Valider
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(visual.id, 'Refusé')}
                                        className="inline-flex flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 h-9 px-3"
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Rejeter
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
