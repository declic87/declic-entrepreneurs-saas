'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Target, TrendingUp, LayoutGrid, List } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  status: string;
  temperature: string;
  ca: number;
  closer: string;
}

const PIPELINE_STAGES = [
  { name: 'NOUVEAU', color: 'bg-blue-500' },
  { name: 'CONTACTE', color: 'bg-cyan-500' },
  { name: 'QUALIFIE', color: 'bg-indigo-500' },
  { name: 'RDV_PLANIFIE', color: 'bg-amber-500' },
  { name: 'RDV_EFFECTUE', color: 'bg-orange-500' },
  { name: 'PROPOSITION', color: 'bg-purple-500' },
  { name: 'NEGOCIE', color: 'bg-pink-500' },
  { name: 'CLOSE', color: 'bg-emerald-500' },
  { name: 'PERDU', color: 'bg-red-500' },
];

export default function HOSPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    // TODO: Charger depuis table leads
    // Pour l'instant données de démo
    setLeads([
      { id: '1', name: 'Jean Dupont', status: 'NOUVEAU', temperature: 'HOT', ca: 3600, closer: 'Sophie' },
      { id: '2', name: 'Marie Martin', status: 'QUALIFIE', temperature: 'WARM', ca: 4600, closer: 'Thomas' },
      { id: '3', name: 'Pierre Durand', status: 'RDV_PLANIFIE', temperature: 'HOT', ca: 6600, closer: 'Sophie' },
      { id: '4', name: 'Lucie Petit', status: 'PROPOSITION', temperature: 'WARM', ca: 4600, closer: 'Thomas' },
      { id: '5', name: 'Marc Bernard', status: 'CLOSE', temperature: 'COLD', ca: 3600, closer: 'Sophie' },
    ]);
    setLoading(false);
  }

  const pipelineCounts = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    count: leads.filter((l) => l.status === stage.name).length,
    totalCA: leads.filter((l) => l.status === stage.name).reduce((sum, l) => sum + l.ca, 0),
  }));

  const totalCA = leads.reduce((sum, l) => sum + l.ca, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Pipeline Global</h1>
            <p className="text-gray-600 mt-2">{leads.length} leads • CA estimé: {totalCA.toLocaleString()}€</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setView('kanban')}
              className={`p-2 rounded-lg transition-all ${
                view === 'kanban' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setView('table')}
              className={`p-2 rounded-lg transition-all ${
                view === 'table' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Overview Bar */}
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
          {pipelineCounts.map((stage) => (
            <div key={stage.name} className="bg-white p-3 rounded-lg border border-gray-100 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase truncate mb-1">
                {stage.name.replace('_', ' ')}
              </p>
              <p className="text-lg font-bold text-gray-900">{stage.count}</p>
              <p className="text-[10px] text-gray-500">{stage.totalCA.toLocaleString()}€</p>
            </div>
          ))}
        </div>

        {/* Vue Kanban */}
        {view === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-6">
            {PIPELINE_STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.status === stage.name);

              return (
                <div key={stage.name} className="min-w-[280px] w-[280px] flex-shrink-0">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className={`${stage.color} text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded`}>
                      {stage.name.replace('_', ' ')}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{stageLeads.length}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 space-y-3 min-h-[400px]">
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-900 text-sm">{lead.name}</p>
                          {lead.temperature === 'HOT' && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                              🔥
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mb-3">Closer: {lead.closer}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-green-600">{lead.ca.toLocaleString()}€</p>
                          <TrendingUp size={16} className="text-gray-300" />
                        </div>
                      </div>
                    ))}

                    {stageLeads.length === 0 && (
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Closer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">CA Est.</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Temp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {lead.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{lead.closer}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {lead.status.replace('_', ' ')}
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
    </div>
  );
}