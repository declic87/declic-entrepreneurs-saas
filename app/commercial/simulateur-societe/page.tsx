'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, TrendingUp, CheckCircle, Download, Loader2 } from 'lucide-react';
import { downloadSimulationPDF } from '@/lib/simulation-pdf-generator';

export default function SimulateurSocietePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
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
        .select('id, first_name, last_name')
        .eq('auth_id', user.id)
        .single();
      
      if (userData) {
        setUserId(userData.id);
        setUserName(`${userData.first_name} ${userData.last_name}`);
      }
    }
  }

  async function detectZones() {
    if (!codePostal || codePostal.length < 5) return { isZFRR: false, isAFR: false, isQPV: false, isBER: false };

    try {
      const response = await fetch('/api/zones-fiscales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codePostal }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isZFRR: data.isZFRR || false,
          isAFR: data.isAFR || false,
          isQPV: data.isQPV || false,
          isBER: data.isBER || false,
        };
      }
    } catch (error) {
      console.error('Erreur détection zones:', error);
    }

    return { isZFRR: false, isAFR: false, isQPV: false, isBER: false };
  }

  async function calculate() {
    if (!clientName || !ca || !charges) {
      alert('Veuillez remplir au minimum le nom du client, le CA et les charges');
      return;
    }

    setLoading(true);
    
    try {
      const caNum = parseFloat(ca);
      const chargesNum = parseFloat(charges);
      const fraisComptableNum = parseFloat(fraisComptable) || 0;
      const besoinMensuelNum = parseFloat(besoinMensuel) || 0;

      // 1. Situation actuelle (estimation)
      let remunerationBrute = caNum - chargesNum;
      let chargesSociales = 0;
      let impots = 0;

      switch (statutActuel) {
        case 'EI':
          chargesSociales = caNum * 0.22;
          const revenuImposable = caNum * 0.66;
          impots = revenuImposable * 0.15;
          remunerationBrute = caNum - chargesSociales;
          break;
        
        case 'EURL':
          chargesSociales = remunerationBrute * 0.45;
          impots = (remunerationBrute - chargesSociales) * 0.20;
          break;
        
        case 'SASU_IS':
          const is = (caNum - chargesNum) * 0.15;
          const dividendes = (caNum - chargesNum - is) * 0.5;
          const salaire = (caNum - chargesNum - is) * 0.5;
          chargesSociales = salaire * 0.82;
          const flatTax = dividendes * 0.30;
          impots = is + flatTax;
          remunerationBrute = salaire;
          break;
        
        case 'SASU_IR':
          chargesSociales = remunerationBrute * 0.82;
          impots = (remunerationBrute - chargesSociales) * 0.15;
          break;
        
        default:
          chargesSociales = remunerationBrute * 0.45;
          impots = (remunerationBrute - chargesSociales) * 0.20;
      }

      const netActuel = remunerationBrute - chargesSociales - impots;

      // 2. Situation optimisée Déclic
      const ikOptimal = 12000;
      const mdaOptimal = 8000;
      const fraisOptimises = ikOptimal + mdaOptimal + chargesNum;
      const baseImposable = caNum - fraisOptimises;
      
      const chargesSocialesOptimisees = baseImposable * 0.25;
      const impotsOptimises = (baseImposable - chargesSocialesOptimisees) * 0.12;
      const netOptimise = baseImposable - chargesSocialesOptimisees - impotsOptimises + ikOptimal + mdaOptimal;

      const gain = netOptimise - netActuel;

      // 3. Recommandations
      const recommandations: string[] = [];
      
      recommandations.push(`🚗 Indemnités Kilométriques: 12 000€/an de remboursement cash non imposé (barème fiscal 7CV)`);
      recommandations.push(`🏠 Mise à disposition habitation: 8 000€/an de remboursement cash non imposé (bureau domicile)`);
      
      if (fraisComptableNum > 3000) {
        recommandations.push(`💰 Votre comptable coûte ${fraisComptableNum.toLocaleString('fr-FR')}€/an. Notre partenaire: 1200€/an (économie: ${(fraisComptableNum - 1200).toLocaleString('fr-FR')}€)`);
      }
      
      if (statutActuel === 'EI' || statutActuel === 'EURL') {
        recommandations.push(`🏢 Passage en SASU à l'IR recommandé pour optimiser les charges sociales (-${((chargesSociales - chargesSocialesOptimisees)).toLocaleString('fr-FR')}€/an)`);
      }

      if (statutActuel === 'SASU_IS' && caNum < 150000) {
        recommandations.push(`📊 SASU à l'IR plus avantageuse pour votre CA (économie: ${(impots - impotsOptimises).toLocaleString('fr-FR')}€/an)`);
      }

      if (chargesNum < caNum * 0.15) {
        recommandations.push(`📝 Vos charges semblent faibles (${((chargesNum / caNum) * 100).toFixed(0)}%). Pensez à déduire: repas, formations, téléphone, internet, équipement, assurances...`);
      }

      // 4. Détection zones fiscales
      const zones = await detectZones();

      if (zones.isZFRR) {
        recommandations.push(`📍 Vous êtes en ZFRR ! Exonération fiscale possible jusqu'à 50% pendant 5 ans`);
      }
      if (zones.isAFR) {
        recommandations.push(`📍 Vous êtes éligible AFR : subventions pour investissements disponibles`);
      }
      if (zones.isQPV) {
        recommandations.push(`📍 Quartier Prioritaire : exonérations fiscales et sociales possibles`);
      }
      if (zones.isBER) {
        recommandations.push(`📍 Bassin d'Emploi à Redynamiser : aides à l'implantation disponibles`);
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
        isZFRR: zones.isZFRR,
        isAFR: zones.isAFR,
        isQPV: zones.isQPV,
        isBER: zones.isBER,
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
        is_zfrr: zones.isZFRR,
        is_afr: zones.isAFR,
      });

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de calcul');
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadPDF() {
    if (!results) return;

    downloadSimulationPDF({
      clientName,
      clientEmail,
      results,
      closerName: userName,
    });
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
              <Label>Nom du client *</Label>
              <Input 
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            
            <div>
              <Label>Email</Label>
              <Input 
                type="email" 
                value={clientEmail} 
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="jean.dupont@exemple.fr"
              />
            </div>

            <div>
              <Label>CA annuel (€) *</Label>
              <Input 
                type="number" 
                value={ca} 
                onChange={(e) => setCa(e.target.value)} 
                placeholder="80000" 
              />
            </div>

            <div>
              <Label>Charges réelles annuelles (€) *</Label>
              <Input 
                type="number" 
                value={charges} 
                onChange={(e) => setCharges(e.target.value)} 
                placeholder="15000" 
              />
              <p className="text-xs text-slate-500 mt-1">
                Loyers, matériel, sous-traitance, déplacements...
              </p>
            </div>

            <div>
              <Label>Frais comptable annuel (€)</Label>
              <Input 
                type="number" 
                value={fraisComptable} 
                onChange={(e) => setFraisComptable(e.target.value)} 
                placeholder="2400" 
              />
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
              <Input 
                value={codePostal} 
                onChange={(e) => setCodePostal(e.target.value)} 
                placeholder="63000"
                maxLength={5}
              />
              <p className="text-xs text-slate-500 mt-1">
                Pour détecter les zones fiscales avantageuses
              </p>
            </div>

            <div>
              <Label>Besoin mensuel (€)</Label>
              <Input 
                type="number" 
                value={besoinMensuel} 
                onChange={(e) => setBesoinMensuel(e.target.value)} 
                placeholder="3500" 
              />
            </div>

            <Button 
              onClick={calculate} 
              disabled={loading || !clientName || !ca || !charges} 
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={16} />
                  Calcul en cours...
                </>
              ) : (
                <>
                  <Calculator className="mr-2" size={16} />
                  Calculer l'optimisation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Résultats */}
        {results ? (
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
                      {results.situationActuelle.netCash.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded border-2 border-green-500">
                    <span className="font-semibold text-green-900">Avec Méthode Déclic</span>
                    <span className="text-2xl font-bold text-green-600">
                      {results.situationOptimisee.netCash.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
                    </span>
                  </div>

                  <div className="text-center p-4 bg-amber-50 rounded-lg border-2 border-amber-500">
                    <p className="text-sm text-amber-900 mb-1">GAIN ANNUEL</p>
                    <p className="text-3xl font-black text-amber-600">
                      +{results.gain.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €
                    </p>
                    <p className="text-xs text-amber-700 mt-2">
                      soit +{(results.gain / 12).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €/mois
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

            <Button 
              onClick={handleDownloadPDF}
              className="w-full bg-slate-900 hover:bg-slate-800"
            >
              <Download className="mr-2" size={16} />
              Télécharger le rapport PDF
            </Button>
          </div>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <CardContent className="text-center p-12">
              <Calculator className="mx-auto text-slate-300 mb-4" size={64} />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Prêt à optimiser ?
              </h3>
              <p className="text-slate-600">
                Remplissez le formulaire et lancez le calcul pour voir les résultats
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}