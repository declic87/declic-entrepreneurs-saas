'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, TrendingUp, CheckCircle, Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { downloadSimulationPDF } from '@/lib/simulation-pdf-generator';

interface Societe {
  id: string;
  nom: string;
  statut: string;
  ca: string;
  charges: string;
}

export default function SimulateurSocietePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Inputs client
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [fraisComptable, setFraisComptable] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [besoinMensuel, setBesoinMensuel] = useState('');
  
  // Sociétés (multi)
  const [societes, setSocietes] = useState<Societe[]>([
    { id: '1', nom: 'Société principale', statut: '', ca: '', charges: '' }
  ]);
  
  // Options avancées
  const [hasLMNP, setHasLMNP] = useState(false);
  const [lmnpCA, setLmnpCA] = useState('');
  const [lmnpCharges, setLmnpCharges] = useState('');
  
  const [hasSCI, setHasSCI] = useState(false);
  const [sciType, setSciType] = useState('IR');
  const [sciCA, setSciCA] = useState('');
  const [sciCharges, setSciCharges] = useState('');
  
  const [hasRegimeMereFille, setHasRegimeMereFille] = useState(false);
  
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

  function addSociete() {
    setSocietes([...societes, { 
      id: Date.now().toString(), 
      nom: `Société ${societes.length + 1}`, 
      statut: '', 
      ca: '', 
      charges: '' 
    }]);
  }

  function removeSociete(id: string) {
    if (societes.length > 1) {
      setSocietes(societes.filter(s => s.id !== id));
    }
  }

  function updateSociete(id: string, field: keyof Societe, value: string) {
    setSocietes(societes.map(s => s.id === id ? { ...s, [field]: value } : s));
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
    if (!clientName || societes.some(s => !s.ca || !s.charges)) {
      alert('Veuillez remplir le nom du client et les informations de toutes les sociétés');
      return;
    }

    setLoading(true);
    
    try {
      const fraisComptableNum = parseFloat(fraisComptable) || 0;
      const besoinMensuelNum = parseFloat(besoinMensuel) || 0;

      // ═══════════════════════════════════════════════
      // CALCUL PAR SOCIÉTÉ
      // ═══════════════════════════════════════════════
      
      let caTotal = 0;
      let chargesTotal = 0;
      let chargesSocialesActuelles = 0;
      let impotsActuels = 0;

      societes.forEach(soc => {
        const ca = parseFloat(soc.ca);
        const charges = parseFloat(soc.charges);
        caTotal += ca;
        chargesTotal += charges;

        const remunerationBrute = ca - charges;

        switch (soc.statut) {
          case 'EI':
            chargesSocialesActuelles += ca * 0.22;
            impotsActuels += (ca * 0.66) * 0.15;
            break;
          case 'EURL':
          case 'SARL':
            chargesSocialesActuelles += remunerationBrute * 0.45;
            impotsActuels += (remunerationBrute - (remunerationBrute * 0.45)) * 0.20;
            break;
          case 'SASU_IS':
          case 'SAS_IS':
            const is = (ca - charges) * 0.15;
            const dividendes = (ca - charges - is) * 0.5;
            const salaire = (ca - charges - is) * 0.5;
            chargesSocialesActuelles += salaire * 0.82;
            impotsActuels += is + (dividendes * 0.30);
            break;
          case 'SASU_IR':
          case 'SAS_IR':
            chargesSocialesActuelles += remunerationBrute * 0.82;
            impotsActuels += (remunerationBrute - (remunerationBrute * 0.82)) * 0.15;
            break;
          default:
            chargesSocialesActuelles += remunerationBrute * 0.45;
            impotsActuels += (remunerationBrute - (remunerationBrute * 0.45)) * 0.20;
        }
      });

      // ═══════════════════════════════════════════════
      // LMNP
      // ═══════════════════════════════════════════════
      
      if (hasLMNP && lmnpCA) {
        const lmnpCANum = parseFloat(lmnpCA);
        const lmnpChargesNum = parseFloat(lmnpCharges) || 0;
        caTotal += lmnpCANum;
        chargesTotal += lmnpChargesNum;
        
        // LMNP au micro : abattement 50%
        const lmnpImposable = lmnpCANum * 0.5;
        impotsActuels += lmnpImposable * 0.15;
      }

      // ═══════════════════════════════════════════════
      // SCI
      // ═══════════════════════════════════════════════
      
      if (hasSCI && sciCA) {
        const sciCANum = parseFloat(sciCA);
        const sciChargesNum = parseFloat(sciCharges) || 0;
        caTotal += sciCANum;
        chargesTotal += sciChargesNum;

        if (sciType === 'IS') {
          const sciIS = (sciCANum - sciChargesNum) * 0.15;
          impotsActuels += sciIS;
        } else {
          // SCI à l'IR
          const sciImposable = sciCANum - sciChargesNum;
          impotsActuels += sciImposable * 0.20;
        }
      }

      const netActuel = caTotal - chargesTotal - chargesSocialesActuelles - impotsActuels;

      // ═══════════════════════════════════════════════
      // SITUATION OPTIMISÉE
      // ═══════════════════════════════════════════════
      
      const ikOptimal = 12000;
      const mdaOptimal = 8000;
      const fraisOptimises = chargesTotal + ikOptimal + mdaOptimal;
      const baseImposable = caTotal - fraisOptimises;
      
      const chargesSocialesOptimisees = baseImposable * 0.25;
      const impotsOptimises = (baseImposable - chargesSocialesOptimisees) * 0.12;
      const netOptimise = baseImposable - chargesSocialesOptimisees - impotsOptimises + ikOptimal + mdaOptimal;

      const gain = netOptimise - netActuel;

      // ═══════════════════════════════════════════════
      // RECOMMANDATIONS
      // ═══════════════════════════════════════════════
      
      const recommandations: string[] = [];
      
      recommandations.push(`🚗 Indemnités Kilométriques: 12 000€/an de remboursement cash non imposé (barème fiscal 7CV)`);
      recommandations.push(`🏠 Mise à disposition habitation: 8 000€/an de remboursement cash non imposé (bureau domicile)`);
      
      if (fraisComptableNum > 3000) {
        recommandations.push(`💰 Comptable actuel: ${fraisComptableNum.toLocaleString('fr-FR')}€/an. Notre partenaire: 1200€/an (économie: ${(fraisComptableNum - 1200).toLocaleString('fr-FR')}€)`);
      }

      // Multi-société
      if (societes.length > 1 && !hasRegimeMereFille) {
        recommandations.push(`🏢 Avec ${societes.length} sociétés, le régime mère-fille permettrait d'éviter la double imposition sur les dividendes (économie estimée: ${((caTotal * 0.05) * 0.30).toLocaleString('fr-FR')}€/an)`);
      }

      // SASU IR de marque
      if (societes.length === 1 && societes[0].statut.includes('SASU') && caTotal > 50000) {
        recommandations.push(`🏢 STRATÉGIE AVANCÉE : Créer une SASU à l'IR "Marque" pour protéger votre nom commercial. Elle facturera des redevances de marque (5-10% du CA) à votre société opérationnelle, optimisant ainsi la fiscalité et protégeant votre image de marque.`);
      }

      // Si déjà multi-société, proposer la marque
      if (societes.length >= 2 && !societes.some(s => s.nom.toLowerCase().includes('marque'))) {
        recommandations.push(`🏢 OPTIMISATION : Une structure "Holding + Marque + Exploitation" permettrait de séparer les risques et optimiser la fiscalité via le régime mère-fille et les redevances de marque.`);
      }

      if (societes.length === 1 && caTotal > 100000) {
        recommandations.push(`📊 Au-delà de 100k€ de CA, envisagez une structure mère-fille pour séparer activité opérationnelle et holding patrimonial`);
      }

      // LMNP
      if (hasLMNP) {
        recommandations.push(`🏠 LMNP au réel recommandé si charges > 50% du CA (amortissement du bien déductible)`);
      }

      // SCI
      if (hasSCI) {
        if (sciType === 'IS') {
          recommandations.push(`🏢 SCI à l'IS : intéressant si vous réinvestissez les loyers. Attention à la plus-value à la revente (19% + PS)`);
        } else {
          recommandations.push(`🏢 SCI à l'IR : transparent fiscalement, idéal pour transmission. Envisagez passage IS si gros travaux`);
        }
      }

      // Zones fiscales
      const zones = await detectZones();

      if (zones.isZFRR) {
        recommandations.push(`📍 ZFRR détectée ! Exonération fiscale jusqu'à 50% pendant 5 ans`);
      }
      if (zones.isAFR) {
        recommandations.push(`📍 Éligible AFR : subventions pour investissements productifs`);
      }
      if (zones.isQPV) {
        recommandations.push(`📍 Quartier Prioritaire : exonérations fiscales et sociales possibles`);
      }
      if (zones.isBER) {
        recommandations.push(`📍 Bassin d'Emploi à Redynamiser : aides à l'implantation`);
      }

      // Optimisations statut
      const hasEI = societes.some(s => s.statut === 'EI');
      const hasSASU_IS = societes.some(s => s.statut === 'SASU_IS' || s.statut === 'SAS_IS');

      if (hasEI) {
        recommandations.push(`⚠️ EI détectée : passage en SASU à l'IR recommandé pour réduire les charges sociales de ${((chargesSocialesActuelles * 0.3)).toLocaleString('fr-FR')}€/an`);
      }

      if (hasSASU_IS && caTotal < 150000) {
        recommandations.push(`📊 SASU à l'IS détectée avec CA < 150k€ : passage à l'IR plus avantageux (économie impôts: ${(impotsActuels * 0.2).toLocaleString('fr-FR')}€/an)`);
      }

      const resultData = {
        situationActuelle: {
          ca: caTotal,
          charges: chargesTotal,
          remunerationBrute: caTotal - chargesTotal,
          chargesSociales: chargesSocialesActuelles,
          impots: impotsActuels,
          netCash: netActuel,
        },
        situationOptimisee: {
          ca: caTotal,
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
        details: {
          nbSocietes: societes.length,
          hasLMNP,
          hasSCI,
          hasRegimeMereFille,
        }
      };

      setResults(resultData);

      // Sauvegarder
      await supabase.from('closer_simulations').insert({
        closer_id: userId,
        client_name: clientName,
        client_email: clientEmail,
        ca_annuel: caTotal,
        charges_reelles: chargesTotal,
        frais_comptable: fraisComptableNum,
        statut_actuel: societes.length > 1 ? 'MULTI' : societes[0].statut,
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
          🧮 Simulateur Société Avancé
        </h1>
        <p className="text-slate-600 mt-2">
          Analyse multi-société, LMNP, SCI, régime mère-fille
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* FORMULAIRE */}
        <div className="space-y-6">
          {/* Client */}
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
                <Label>Frais comptable annuel (€)</Label>
                <Input 
                  type="number" 
                  value={fraisComptable} 
                  onChange={(e) => setFraisComptable(e.target.value)} 
                  placeholder="2400" 
                />
              </div>

              <div>
                <Label>Code postal</Label>
                <Input 
                  value={codePostal} 
                  onChange={(e) => setCodePostal(e.target.value)} 
                  placeholder="63000"
                  maxLength={5}
                />
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
            </CardContent>
          </Card>

          {/* Sociétés */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sociétés ({societes.length})</CardTitle>
                <Button size="sm" onClick={addSociete} variant="outline">
                  <Plus size={14} className="mr-1" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {societes.map((soc) => (
                <div key={soc.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={soc.nom}
                      onChange={(e) => updateSociete(soc.id, 'nom', e.target.value)}
                      placeholder="Nom société"
                      className="font-semibold"
                    />
                    {societes.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeSociete(soc.id)}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    )}
                  </div>

                  <Select 
                    value={soc.statut} 
                    onValueChange={(v) => updateSociete(soc.id, 'statut', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Statut juridique *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EI">EI / Auto-entrepreneur</SelectItem>
                      <SelectItem value="EURL">EURL</SelectItem>
                      <SelectItem value="SARL">SARL</SelectItem>
                      <SelectItem value="SASU_IR">SASU à l'IR</SelectItem>
                      <SelectItem value="SASU_IS">SASU à l'IS</SelectItem>
                      <SelectItem value="SAS_IR">SAS à l'IR</SelectItem>
                      <SelectItem value="SAS_IS">SAS à l'IS</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">CA annuel (€) *</Label>
                      <Input
                        type="number"
                        value={soc.ca}
                        onChange={(e) => updateSociete(soc.id, 'ca', e.target.value)}
                        placeholder="80000"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Charges (€) *</Label>
                      <Input
                        type="number"
                        value={soc.charges}
                        onChange={(e) => updateSociete(soc.id, 'charges', e.target.value)}
                        placeholder="15000"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {societes.length > 1 && (
                <div className="flex items-center gap-2 p-3 bg-orange-50 rounded">
                  <Checkbox
                    checked={hasRegimeMereFille}
                    onCheckedChange={(checked) => setHasRegimeMereFille(checked as boolean)}
                  />
                  <Label className="text-sm">Déjà en régime mère-fille</Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* LMNP */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={hasLMNP}
                  onCheckedChange={(checked) => setHasLMNP(checked as boolean)}
                />
                <Label className="font-semibold">LMNP (Location Meublée Non Professionnelle)</Label>
              </div>

              {hasLMNP && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">CA LMNP (€)</Label>
                    <Input
                      type="number"
                      value={lmnpCA}
                      onChange={(e) => setLmnpCA(e.target.value)}
                      placeholder="24000"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Charges LMNP (€)</Label>
                    <Input
                      type="number"
                      value={lmnpCharges}
                      onChange={(e) => setLmnpCharges(e.target.value)}
                      placeholder="5000"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SCI */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={hasSCI}
                  onCheckedChange={(checked) => setHasSCI(checked as boolean)}
                />
                <Label className="font-semibold">SCI (Société Civile Immobilière)</Label>
              </div>

              {hasSCI && (
                <div className="space-y-3">
                  <Select value={sciType} onValueChange={setSciType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IR">SCI à l'IR</SelectItem>
                      <SelectItem value="IS">SCI à l'IS</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Loyers annuels (€)</Label>
                      <Input
                        type="number"
                        value={sciCA}
                        onChange={(e) => setSciCA(e.target.value)}
                        placeholder="18000"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Charges SCI (€)</Label>
                      <Input
                        type="number"
                        value={sciCharges}
                        onChange={(e) => setSciCharges(e.target.value)}
                        placeholder="3000"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            onClick={calculate} 
            disabled={loading || !clientName || societes.some(s => !s.ca || !s.charges)} 
            className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 animate-spin" size={20} />
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator className="mr-2" size={20} />
                Calculer l'optimisation
              </>
            )}
          </Button>
        </div>

        {/* RÉSULTATS */}
        {results ? (
          <div className="space-y-6">
            {/* Résultat principal */}
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

                  {results.details && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-blue-50 rounded text-center">
                        <span className="font-semibold">Sociétés:</span> {results.details.nbSocietes}
                      </div>
                      {results.details.hasLMNP && (
                        <div className="p-2 bg-purple-50 rounded text-center font-semibold">
                          ✓ LMNP
                        </div>
                      )}
                      {results.details.hasSCI && (
                        <div className="p-2 bg-green-50 rounded text-center font-semibold">
                          ✓ SCI
                        </div>
                      )}
                      {results.details.hasRegimeMereFille && (
                        <div className="p-2 bg-orange-50 rounded text-center font-semibold">
                          ✓ Mère-fille
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DÉTAILS DU CALCUL */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Détails du calcul</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Situation actuelle */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">Situation actuelle</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>CA total</span>
                        <span className="font-semibold">{results.situationActuelle.ca.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span>- Charges</span>
                        <span className="font-semibold text-red-600">-{results.situationActuelle.charges.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>= Rémunération brute</span>
                        <span className="font-semibold">{results.situationActuelle.remunerationBrute.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span>- Charges sociales</span>
                        <span className="font-semibold text-red-600">-{results.situationActuelle.chargesSociales.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 rounded">
                        <span>- Impôts</span>
                        <span className="font-semibold text-red-600">-{results.situationActuelle.impots.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-900 text-white rounded font-bold">
                        <span>= NET CASH</span>
                        <span>{results.situationActuelle.netCash.toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  </div>

                  {/* Situation optimisée */}
                  <div>
                    <h4 className="font-bold text-green-900 mb-2">Avec Méthode Déclic</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>CA total</span>
                        <span className="font-semibold">{results.situationOptimisee.ca.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span>- Charges + IK + MDA</span>
                        <span className="font-semibold text-red-600">-{results.situationOptimisee.charges.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded text-xs">
                        <span className="ml-4">dont IK remboursés</span>
                        <span className="font-semibold text-blue-600">+{results.situationOptimisee.ik.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2 bg-blue-50 rounded text-xs">
                        <span className="ml-4">dont MDA habitation</span>
                        <span className="font-semibold text-blue-600">+{results.situationOptimisee.mda.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2 bg-green-50 rounded">
                        <span>- Charges sociales optimisées</span>
                        <span className="font-semibold text-red-600">-{results.situationOptimisee.chargesSociales.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-2">
                        <span>- Impôts optimisés</span>
                        <span className="font-semibold text-red-600">-{results.situationOptimisee.impots.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div className="flex justify-between p-3 bg-green-600 text-white rounded font-bold">
                        <span>= NET CASH</span>
                        <span>{results.situationOptimisee.netCash.toLocaleString('fr-FR')} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ZONES FISCALES */}
            {(results.isZFRR || results.isAFR || results.isQPV || results.isBER) && (
              <Card className="border-2 border-green-500 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    🎯 Zones fiscales avantageuses détectées !
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.isZFRR && (
                      <div className="p-4 bg-white rounded-lg border-2 border-green-500">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">🏞️</div>
                          <div>
                            <h4 className="font-bold text-green-900 mb-1">ZFRR - Zone Franche Rurale</h4>
                            <p className="text-sm text-green-800 mb-2">
                              Exonération d'impôts sur les bénéfices jusqu'à 50% pendant 5 ans
                            </p>
                            <ul className="text-xs text-green-700 space-y-1">
                              <li>✓ 100% la 1ère année</li>
                              <li>✓ 75% la 2ème année</li>
                              <li>✓ 50% la 3ème année</li>
                              <li>✓ 25% les 4ème et 5ème années</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {results.isAFR && (
                      <div className="p-4 bg-white rounded-lg border-2 border-blue-500">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">💰</div>
                          <div>
                            <h4 className="font-bold text-blue-900 mb-1">AFR - Aide à la Finalité Régionale</h4>
                            <p className="text-sm text-blue-800 mb-2">
                              Subventions pour investissements productifs
                            </p>
                            <ul className="text-xs text-blue-700 space-y-1">
                              <li>✓ Jusqu'à 20% de l'investissement</li>
                              <li>✓ Machines, bâtiments, équipements</li>
                              <li>✓ Accompagnement région</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {results.isQPV && (
                      <div className="p-4 bg-white rounded-lg border-2 border-purple-500">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">🏘️</div>
                          <div>
                            <h4 className="font-bold text-purple-900 mb-1">QPV - Quartier Prioritaire</h4>
                            <p className="text-sm text-purple-800 mb-2">
                              Exonérations fiscales et sociales
                            </p>
                            <ul className="text-xs text-purple-700 space-y-1">
                              <li>✓ Exonération cotisations patronales (1,5 SMIC)</li>
                              <li>✓ Exonération impôts 5 ans</li>
                              <li>✓ Exonération CFE 5 ans</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {results.isBER && (
                      <div className="p-4 bg-white rounded-lg border-2 border-orange-500">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">🏭</div>
                          <div>
                            <h4 className="font-bold text-orange-900 mb-1">BER - Bassin d'Emploi à Redynamiser</h4>
                            <p className="text-sm text-orange-800 mb-2">
                              Aides à l'implantation et à l'emploi
                            </p>
                            <ul className="text-xs text-orange-700 space-y-1">
                              <li>✓ Exonération cotisations patronales</li>
                              <li>✓ Prime aménagement territoire</li>
                              <li>✓ Accompagnement Pôle Emploi</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommandations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="text-blue-600" />
                  Recommandations personnalisées
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

            {/* Bouton PDF */}
            <Button 
              onClick={handleDownloadPDF}
              className="w-full bg-slate-900 hover:bg-slate-800 h-12 text-base"
            >
              <Download className="mr-2" size={20} />
              Télécharger le rapport PDF complet
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
                Remplissez le formulaire et lancez le calcul
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}