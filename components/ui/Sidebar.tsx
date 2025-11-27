
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, Settings, BarChart3, Calculator, Image as ImageIcon, LogOut, Search, Wand2, Bug, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const clientNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Entonnoir", href: "/funnel", icon: Filter },
    { name: "Derniers Leads", href: "/leads", icon: Users },
    { name: "Créas & Visuels", href: "/media-room", icon: ImageIcon },
];

const internalNavigation = [
    { name: "Générateur Stratégie", href: "/strategy", icon: Wand2 },
    { name: "Simulateur ROI", href: "/simulator", icon: Calculator },
    { name: "Benchmark", href: "/competitors", icon: Search },
];

export function Sidebar() {
    const pathname = usePathname();

    const NavItem = ({ item }: { item: any }) => {
        const isActive = pathname === item.href;
        return (
            <Link
                href={item.href}
                className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                        ? "bg-xxl-blue/10 text-xxl-blue"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
            >
                <item.icon className={cn("h-4 w-4", isActive ? "text-xxl-blue" : "text-slate-500")} />
                {item.name}
            </Link>
        );
    };

    return (
        <div className="flex h-full w-64 flex-col border-r border-slate-200 bg-white text-slate-900">
            {/* Zone Logo */}
            {/* Container Logo : Fond Bleu continu */}
            {/* Container Logo : Fond Bleu continu */}
            <div className="h-16 flex items-center px-6 bg-xxl-blue mb-6">
                <Link href="/" className="relative w-32 h-12 block hover:opacity-90 transition-opacity">
                    <Image src="/logo.png" alt="XXL" fill className="object-contain object-left" priority />
                </Link>
            </div>

            <nav className="flex-1 space-y-6 p-4 overflow-y-auto mb-6">
                {/* Groupe 1 : Espace Clients */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                        Suivi Campagnes
                    </h3>
                    <div className="space-y-1">
                        {clientNavigation.map((item) => (
                            <NavItem key={item.name} item={item} />
                        ))}
                    </div>
                </div>

                {/* Groupe 2 : Outils Internes */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                        Aide à la vente & Stratégie
                    </h3>
                    <div className="space-y-1">
                        {internalNavigation.map((item) => (
                            <NavItem key={item.name} item={item} />
                        ))}
                    </div>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-200 space-y-1">
                <Link
                    href="/settings"
                    className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        pathname === "/settings"
                            ? "bg-xxl-blue/10 text-xxl-blue"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    <Settings className={cn("h-4 w-4", pathname === "/settings" ? "text-xxl-blue" : "text-slate-500")} />
                    Settings
                </Link>
                <Link
                    href="/login"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                </Link>
            </div>
        </div>
    );
}
