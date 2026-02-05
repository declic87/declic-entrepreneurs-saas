"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/ui/dashboard-layout";
import { Users, TrendingUp, Mail, Phone, MoreVertical, Target, Calendar, Award, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const hosNavItems = [
  { label: "Dashboard", href: "/hos", icon: TrendingUp },
  { label: "Mon Équipe", href: "/hos/equipe", icon: Users },
  { label: "Pipeline", href: "/hos/pipeline", icon: Target },
  { label: "Rendez-vous", href: "/hos/rdv", icon: Calendar },
  { label: "Performance", href: "/hos/performance", icon: Award },
];

export default function TeamPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const team = [
    { id: 1, name: "Jean Dupont", role: "Closer Senior", status: "En ligne", sales: "12", revenue: "24 500€", email: "jean@declic.fr" },
    { id: 2, name: "Alice Martin", role: "SDR", status: "En rendez-vous", sales: "8", revenue: "14 200€", email: "alice@declic.fr" },
    { id: 3, name: "Lucas Meyer", role: "Closer", status: "Hors ligne", sales: "10", revenue: "18 900€", email: "lucas@declic.fr" },
    { id: 4, name: "Sophie Vallet", role: "Closer Senior", status: "En ligne", sales: "15", revenue: "31 800€", email: "sophie@declic.fr" },
  ];

  return (
    <DashboardLayout
      navItems={hosNavItems}
      userRole="HOS"
      userName="Marie HOS"
      userEmail="hos@declic.fr"
    >
      <div className="space-y-6">
        {/* Header de la page */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mon Équipe</h1>
            <p className="text-slate-500 text-sm">Suivi des performances individuelles des commerciaux.</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2 transition-all">
            <UserPlus size={18} />
            Ajouter un commercial
          </Button>
        </div>

        {/* Barre de recherche et filtres rapides */}
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher par nom ou rôle..." 
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>
            <div className="flex gap-2">
                <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Tous les rôles</option>
                    <option>Closer</option>
                    <option>SDR</option>
                </select>
            </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-slate-400">Membre</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-slate-400">Statut</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-slate-400 text-center">Ventes (Mois)</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-slate-400">CA Généré</th>
                  <th className="px-6 py-4 text-[11px] uppercase tracking-wider font-bold text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                    // Skeleton loading simple
                    [1,2,3].map(i => (
                        <tr key={i} className="animate-pulse">
                            <td colSpan={5} className="px-6 py-6 bg-slate-50/20"></td>
                        </tr>
                    ))
                ) : (
                    team.map((member) => (
                    <tr key={member.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                            {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                            <p className="font-bold text-slate-900 text-sm leading-none mb-1">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.role}</p>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            member.status === 'En ligne' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : member.status === 'En rendez-vous' 
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                member.status === 'En ligne' ? 'bg-emerald-500' : member.status === 'En rendez-vous' ? 'bg-amber-500' : 'bg-slate-400'
                            }`}></span>
                            {member.status}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">{member.sales}</td>
                        <td className="px-6 py-4">
                            <span className="text-sm font-bold text-slate-900">{member.revenue}</span>
                        </td>
                        <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                            <button title="Envoyer un mail" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Mail size={18} /></button>
                            <button title="Appeler" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><Phone size={18} /></button>
                            <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><MoreVertical size={18} /></button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
             <p className="text-xs text-slate-500">Affichage de {team.length} membres actifs</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}