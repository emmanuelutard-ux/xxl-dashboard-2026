"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Users, Building2, Briefcase, Loader2 } from "lucide-react";

export function RoleSwitcher() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    // Instance Supabase Client-side
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const roles = [
        { id: 'client', email: 'client@xxl.com', label: 'Client / Promoteur', icon: Building2, path: '/client/dashboard' },
        { id: 'agency', email: 'agency@xxl.com', label: 'Agence XXL', icon: Users, path: '/agency/media-room' },
        { id: 'expert', email: 'expert@xxl.com', label: 'Expert Acquisition', icon: Briefcase, path: '/expert/cockpit' },
    ];

    const handleSwitch = async (roleId: string, email: string, redirectPath: string) => {
        setLoading(roleId);

        try {
            // 1. Logout current user
            await supabase.auth.signOut();

            // 2. Login as target user
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: 'password123',
            });

            if (error) throw error;

            // 3. Refresh router to update middleware/server components
            router.refresh();

            // 4. Redirect
            router.push(redirectPath);

        } catch (error) {
            console.error("Erreur lors du switch de compte:", error);
            alert("Erreur de connexion (Vérifiez que les comptes seeds existent)");
            setLoading(null);
        }
        // Note: We don't Reset loading state immediately on success because we are navigating away 
        // and we want to show smooth transition.
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-white p-2 rounded-lg shadow-lg border border-slate-200 flex flex-col md:flex-row gap-2">
            <div className="hidden md:flex items-center px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Demo Switcher
            </div>
            {roles.map((r) => {
                const Icon = r.icon;
                const isLoading = loading === r.id;
                return (
                    <button
                        key={r.id}
                        onClick={() => handleSwitch(r.id, r.email, r.path)}
                        disabled={!!loading}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all border border-transparent
                            ${isLoading ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm'}
                        `}
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                        <span className="hidden md:inline font-medium">{r.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
