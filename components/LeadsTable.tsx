"use client";

import { useState } from "react";
import {
  Star,
  Phone,
  Mail,
  Globe,
  Facebook,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data Types
type LeadStatus = 'Nouveau' | 'Injoignable' | 'RDV Pris' | 'Abandon';

interface Lead {
  id: string;
  name: string;
  date: string;
  source: 'google' | 'facebook';
  email: string;
  phone: string;
  status: LeadStatus;
  rating: number;
}

const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Sophie Martin',
    date: 'Il y a 2h',
    source: 'google',
    email: 'sophie.m@example.com',
    phone: '06 12 ** **',
    status: 'Nouveau',
    rating: 0,
  },
  {
    id: '2',
    name: 'Jean Dupont',
    date: 'Il y a 4h',
    source: 'facebook',
    email: 'j.dupont@example.com',
    phone: '06 98 ** **',
    status: 'Injoignable',
    rating: 1,
  },
  {
    id: '3',
    name: 'Marie Curie',
    date: 'Hier',
    source: 'google',
    email: 'm.curie@example.com',
    phone: '07 45 ** **',
    status: 'RDV Pris',
    rating: 4,
  },
  {
    id: '4',
    name: 'Pierre Durand',
    date: 'Hier',
    source: 'facebook',
    email: 'p.durand@example.com',
    phone: '06 23 ** **',
    status: 'Abandon',
    rating: 2,
  },
  {
    id: '5',
    name: 'Lucas Bernard',
    date: 'Il y a 2j',
    source: 'google',
    email: 'l.bernard@example.com',
    phone: '06 78 ** **',
    status: 'Nouveau',
    rating: 0,
  },
];

const STATUS_CONFIG: Record<LeadStatus, { color: string; label: string }> = {
  'Nouveau': { color: 'bg-blue-100 text-blue-800', label: 'Nouveau' },
  'Injoignable': { color: 'bg-gray-100 text-gray-800', label: 'Injoignable' },
  'RDV Pris': { color: 'bg-green-100 text-green-800', label: 'RDV Pris' },
  'Abandon': { color: 'bg-red-100 text-red-800', label: 'Abandon' },
};

interface LeadsTableProps {
  programId?: string;
}

export default function LeadsTable({ programId }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);

  const handleRatingChange = (leadId: string, newRating: number) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, rating: newRating } : lead
      )
    );
  };

  const handleStatusChange = (leadId: string, event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as LeadStatus;
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google': return <Globe className="h-4 w-4 text-blue-500" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-700" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col space-y-1.5 mb-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight text-slate-800">Derniers Leads à traiter</h3>
      </div>
      <div>
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Lead</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Statut</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Qualité</th>
                <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                        {getSourceIcon(lead.source)}
                      </div>
                      <span className="font-medium">{lead.name}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground">
                    {lead.date}
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{lead.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="relative">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e)}
                        className={cn(
                          "h-8 w-[130px] rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          STATUS_CONFIG[lead.status].color
                        )}
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <option key={key} value={key} className="bg-background text-foreground">
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingChange(lead.id, star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                          type="button"
                        >
                          <Star
                            className={cn(
                              "h-4 w-4 transition-colors",
                              star <= lead.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/30"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <button
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0"
                      type="button"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Voir fiche</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
