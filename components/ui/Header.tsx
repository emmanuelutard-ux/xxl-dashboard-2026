import { Bell, Search } from "lucide-react";

export function Header() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-xxl-blue px-6 text-white">
            <div className="flex flex-1 items-center gap-4">
                <Search className="h-4 w-4 text-white/70" />
                <input
                    type="search"
                    placeholder="Rechercher..."
                    className="flex h-9 w-full rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-white shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-white/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 md:w-[300px]"
                />
            </div>
            <div className="flex items-center gap-4">
                <button className="size-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Bell className="h-4 w-4 text-white" />
                </button>
                <div className="h-8 w-8 rounded-full bg-white/20" />
            </div>
        </header>
    );
}
