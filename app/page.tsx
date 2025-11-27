import Link from "next/link";
import Image from "next/image";
import { LogIn } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative">
            {/* Top Right Login Button */}
            <div className="absolute top-6 right-6">
                <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-xxl-blue transition-colors"
                >
                    <LogIn className="h-4 w-4" />
                    Se connecter
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="max-w-4xl w-full text-center space-y-12">
                    {/* Hero Section */}
                    <div className="space-y-6 flex flex-col items-center">
                        <div className="relative w-64 h-24 mb-4">
                            <Image
                                src="/logo-xxl.png"
                                alt="XXL Communication"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 max-w-3xl mx-auto">
                            Plateforme Partenaire
                        </h1>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                            Accélérez vos ventes, simplifiez vos validations et suivez votre ROI en temps réel.
                        </p>
                    </div>

                    {/* Access Buttons */}
                    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                        {/* Client Access */}
                        <Link
                            href="/dashboard"
                            className="group flex flex-col items-center justify-center p-8 bg-white rounded-2xl border-2 border-xxl-blue shadow-sm hover:shadow-md transition-all duration-200 text-center space-y-4"
                        >
                            <h2 className="text-2xl font-bold text-xxl-blue">Espace Client / Promoteur</h2>
                            <p className="text-slate-600 group-hover:text-xxl-blue transition-colors">
                                Accéder à mon cockpit et valider mes créas.
                            </p>
                        </Link>

                        {/* Agency Access */}
                        <Link
                            href="/strategy"
                            className="group flex flex-col items-center justify-center p-8 bg-xxl-blue rounded-2xl shadow-md hover:bg-xxl-blue/90 hover:shadow-lg transition-all duration-200 text-center space-y-4"
                        >
                            <h2 className="text-2xl font-bold text-white">Espace Agence XXL</h2>
                            <p className="text-blue-100">
                                Accéder aux outils de stratégie et simulateurs.
                            </p>
                        </Link>
                    </div>

                    <div className="pt-8 text-sm text-slate-400">
                        © {new Date().getFullYear()} XXL Communication. Tous droits réservés.
                    </div>
                </div>
            </div>
        </div>
    );
}
