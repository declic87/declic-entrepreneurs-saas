"use client";
import React, { useState } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone,
  ArrowUpRight,
  Clock
} from "lucide-react";

// Types pour la structure
const leadsData = [
  { id: 1, name: "Jean Dupont", email: "jean@tech.fr", status: "Nouveau", value: "2,500€", source: "Facebook", date: "Il y a 2h" },
  { id: 2, name: "Sophie Martin", email: "s.martin@gmail.com", status: "En cours", value: "1,200€", source: "Webinar", date: "Il y a 5h" },
  { id: 3, name: "Lucas Bernard", email: "lucas@startup.io", status: "Rdv Fixé", value: "5,000€", source: "LinkedIn", date: "Hier" },
  { id: 4, name: "Marie Leroy", email: "m.leroy@pme.fr", status: "Urgent", value: "850€", source: "Appel entrant", date: "Hier" },
];

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout
      userRole="COMMERCIAL"
      userName="Admin Commercial"
      userEmail="comm@declic.fr"
    >
      <div className="space-y-6">
        {/* Header avec Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-blue-dark tracking-tight">Gestion des Leads</h1>
            <p className="text-gray-500">Centralisez et qualifiez vos opportunités entrantes</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-200">
            <Plus size={20} /> Nouveau Lead
          </button>
        </div>

        {/* Barre de Recherche et Filtres */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un nom, email ou source..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-gray-600 font-medium">
            <Filter size={18} /> Filtres
          </button>
        </div>

        {/* Tableau des Leads */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Lead</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Valeur Est.</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Source</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leadsData.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-blue-dark">{lead.name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={12} /> {lead.date}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-gray-700">{lead.value}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${
                      lead.status === "Urgent" ? "bg-red-100 text-red-600" :
                      lead.status === "Rdv Fixé" ? "bg-emerald-100 text-emerald-600" :
                      "bg-blue-100 text-blue-600"
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 font-medium">{lead.source}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white rounded-lg border text-gray-400 hover:text-blue-600"><Phone size={16}/></button>
                      <button className="p-2 hover:bg-white rounded-lg border text-gray-400 hover:text-blue-600"><Mail size={16}/></button>
                      <button className="p-2 hover:bg-white rounded-lg border text-gray-400 hover:text-blue-600"><ArrowUpRight size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}