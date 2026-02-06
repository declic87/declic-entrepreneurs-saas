"use client";

import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  PhoneCall, 
  Clock, 
  Plus, 
  ChevronRight, 
  AlertCircle 
} from "lucide-react";

// ... (votre setterNavItems reste inchangé)

export default function SetterDashboard() {
  return (
    <DashboardLayout navItems={setterNavItems}>
      <div className="space-y-6">
        {/* Header avec bouton d'action rapide */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Dashboard Setter</h1>
            <p className="text-gray-500">Objectif du jour : 40 appels (70% complétés)</p>
          </div>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-100">
            <Plus size={20} /> Nouvel Appel
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Users />} count="62" label="Leads à appeler" color="text-blue-600" bg="bg-blue-100" />
            <StatCard icon={<PhoneCall />} count="28" label="Appels aujourd'hui" color="text-emerald-600" bg="bg-emerald-100" />
            <StatCard icon={<Calendar />} count="12" label="RDV pris ce mois" color="text-orange-600" bg="bg-orange-100" />
            <StatCard icon={<Clock />} count="3h24" label="Temps d'appel" color="text-purple-600" bg="bg-purple-100" />
        </div>

        {/* Section Priorités du jour */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-blue-900">Leads prioritaires</h2>
                <button className="text-sm text-blue-600 hover:underline">Voir tout</button>
            </div>
            
            <div className="space-y-4">
              {[
                { name: "Jean Dupont", time: "Il y a 10 min", status: "Nouveau" },
                { name: "Marie Morel", time: "Hier", status: "Relance" },
                { name: "Lucas Bernard", time: "Il y a 2h", status: "Urgent" },
              ].map((lead, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:bg-slate-50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-900">
                      {lead.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">{lead.name}</p>
                      <p className="text-xs text-gray-400">Inscrit {lead.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        lead.status === 'Urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {lead.status}
                    </span>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini-calendrier ou Rappels */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-orange-500" /> Rappels
            </h2>
            <div className="space-y-4">
               <div className="p-4 bg-orange-50 rounded-xl border-l-4 border-orange-400">
                  <p className="text-sm font-bold text-orange-800 italic">Rappeler Marc A.</p>
                  <p className="text-xs text-orange-700">Prévu à 14h30 - "Besoin de détails sur l'offre PRO"</p>
               </div>
               <p className="text-sm text-gray-400 text-center py-4">Aucun autre rappel pour aujourd'hui.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, count, label, color, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center`}>
                    {icon}
                </div>
                <div>
                    <p className="text-2xl font-bold text-blue-900">{count}</p>
                    <p className="text-sm text-gray-500">{label}</p>
                </div>
            </div>
        </div>
    );
}