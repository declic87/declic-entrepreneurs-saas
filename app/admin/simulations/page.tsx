'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Download, Search, Calendar, TrendingUp, MapPin } from 'lucide-react';
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
  users: {
    first_name: string;
    last_name: string;
  };
}

export default function AdminSimulationsPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [filteredSimulations, setFilteredSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);

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
        sim.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sim.code_postal.includes(searchTerm) ||
        `${sim.users.first_name} ${sim.users.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSimulations(filtered);
    }
  }, [searchTerm, simulations]);

  async function loadSimulations() {
    try {
      const { data, error } = await supabase
        .from('closer_simulations')
        .select(`
          *,
          users!closer_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSimulations(data || []);
      setFilteredSimulations(data || []);
    } catch (error) {
      console.error('Erreur chargement simulations:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPDF(sim: Simulation) {
    downloadSimulationPDF({
      clientName: sim.client_name,
      clientEmail: sim.client_email,
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
      closerName: `${sim.users.first_name} ${sim.users.last_name}`,
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
                  {simulations.reduce((acc, sim) => acc + sim.gain_annuel, 0).toLocaleString('fr-FR')} €
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Closer</TableHead>
                  <TableHead>CA Annuel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>CP</TableHead>
                  <TableHead>Zones</TableHead>
                  <TableHead>Gain Annuel</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSimulations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                      Aucune simulation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSimulations.map((sim) => (
                    <TableRow key={sim.id}>
                      <TableCell className="text-sm">
                        {new Date(sim.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="font-semibold">{sim.client_name}</TableCell>
                      <TableCell className="text-sm text-slate-600">{sim.client_email}</TableCell>
                      <TableCell className="text-sm">
                        {sim.users.first_name} {sim.users.last_name}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {sim.ca_annuel.toLocaleString('fr-FR')} €
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sim.statut_actuel}</Badge>
                      </TableCell>
                      <TableCell>{sim.code_postal}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {sim.is_zfrr && (
                            <Badge className="bg-green-100 text-green-800 text-xs">ZFRR</Badge>
                          )}
                          {sim.is_afr && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">AFR</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        +{sim.gain_annuel.toLocaleString('fr-FR')} €
                      </TableCell>
                      <TableCell>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                  <p className="font-semibold">{selectedSimulation.client_email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Closer</p>
                  <p className="font-semibold">
                    {selectedSimulation.users.first_name} {selectedSimulation.users.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Code Postal</p>
                  <p className="font-semibold">{selectedSimulation.code_postal}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Situation financière</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">CA:</span>
                    <span className="font-semibold ml-2">
                      {selectedSimulation.ca_annuel.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">Charges:</span>
                    <span className="font-semibold ml-2">
                      {selectedSimulation.charges_reelles.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <span className="text-slate-600">Comptable:</span>
                    <span className="font-semibold ml-2">
                      {selectedSimulation.frais_comptable.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <span className="text-slate-600">Gain:</span>
                    <span className="font-bold text-green-600 ml-2">
                      +{selectedSimulation.gain_annuel.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-bold mb-2">Recommandations</h4>
                <ul className="space-y-2 text-sm">
                  {selectedSimulation.recommandations.map((reco, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                      <span className="text-blue-600 font-bold">{idx + 1}.</span>
                      <span className="text-blue-900">{reco}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                onClick={() => handleDownloadPDF(selectedSimulation)}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Download className="mr-2" size={16} />
                Télécharger le PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}