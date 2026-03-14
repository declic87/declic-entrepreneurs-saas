// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Download, Search, Calendar, TrendingUp, MapPin, Trash2 } from 'lucide-react';
import { downloadSimulationPDF } from '@/lib/simulation-pdf-generator';

interface Simulation {
  id: string;
  closer_id: string;
  client_name: string;
  client_email: string;
  ca_annuel: number;
  charges_reelles: number;
  frais_comptable: number;
  statut_actuel: string;
  code_postal: string;
  besoin_mensuel: number;
  situation_actuelle: any;
  situation_optimisee: any;
  gain_annuel: number;
  recommandations: string[];
  is_zfrr: boolean;
  is_afr: boolean;
  created_at: string;
  closer_first_name?: string;
  closer_last_name?: string;
}

export default function AdminSimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [filteredSimulations, setFilteredSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadSimulations();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSimulations(simulations);
    } else {
      const filtered = simulations.filter(sim =>
        sim.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sim.client_email && sim.client_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sim.code_postal && sim.code_postal.includes(searchTerm)) ||
        `${sim.closer_first_name || ''} ${sim.closer_last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSimulations(filtered);
    }
  }, [searchTerm, simulations]);

  async function loadSimulations() {
    try {
      const { data: simulationsData, error: simError } = await supabase
        .from('closer_simulations')
        .select('*')
        .order('created_at', { ascending: false });

      if (simError) throw simError;

      if (simulationsData && simulationsData.length > 0) {
        const closerIds = [...new Set(simulationsData.map(s => s.closer_id))];
        
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', closerIds);

        const enrichedSimulations = simulationsData.map(sim => {
          const user = usersData?.find(u => u.id === sim.closer_id);
          return {
            ...sim,
            closer_first_name: user?.first_name || 'Inconnu',
            closer_last_name: user?.last_name || '',
          };
        });

        setSimulations(enrichedSimulations);
        setFilteredSimulations(enrichedSimulations);
      } else {
        setSimulations([]);
        setFilteredSimulations([]);
      }
    } catch (error) {
      console.error('Erreur chargement simulations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const { error } = await supabase
        .from('closer_simulations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Retirer de la liste
      setSimulations(prev => prev.filter(s => s.id !== id));
      setFilteredSimulations(prev => prev.filter(s => s.id !== id));
      setDeleteConfirm(null);

      alert('Simulation supprimée avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function handleDownloadPDF(sim: Simulation) {
    downloadSimulationPDF({
      clientName: sim.client_name,
      clientEmail: sim.client_email || '',
      results: {
        situationActuelle: sim.situation_actuelle,
        situationOptimisee: sim.situation_optimisee,
        gain: sim.gain_annuel,
        recommandations: sim.recommandations,
        isZFRR: sim.is_zfrr,
        isAFR: sim.is_afr,
        isQPV: false,
        isBER: false,
      },
      closerName: `${sim.closer_first_name} ${sim.closer_last_name}`,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement des simulations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📊 Simulations Closers</h1>
        <p className="text-slate-600 mt-2">
          {simulations.length} simulation{simulations.length > 1 ? 's' : ''} enregistrée{simulations.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Simulations</p>
                <p className="text-2xl font-bold text-slate-900">{simulations.length}</p>
              </div>
              <Calendar className="text-orange-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gain Total Estimé</p>
                <p className="text-2xl font-bold text-green-600">
                  {simulations.reduce((acc, sim) => acc + (sim.gain_annuel || 0), 0).toLocaleString('fr-FR')} €
                </p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Zones ZFRR</p>
                <p className="text-2xl font-bold text-blue-600">
                  {simulations.filter(s => s.is_zfrr).length}
                </p>
              </div>
              <MapPin className="text-blue-600" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Zones AFR</p>
                <p className="text-2xl font-bold text-purple-600">
                  {simulations.filter(s => s.is_afr).length}
                </p>
              </div>
              <MapPin className="text-purple-600" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECHERCHE */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              type="text"
              placeholder="Rechercher par client, email, CP ou closer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* TABLEAU */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des simulations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Client</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Email</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Closer</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">CA Annuel</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Statut</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">CP</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Zones</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Gain Annuel</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSimulations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-500">
                      Aucune simulation trouvée
                    </td>
                  </tr>
                ) : (
                  filteredSimulations.map((sim) => (
                    <tr key={sim.id} className="border-b hover:bg-slate-50">
                      <td className="p-4 text-sm">
                        {new Date(sim.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="p-4 font-semibold">{sim.client_name}</td>
                      <td className="p-4 text-sm text-slate-600">{sim.client_email || '-'}</td>
                      <td className="p-4 text-sm">
                        {sim.closer_first_name} {sim.closer_last_name}
                      </td>
                      <td className="p-4 font-semibold">
                        {(sim.ca_annuel || 0).toLocaleString('fr-FR')} €
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{sim.statut_actuel}</Badge>
                      </td>
                      <td className="p-4">{sim.code_postal || '-'}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {sim.is_zfrr && (
                            <Badge className="bg-green-100 text-green-800 text-xs">ZFRR</Badge>
                          )}
                          {sim.is_afr && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">AFR</Badge>
                          )}
                          {!sim.is_zfrr && !sim.is_afr && (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-bold text-green-600">
                        +{(sim.gain_annuel || 0).toLocaleString('fr-FR')} €
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedSimulation(sim)}
                          >
                            <Eye size={14} className="mr-1" />
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadPDF(sim)}
                          >
                            <Download size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(sim.id)}
                            className={deleteConfirm === sim.id ? 'border-red-500 bg-red-50 text-red-600' : 'hover:border-red-500 hover:text-red-600'}
                          >
                            <Trash2 size={14} />
                            {deleteConfirm === sim.id && <span className="ml-1 text-xs">Confirmer?</span>}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL DÉTAILS */}
      {selectedSimulation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Détails de la simulation</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSimulation(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Client</p>
                  <p className="font-semibold">{selectedSimulation.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Email</p>
                  <p className="font-semibold">{selectedSimulation.client_email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Closer</p>
                  <p className="font-semibold">
                    {selectedSimulation.closer_first_name} {selectedSimulation.closer_last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Code Postal</p>
                  <p className="font-semibold">{selectedSimulation.code_postal || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Situation financière</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">CA:</span>
                    <span className="font-semibold ml-2">
                      {(selectedSimulation.ca_annuel || 0).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">Charges:</span>
                    <span className="font-semibold ml-2">
                      {(selectedSimulation.charges_reelles || 0).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">Comptable:</span>
                    <span className="font-semibold ml-2">
                      {(selectedSimulation.frais_comptable || 0).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <span className="text-slate-600">Gain:</span>
                    <span className="font-bold text-green-600 ml-2">
                      +{(selectedSimulation.gain_annuel || 0).toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Recommandations</h4>
                <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                  {(selectedSimulation.recommandations || []).map((reco, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                      <span className="text-blue-600 font-bold">{idx + 1}.</span>
                      <span className="text-blue-900">{reco}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownloadPDF(selectedSimulation)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <Download className="mr-2" size={16} />
                  Télécharger le PDF
                </Button>
                <Button
                  onClick={() => {
                    handleDelete(selectedSimulation.id);
                    setSelectedSimulation(null);
                  }}
                  variant="outline"
                  className="border-red-500 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-2" size={16} />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}