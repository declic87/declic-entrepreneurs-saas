'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Target, 
  TrendingUp, 
  Users,
  DollarSign,
  LayoutGrid,
  List,
  ChevronRight
} from 'lucide-react';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  ca: number;
  temperature: string;
  created_at: string;
}

const PIPELINE_STEPS = [
  'NOUVEAU',
  'CONTACTE',
  'QUALIFIE',
  'RDV_PLANIFIE',
  'RDV_EFFECTUE',
  'PROPOSITION',
  'NEGOCIE',
  'CLOSE',
  'PERDU'
];

const STATUS_COLORS: Record<string, string> = {
  NOUVEAU: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTE: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  QUALIFIE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  RDV_PLANIFIE: 'bg-amber-100 text-amber-700 border-amber-200',
  RDV_EFFECTUE: 'bg-orange-100 text-orange-700 border-orange-200',
  PROPOSITION: 'bg-purple-100 text-purple-700 border-purple-200',
  NEGOCIE: 'bg-pink-100 text-pink-700 border-pink-200',
  CLOSE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  PERDU: 'bg-red-100 text-red-700 border-red-200',
};

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');

  useEffect(() => {
    // TODO: Charger depuis la vraie table leads quand elle sera créée
    // Pour l'instant, données de démo
    setLeads([
      { id: '1', first_name: 'Jean', last_name: 'Dupont', email: 'jean@test.fr', status: 'NOUVEAU', ca: 3600, temperature: 'HOT', created_at: new Date().toISOString() },
      { id: '2', first_name: 'Marie', last_name: 'Martin', email: 'marie@test.fr', status: 'QUALIFIE', ca: 4600, temperature: 'WARM', created_at: new Date().toISOString() },
      { id: '3', first_name: 'Pierre', last_name: 'Durand', email: 'pierre@test.fr', status: 'RDV_PLANIFIE', ca: 6600, temperature: 'HOT', created_at: new Date().toISOString() },
      { id: '4', first_name: 'Sophie', last_name: 'Bernard', email: 'sophie@test.fr', status: 'CLOSE', ca: 4600, temperature: 'COLD', created_at: new Date().toISOString() },
    ]);
    setLoading(false);
  }, []);

  const pipelineCounts = PIPELINE_STEPS.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
    totalCa: leads.filter((l) => l.status === status).reduce((sum, l) => sum + l.ca, 0),
  }));

  const totalCA = leads.reduce((sum, l) => sum + l.ca, 0);
  const avgCA = leads.length > 0 ? totalCA / leads.length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline Global</h1>
          <p className="text-gray-600 mt-2">{leads.length} leads actifs dans l'entonnoir</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setView('kanban')}
            className={`p-2 rounded-lg transition-all ${
              view === 'kanban' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded-lg transition-all ${
              view === 'table' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Leads Totaux</p>
              <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">CA Total</p>
              <p className="text-2xl font-bold text-gray-900">{totalCA.toLocaleString()}€</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign size={24} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">CA Moyen</p>
              <p className="text-2xl font-bold text-gray-900">{avgCA.toLocaleString()}€</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Bar */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
        {pipelineCounts.map((p) => (
          <div key={p.status} className="bg-white p-3 rounded-lg border border-gray-100 text-center">
            <p className="text-[9px] font-bold text-gray-400 uppercase truncate mb-1">
              {p.status.replace('_', ' ')}
            </p>
            <p className="text-lg font-bold text-gray-900">{p.count}</p>
            <p className="text-[10px] text-gray-500">{p.totalCa.toLocaleString()}€</p>
          </div>
        ))}
      </div>

      {/* Vue Kanban */}
      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {PIPELINE_STEPS.map((step) => {
            const stepLeads = leads.filter((l) => l.status === step);
            
            return (
              <div key={step} className="min-w-[280px] w-[280px] flex-shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${STATUS_COLORS[step]}`}>
                    {step.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">{stepLeads.length}</span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 space-y-3 min-h-[400px]">
                  {stepLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-gray-900 text-sm">
                          {lead.first_name} {lead.last_name}
                        </p>
                        {lead.temperature === 'HOT' && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                            🔥 HOT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-3">{lead.email}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-green-600">{lead.ca.toLocaleString()}€</p>
                        <ChevronRight size={16} className="text-gray-300" />
                      </div>
                    </div>
                  ))}
                  
                  {stepLeads.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">Aucun lead</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vue Table */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">CA Est.</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Temp.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">
                      {lead.first_name} {lead.last_name}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{lead.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900">{lead.ca.toLocaleString()}€</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      lead.temperature === 'HOT' ? 'bg-red-100 text-red-600' :
                      lead.temperature === 'WARM' ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {lead.temperature}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}