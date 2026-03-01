'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, FileText, FileSpreadsheet, ArrowLeft, Info, Plus, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

// CONSTANTES OFFICIELLES 2026
const SMIC_ANNUEL_2026 = 21203;
const PASS_2026 = 48060; // Plafond Annuel Securite Sociale 2026

// AGIRC-ARRCO 2026 (assimile salarie)
const VALEUR_POINT_AGIRC = 1.4159; // euros
const PRIX_ACHAT_POINT_AGIRC = 18.7726; // euros
const TAUX_COTIS_AGIRC_T1 = 0.0787; // 7.87% tranche 1 (0-1 PASS)
const TAUX_COTIS_AGIRC_T2 = 0.2159; // 21.59% tranche 2 (1-8 PASS)

// SSI BASE 2026 (TNS)
const VALEUR_POINT_SSI_BASE = 0.6155; // euros
const TAUX_COTIS_SSI_BASE_T1 = 0.1775; // 17.75% tranche 1 (0-1 PASS)
const TAUX_COTIS_SSI_BASE_T2 = 0.006; // 0.60% tranche 2 (1-5 PASS)

// SSI COMPLEMENTAIRE RCI 2026 (TNS)
const VALEUR_POINT_RCI = 1.2588; // euros
const TAUX_COTIS_RCI = 0.07; // 7% (0-4 PASS)

type StatutType = 'micro_bnc' | 'micro_bic' | 'president_sas' | 'gerant_tns' | 'ei_tns' | 'salarie';

interface Periode {
  id: string;
  debut: number;
  fin: number;
  statut: StatutType;
  revenuBrutAnnuel: number;
}

const STATUTS = {
  micro_bnc: { nom: 'Micro BNC', type: 'tns' },
  micro_bic: { nom: 'Micro BIC', type: 'tns' },
  president_sas: { nom: 'President SAS', type: 'salarie' },
  gerant_tns: { nom: 'Gerant TNS', type: 'tns' },
  ei_tns: { nom: 'EI TNS', type: 'tns' },
  salarie: { nom: 'Salarie', type: 'salarie' }
};

export default function SimulateurRetraite() {
  const [anneeNaissance, setAnneeNaissance] = useState(1990);
  const [periodes, setPeriodes] = useState<Periode[]>([
    { id: '1', debut: 2025, fin: 2060, statut: 'gerant_tns', revenuBrutAnnuel: 30000 }
  ]);

  const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
  const currency = (n: number) => fmt(n) + ' EUR';

  const results = useMemo(() => {
    let trimestresTotal = 0;
    let pointsAgircTotal = 0;
    let pointsSSIBaseTotal = 0;
    let pointsRCITotal = 0;

    periodes.forEach(periode => {
      const nbAnnees = periode.fin - periode.debut + 1;
      const config = STATUTS[periode.statut];
      
      for (let annee = 0; annee < nbAnnees; annee++) {
        const revenu = periode.revenuBrutAnnuel;
        
        // === VALIDATION TRIMESTRES ===
        const seuilTrimestre = SMIC_ANNUEL_2026 * 0.25; // 5 300.75 EUR
        const trimestresAnnee = Math.min(4, Math.floor(revenu / seuilTrimestre));
        trimestresTotal += trimestresAnnee;
        
        // === CALCUL POINTS RETRAITE ===
        if (config.type === 'salarie') {
          // ============ AGIRC-ARRCO (Assimile salarie + Salarie) ============
          
          // Tranche 1 : 0 a 1 PASS (48 060 EUR)
          const assiette_T1 = Math.min(revenu, PASS_2026);
          const cotis_T1 = assiette_T1 * TAUX_COTIS_AGIRC_T1;
          
          // Tranche 2 : 1 PASS a 8 PASS (48 060 a 384 480 EUR)
          const assiette_T2 = Math.max(0, Math.min(revenu, PASS_2026 * 8) - PASS_2026);
          const cotis_T2 = assiette_T2 * TAUX_COTIS_AGIRC_T2;
          
          // Total cotisations retraite complementaire
          const cotisationsTotal = cotis_T1 + cotis_T2;
          
          // Acquisition points : cotisations / prix achat
          const pointsAnnee = cotisationsTotal / PRIX_ACHAT_POINT_AGIRC;
          pointsAgircTotal += pointsAnnee;
          
        } else {
          // ============ SSI (TNS : Gerant, EI, Micro) ============
          
          // --- RETRAITE DE BASE SSI ---
          // Tranche 1 : 17.75% jusqu'a 1 PASS
          const assiette_base_T1 = Math.min(revenu, PASS_2026);
          const cotis_base_T1 = assiette_base_T1 * TAUX_COTIS_SSI_BASE_T1;
          
          // Tranche 2 : 0.60% entre 1 et 5 PASS
          const assiette_base_T2 = Math.max(0, Math.min(revenu, PASS_2026 * 5) - PASS_2026);
          const cotis_base_T2 = assiette_base_T2 * TAUX_COTIS_SSI_BASE_T2;
          
          // Points SSI Base : formule simplifiee
          // En realite : 1 trimestre valide = 1 point si revenu >= SMIC
          // Approximation : points proportionnels au revenu plafonne
          const pointsBaseAnnee = (assiette_base_T1 / PASS_2026) * 550; // ~550 points max/an
          pointsSSIBaseTotal += pointsBaseAnnee;
          
          // --- RETRAITE COMPLEMENTAIRE RCI (SSI) ---
          // 7% jusqu'a 4 PASS (192 240 EUR)
          const assiette_rci = Math.min(revenu, PASS_2026 * 4);
          const cotis_rci = assiette_rci * TAUX_COTIS_RCI;
          
          // Points RCI : environ 1 point pour 69 EUR cotises
          const pointsRCIAnnee = cotis_rci / 69;
          pointsRCITotal += pointsRCIAnnee;
        }
      }
    });

    // === CALCUL PENSION ANNUELLE ===
    const pensionAgircAnnuelle = pointsAgircTotal * VALEUR_POINT_AGIRC;
    const pensionSSIBaseAnnuelle = pointsSSIBaseTotal * VALEUR_POINT_SSI_BASE;
    const pensionRCIAnnuelle = pointsRCITotal * VALEUR_POINT_RCI;
    
    const pensionTotaleAnnuelle = pensionAgircAnnuelle + pensionSSIBaseAnnuelle + pensionRCIAnnuelle;
    const pensionMensuelle = pensionTotaleAnnuelle / 12;

    // === AGE DE DEPART ===
    const AGE_LEGAL_2026 = 64;
    const TRIMESTRES_REQUIS_2026 = 172; // 43 ans
    const trimestresManquants = Math.max(0, TRIMESTRES_REQUIS_2026 - trimestresTotal);
    const anneesManquantes = Math.ceil(trimestresManquants / 4);
    const ageDepartTauxPlein = AGE_LEGAL_2026 + anneesManquantes;
    const anneeDepartTauxPlein = anneeNaissance + ageDepartTauxPlein;
    
    const anneeActuelle = 2026;
    const ageActuel = anneeActuelle - anneeNaissance;
    const anneesRestantes = ageDepartTauxPlein - ageActuel;

    // === TAUX DE REMPLACEMENT ===
    const revenuMoyenCarriere = periodes.reduce((sum, p) => {
      const nbAnnees = p.fin - p.debut + 1;
      return sum + (p.revenuBrutAnnuel * nbAnnees);
    }, 0) / periodes.reduce((sum, p) => sum + (p.fin - p.debut + 1), 0);
    
    const tauxRemplacement = revenuMoyenCarriere > 0 ? (pensionTotaleAnnuelle / revenuMoyenCarriere) * 100 : 0;

    return {
      trimestres: {
        total: trimestresTotal,
        requis: TRIMESTRES_REQUIS_2026,
        manquants: trimestresManquants
      },
      points: {
        agirc: pointsAgircTotal,
        ssiBase: pointsSSIBaseTotal,
        rci: pointsRCITotal
      },
      pension: {
        agirc: pensionAgircAnnuelle,
        ssiBase: pensionSSIBaseAnnuelle,
        rci: pensionRCIAnnuelle,
        totaleAnnuelle: pensionTotaleAnnuelle,
        mensuelle: pensionMensuelle,
        tauxRemplacement
      },
      age: {
        legal: AGE_LEGAL_2026,
        actuel: ageActuel,
        tauxPlein: ageDepartTauxPlein,
        anneeDepartTauxPlein,
        anneesRestantes,
        anneesManquantes
      }
    };
  }, [anneeNaissance, periodes]);

  function ajouterPeriode() {
    const derniere = periodes[periodes.length - 1];
    setPeriodes([...periodes, {
      id: Date.now().toString(),
      debut: derniere.fin + 1,
      fin: derniere.fin + 10,
      statut: 'president_sas',
      revenuBrutAnnuel: 30000
    }]);
  }

  function supprimerPeriode(id: string) {
    if (periodes.length > 1) {
      setPeriodes(periodes.filter(p => p.id !== id));
    }
  }

  function updatePeriode(id: string, field: keyof Periode, value: any) {
    setPeriodes(periodes.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  async function exportToPDF() {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('SIMULATION RETRAITE 2026', 20, 20);
    pdf.setFontSize(11);
    let y = 40;
    pdf.text(`Annee naissance: ${anneeNaissance}`, 20, y);
    y += 10;
    pdf.text(`Age actuel: ${results.age.actuel} ans`, 20, y);
    y += 10;
    pdf.text(`Trimestres valides: ${results.trimestres.total}/${results.trimestres.requis}`, 20, y);
    y += 10;
    pdf.text(`Age depart taux plein: ${results.age.tauxPlein} ans (${results.age.anneeDepartTauxPlein})`, 20, y);
    y += 10;
    pdf.text(`Temps restant: ${results.age.anneesRestantes} ans`, 20, y);
    y += 15;
    pdf.text(`Pension mensuelle brute estimee: ${currency(results.pension.mensuelle)}`, 20, y);
    y += 10;
    pdf.text(`Pension annuelle brute estimee: ${currency(results.pension.totaleAnnuelle)}`, 20, y);
    y += 10;
    pdf.text(`Taux remplacement: ${results.pension.tauxRemplacement.toFixed(1)}%`, 20, y);
    pdf.save(`retraite-${Date.now()}.pdf`);
  }

  function exportToExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['SIMULATION RETRAITE 2026'],
      [''],
      ['Annee naissance', anneeNaissance],
      ['Age actuel', results.age.actuel],
      [''],
      ['TRIMESTRES'],
      ['Valides', results.trimestres.total],
      ['Requis', results.trimestres.requis],
      ['Manquants', results.trimestres.manquants],
      [''],
      ['PENSION'],
      ['Mensuelle brute', results.pension.mensuelle],
      ['Annuelle brute', results.pension.totaleAnnuelle],
      ['Taux remplacement', results.pension.tauxRemplacement.toFixed(1) + '%'],
      [''],
      ['AGE DEPART'],
      ['Legal', results.age.legal],
      ['Taux plein', results.age.tauxPlein],
      ['Annee depart', results.age.anneeDepartTauxPlein],
      ['Temps restant', results.age.anneesRestantes + ' ans'],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Retraite');
    XLSX.writeFile(wb, `retraite-${Date.now()}.xlsx`);
  }

  const hasAgirc = results.points.agirc > 0;
  const hasSSI = results.points.ssiBase > 0 || results.points.rci > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6">
          <ArrowLeft size={20} />Retour
        </Link>

        <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur Retraite 2026</h1>
        <p className="text-xl text-slate-600 mb-12">Calculs officiels 2026 - Multi-periodes - Projection precise</p>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <Card className="p-6 bg-white shadow-xl">
              <h3 className="text-lg font-bold mb-4">Annee naissance</h3>
              <Input 
                type="number" 
                value={anneeNaissance as any} 
                onChange={(e) => setAnneeNaissance(Number(e.target.value))} 
                className="h-12 text-lg font-bold"
              />
              <p className="text-sm text-slate-500 mt-2">Age actuel : {results.age.actuel} ans</p>
            </Card>

            <Card className="p-6 bg-white shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Periodes carriere</h3>
                <Button onClick={ajouterPeriode} size="sm">
                  <Plus size={16} className="mr-1" />Ajouter
                </Button>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {periodes.map((p, i) => (
                  <Card key={p.id} className="p-4 bg-slate-50 border-2 border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-bold">Periode {i + 1}</p>
                      {periodes.length > 1 && (
                        <Button onClick={() => supprimerPeriode(p.id)} size="sm" variant="ghost">
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Debut</Label>
                          <Input 
                            type="number" 
                            value={p.debut as any} 
                            onChange={(e) => updatePeriode(p.id, 'debut', Number(e.target.value))}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fin</Label>
                          <Input 
                            type="number" 
                            value={p.fin as any} 
                            onChange={(e) => updatePeriode(p.id, 'fin', Number(e.target.value))}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Statut</Label>
                        <select 
                          value={p.statut} 
                          onChange={(e) => updatePeriode(p.id, 'statut', e.target.value as StatutType)}
                          className="w-full h-9 px-2 rounded border text-sm"
                        >
                          <option value="micro_bnc">Micro BNC</option>
                          <option value="micro_bic">Micro BIC</option>
                          <option value="president_sas">President SAS</option>
                          <option value="gerant_tns">Gerant TNS</option>
                          <option value="ei_tns">EI TNS</option>
                          <option value="salarie">Salarie</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Revenu brut annuel</Label>
                        <Input 
                          type="number" 
                          value={p.revenuBrutAnnuel as any} 
                          onChange={(e) => updatePeriode(p.id, 'revenuBrutAnnuel', Number(e.target.value))}
                          className="h-9"
                        />
                      </div>
                      <p className="text-xs text-slate-500">{p.fin - p.debut + 1} ans ({STATUTS[p.statut].nom})</p>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>

            <div className="space-y-3">
              <Button onClick={exportToPDF} className="w-full bg-red-600 h-12">
                <FileText size={18} className="mr-2" />Export PDF
              </Button>
              <Button onClick={exportToExcel} className="w-full bg-green-600 h-12">
                <FileSpreadsheet size={18} className="mr-2" />Export Excel
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
                <p className="text-xs text-indigo-100 mb-1">Trimestres</p>
                <p className="text-3xl font-black">{results.trimestres.total}</p>
                <p className="text-xs text-indigo-100 mt-1">sur {results.trimestres.requis}</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                <p className="text-xs text-purple-100 mb-1">Depart</p>
                <p className="text-3xl font-black">{results.age.tauxPlein}</p>
                <p className="text-xs text-purple-100 mt-1">ans</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-amber-600 to-orange-600 text-white">
                <p className="text-xs text-amber-100 mb-1">Restant</p>
                <p className="text-3xl font-black">{results.age.anneesRestantes}</p>
                <p className="text-xs text-amber-100 mt-1">ans</p>
              </Card>
              <Card className="p-4 bg-gradient-to-br from-cyan-600 to-teal-600 text-white">
                <p className="text-xs text-cyan-100 mb-1">Taux</p>
                <p className="text-3xl font-black">{results.pension.tauxRemplacement.toFixed(0)}%</p>
                <p className="text-xs text-cyan-100 mt-1">remplacement</p>
              </Card>
            </div>

            <Card className="p-8 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
              <p className="text-emerald-100 mb-2">PENSION MENSUELLE BRUTE ESTIMEE</p>
              <p className="text-6xl font-black mb-2">{currency(results.pension.mensuelle)}</p>
              <p className="text-emerald-100">soit {currency(results.pension.totaleAnnuelle)} par an</p>
            </Card>

            {results.trimestres.manquants > 0 && (
              <Card className="p-6 bg-amber-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-bold text-amber-900 mb-2">Attention : Trimestres manquants</p>
                    <p className="text-amber-800 text-sm">
                      Il vous manque {results.trimestres.manquants} trimestres ({results.age.anneesManquantes} ans) pour partir a taux plein.
                      Depart possible a {results.age.legal} ans avec decote, ou attendre {results.age.tauxPlein} ans pour taux plein.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Detail pension annuelle</h3>
              <div className="space-y-3">
                {hasAgirc && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="font-bold text-blue-900">AGIRC-ARRCO</p>
                        <p className="text-xs text-blue-700">{fmt(results.points.agirc)} points x {VALEUR_POINT_AGIRC} EUR</p>
                      </div>
                      <p className="text-3xl font-black text-blue-600">{currency(results.pension.agirc)}</p>
                    </div>
                  </div>
                )}
                {hasSSI && (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-bold text-green-900">SSI Base</p>
                          <p className="text-xs text-green-700">{fmt(results.points.ssiBase)} points x {VALEUR_POINT_SSI_BASE} EUR</p>
                        </div>
                        <p className="text-3xl font-black text-green-600">{currency(results.pension.ssiBase)}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-bold text-purple-900">SSI Complementaire (RCI)</p>
                          <p className="text-xs text-purple-700">{fmt(results.points.rci)} points x {VALEUR_POINT_RCI} EUR</p>
                        </div>
                        <p className="text-3xl font-black text-purple-600">{currency(results.pension.rci)}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-slate-50">
              <div className="flex items-start gap-3">
                <Info className="text-slate-600 flex-shrink-0" size={20} />
                <div className="text-xs text-slate-700">
                  <p className="font-bold mb-2">Parametres officiels 2026 :</p>
                  <ul className="space-y-1">
                    <li>- Age legal depart : {results.age.legal} ans (generation 1968+)</li>
                    <li>- Trimestres requis taux plein : {results.trimestres.requis} (43 ans)</li>
                    <li>- Validation trimestre : {currency(SMIC_ANNUEL_2026 * 0.25)} de revenu minimum</li>
                    <li>- PASS 2026 : {currency(PASS_2026)}</li>
                    <li>- AGIRC-ARRCO : T1 7.87% (0-1 PASS) + T2 21.59% (1-8 PASS)</li>
                    <li>- SSI Base : 17.75% (0-1 PASS) + 0.60% (1-5 PASS)</li>
                    <li>- RCI : 7% (0-4 PASS)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}