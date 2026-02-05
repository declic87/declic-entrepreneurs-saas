'use client';

import React, { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from "@/components/ui/card";
import { 
  Target, 
  Calendar, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  PhoneCall 
} from "lucide-react";

export default function CommercialDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myLeads: 0,
    myAppointments: 0,
    myCloses: 0,
    conversionRate: 0,
    recentLeads: [] as any[],
    pendingTasks: [] as any[]
  });

  useEffect(() => {
    async function loadCommercialData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const userId = session.user.id;

        // On récupère uniquement les leads assignés à ce commercial
        const { data: leads, error } = await supabase
          .from('leads')
          .select('*')
          .eq('closerId', userId) // Filtre par le commercial connecté
          .order('created_at', { ascending: false });

        if (error) throw error;

        const myLeads = leads || [];
        const closes = myLeads.filter(l => l.status === 'CLOSE').length;
        const appts = myLeads.filter(l => l.status === 'RDV_EFFECTUE' || l.status === 'RDV_PLANIFIE').length;
        
        setStats({
          myLeads: myLeads.length,
          myAppointments: appts,
          myCloses: closes,
          conversionRate: myLeads.length > 0 ? Math.round((closes / myLeads.length) * 100) : 0,
          recentLeads: myLeads.slice(0, 5),
          pendingTasks: myLeads.filter(l => l.status === 'NOUVEAU').slice(0, 5)
        });

      } catch (e) {
        console.error("Erreur chargement commercial:", e);
      } finally {
        setLoading(false);
      }
    }

    loadCommercialData();
  }, [supabase]);

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#1A252F] text-white">Chargement...</div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen text-slate-900">
      <div>
        <h1 className="text-2xl font-bold">Espace Commercial</h1>
        <p className="text-sm text-slate-500">Gère tes leads et tes performances en temps réel.</p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Mes Leads", value: stats.myLeads, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Rendez-vous", value: stats.myAppointments, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Ventes (Closes)", value: stats.myCloses, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Mon Taux Conv.", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${item.bg}`}>
                <item.icon size={20} className={item.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-slate-400" /> Mes derniers leads
            </h3>
            <div className="space-y-4">
              {stats.recentLeads.map((lead, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
                    <p className="text-xs text-slate-400">{lead.email}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 font-bold uppercase">
                    {lead.status}
                  </span>
                </div>
              ))}
              {stats.recentLeads.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Aucun lead assigné.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Action Needed */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-600">
              <PhoneCall size={18} /> À recontacter d'urgence
            </h3>
            <div className="space-y-4">
              {stats.pendingTasks.map((lead, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="flex-1 text-sm">
                    <p className="font-bold">{lead.firstName} {lead.lastName}</p>
                    <p className="text-xs opacity-75">{lead.phone || 'Pas de numéro'}</p>
                  </div>
                  <button className="bg-white text-orange-600 px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-orange-100 transition-colors">
                    Appeler
                  </button>
                </div>
              ))}
              {stats.pendingTasks.length === 0 && <p className="text-center text-slate-400 text-sm py-4">Tout est à jour ! 🎉</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}