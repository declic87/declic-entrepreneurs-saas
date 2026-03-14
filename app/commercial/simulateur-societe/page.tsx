'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, Download } from 'lucide-react';

export default function SimulateurSocietePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Inputs
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [ca, setCa] = useState('');
  const [charges, setCharges] = useState('');
  const [fraisComptable, setFraisComptable] = useState('');
  const [statutActuel, setStatutActuel] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [besoinMensuel, setBesoinMensuel] = useState('');
  
  // Résultats
  const [results, setResults] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();
      if (userData) setUserId(userData.id);
    }
  }

  async function calculate() {
    setLoading(true);
    
    try {
      const caNum = parseFloat(ca);
      const chargesNum = parseFloat(charges);
      const fraisComptableNum = parseFloat(fraisComptable);
      const besoinMensuelNum = parseFloat(besoinMensuel);

      // 1. Situation actuelle (estimation)
      const remunerationBrute = caNum - chargesNum;
      const chargesSociales = remunerationBrute * 0.45; // Approximation
      const impots = (remunerationBrute - chargesSociales) * 0.20; // Approximation
      const netActuel = remunerationBrute - chargesSociales - impots;

      // 2. Situation optimisée Déclic
      const ikOptimal = 12000;
      const mdaOptimal = 8000;
      const fraisOptimises = ikOptimal + mdaOptimal + chargesNum;
      const baseImposable = caNum - fraisOptimises;
      
      const chargesSocialesOptimisees = baseImposable * 0.25; // Optimisé
      const impotsOptimises = (baseImposable - chargesSocialesOptimisees) * 0.15; // Optimisé
      const netOptimise = baseImposable - chargesSocialesOptimisees - impotsOptimises + ikOptimal + mdaOptimal;

      const gain = netOptimise - netActuel;

      // 3. Recommandations
      const recommandations: string[] = [];
      
      if (fraisComptableNum > 3000) {
        recommandations.push(`💰 Votre comptable coûte ${fraisComptableNum}€/an. Nous recommandons un partenaire à partir de 1200€/an (économie: ${fraisComptableNum - 1200}€)`);
      }
      
      recommandations.push(`🚗 Optimisez vos IK à 12 000€/an (remboursement cash non imposé)`);
      recommandations.push(`🏠 Mise à disposition habitation: 8 000€/an (remboursement cash non imposé)`);
      
      if (statutActuel === 'EI' || statutActuel === 'EURL') {
        recommandations.push(`🏢 Passage en SASU à l'IR recommandé pour optimiser les charges sociales`);
      }

      // Détection zones fiscales (à affiner avec vraie API)
      const departement = codePostal.substring(0, 2);
      let isZFRR = false;
      let isAFR = false;
      
      if (['09', '11', '15', '19', '23', '48', '63', '87'].includes(departement)) {
        isZFRR = true;
        recommandations.push(`📍 Vous êtes en ZFRR ! Exonération fiscale possible jusqu'à 50% pendant 5 ans`);
      }

      const resultData = {
        situationActuelle: {
          ca: caNum,
          charges: chargesNum,
          remunerationBrute,
          chargesSociales,
          impots,
          netCash: netActuel,
        },
        situationOptimisee: {
          ca: caNum,
          charges: fraisOptimises,
          ik: ikOptimal,
          mda: mdaOptimal,
          chargesSociales: chargesSocialesOptimisees,
          impots: impotsOptimises,
          netCash: netOptimise,
        },
        gain,
        recommandations,
        isZFRR,
        isAFR,
      };

      setResults(resultData);

      // Sauvegarder en base
      await supabase.from('closer_simulations').insert({
        closer_id: userId,
        client_name: clientName,
        client_email: clientEmail,
        ca_annuel: caNum,
        charges_reelles: chargesNum,
        frais_comptable: fraisComptableNum,
        statut_actuel: statutActuel,
        code_postal: codePostal,
        besoin_mensuel: besoinMensuelNum,
        situation_actuelle: resultData.situationActuelle,
        situation_optimisee: resultData.situationOptimisee,
        gain_annuel: gain,
        recommandations,
        is_zfrr: isZFRR,
        is_afr: isAFR,
      });

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de calcul');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          🧮 Simulateur Société
        </h1>
        <p className="text-slate-600 mt-2">
          Outil d'analyse comptable et fiscale pour vos prospects
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom du client</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
            </div>

            <div>
              <Label>CA annuel (€)</Label>
              <Input type="number" value={ca} onChange={(e) => setCa(e.target.value)} placeholder="80000" />
            </div>

            <div>
              <Label>Charges réelles annuelles (€)</Label>
              <Input type="number" value={charges} onChange={(e) => setCharges(e.target.value)} placeholder="15000" />
            </div>

            <div>
              <Label>Frais comptable annuel (€)</Label>
              <Input type="number" value={fraisComptable} onChange={(e) => setFraisComptable(e.target.value)} placeholder="2400" />
            </div>

            <div>
              <Label>Statut actuel</Label>
              <Select value={statutActuel} onValueChange={setStatutActuel}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EI">EI (Auto-entrepreneur)</SelectItem>
                  <SelectItem value="EURL">EURL</SelectItem>
                  <SelectItem value="SASU_IR">SASU à l'IR</SelectItem>
                  <SelectItem value="SASU_IS">SASU à l'IS</SelectItem>
                  <SelectItem value="SARL">SARL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Code postal</Label>
              <Input value={codePostal} onChange={(e) => setCodePostal(e.target.value)} placeholder="63000" />
            </div>

            <div>
              <Label>Besoin mensuel (€)</Label>
              <Input type="number" value={besoinMensuel} onChange={(e) => setBesoinMensuel(e.target.value)} placeholder="3500" />
            </div>

            <Button onClick={calculate} disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700">
              {loading ? 'Calcul...' : (
                <>
                  <Calculator className="mr-2" size={16} />
                  Calculer l'optimisation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Résultats */}
        {results && (
          <div className="space-y-6">
            {/* Comparatif */}
            <Card className="border-2 border-green-500">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="text-green-600" />
                  Résultat de l'optimisation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="font-semibold">Situation actuelle</span>
                    <span className="text-2xl font-bold text-slate-900">
                      {results.situationActuelle.netCash.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}€
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded border-2 border-green-500">
                    <span className="font-semibold text-green-900">Avec Méthode Déclic</span>
                    <span className="text-2xl font-bold text-green-600">
                      {results.situationOptimisee.netCash.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}€
                    </span>
                  </div>

                  <div className="text-center p-4 bg-amber-50 rounded-lg border-2 border-amber-500">
                    <p className="text-sm text-amber-900 mb-1">GAIN ANNUEL</p>
                    <p className="text-3xl font-black text-amber-600">
                      +{results.gain.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommandations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="text-blue-600" />
                  Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {results.recommandations.map((reco: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                      <CheckCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-sm text-blue-900">{reco}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Button className="w-full bg-slate-900 hover:bg-slate-800">
              <Download className="mr-2" size={16} />
              Télécharger le rapport PDF
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}