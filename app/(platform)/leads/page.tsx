import LeadsTable from "@/components/LeadsTable";

export default function LeadsPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestion des Leads</h1>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <LeadsTable />
            </div>
        </div>
    );
}
