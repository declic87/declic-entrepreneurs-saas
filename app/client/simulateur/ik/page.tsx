'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, FileText, FileSpreadsheet, ArrowLeft, Info, Calculator, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const BAREME_2025 = [
  { cv: 3, tranche1: 0.529, tranche2: 0.316, tranche3: 0.370, seuil1: 5000, seuil2: 20000 },
  { cv: 4, tranche1: 0.606, tranche2: 0.340, tranche3: 0.407, seuil1: 5000, seuil2: 20000 },
  { cv: 5, tranche1: 0.636, tranche2: 0.357, tranche3: 0.427, seuil1: 5000, seuil2: 20000 },
  { cv: 6, tranche1: 0.665, tranche2: 0.374, tranche3: 0.447, seuil1: 5000, seuil2: 20000 },
  { cv: 7, tranche1: 0.697, tranche2: 0.394, tranche3: 0.470, seuil1: 5000, seuil2: 20000 },
];

export default function SimulateurIK() {
  const [inputs, setInputs] = useState({
    cv: 5,
    kmMensuels: 833, // ~10000/12
    joursTravailles: 20,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });

  const results = useMemo(() => {
    const bareme = BAREME_2025.find(b => b.cv === inputs.cv) || BAREME_2025[2];
    const kmAnnuels = inputs.kmMensuels * 12;
    
    // Calcul annuel avec tranches
    let indemniteAnnuelle = 0;
    let detailTranches = [];
    
    if (kmAnnuels <= bareme.seuil1) {
      indemniteAnnuelle = kmAnnuels * bareme.tranche1;
      detailTranches.push({
        tranche: `0 à ${bareme.seuil1.toLocaleString()} km`,
        km: kmAnnuels,
        taux: bareme.tranche1,
        montant: indemniteAnnuelle
      });
    } else if (kmAnnuels <= bareme.seuil2) {
      const montantT1 = bareme.seuil1 * bareme.tranche1;
      const montantT2 = (kmAnnuels - bareme.seuil1) * bareme.tranche2;
      indemniteAnnuelle = montantT1 + montantT2;
      detailTranches.push({
        tranche: `0 à ${bareme.seuil1.toLocaleString()} km`,
        km: bareme.seuil1,
        taux: bareme.tranche1,
        montant: montantT1
      });
      detailTranches.push({
        tranche: `${bareme.seuil1.toLocaleString()} à ${bareme.seuil2.toLocaleString()} km`,
        km: kmAnnuels - bareme.seuil1,
        taux: bareme.tranche2,
        montant: montantT2
      });
    } else {
      const montantT1 = bareme.seuil1 * bareme.tranche1;
      const montantT2 = (bareme.seuil2 - bareme.seuil1) * bareme.tranche2;
      const montantT3 = (kmAnnuels - bareme.seuil2) * bareme.tranche3;
      indemniteAnnuelle = montantT1 + montantT2 + montantT3;
      detailTranches.push({
        tranche: `0 à ${bareme.seuil1.toLocaleString()} km`,
        km: bareme.seuil1,
        taux: bareme.tranche1,
        montant: montantT1
      });
      detailTranches.push({
        tranche: `${bareme.seuil1.toLocaleString()} à ${bareme.seuil2.toLocaleString()} km`,
        km: bareme.seuil2 - bareme.seuil1,
        taux: bareme.tranche2,
        montant: montantT2
      });
      detailTranches.push({
        tranche: `Plus de ${bareme.seuil2.toLocaleString()} km`,
        km: kmAnnuels - bareme.seuil2,
        taux: bareme.tranche3,
        montant: montantT3
      });
    }

    const indemniteMensuelle = indemniteAnnuelle / 12;
    const coutKmMoyen = indemniteAnnuelle / kmAnnuels;

    // Projection 12 mois
    const projectionMensuelle = Array.from({ length: 12 }, (_, i) => ({
      mois: i + 1,
      km: inputs.kmMensuels,
      indemnite: indemniteMensuelle
    }));

    // Commentaire
    let commentaire = '';
    if (kmAnnuels < 5000) {
      commentaire = '📊 Vous êtes dans la tranche 1 (taux le plus élevé). Optimal pour les petits rouleurs.';
    } else if (kmAnnuels < 20000) {
      commentaire = '📊 Vous êtes dans la tranche 2. Barème dégressif pour les distances moyennes.';
    } else {
      commentaire = '📊 Vous dépassez 20 000 km/an (tranche 3). Le barème est moins avantageux au-delà.';
    }

    if (inputs.cv >= 6) {
      commentaire += ' 💡 Avec un véhicule puissant, vos indemnités sont maximisées.';
    }

    return {
      bareme,
      kmAnnuels,
      indemniteAnnuelle,
      indemniteMensuelle,
      coutKmMoyen,
      detailTranches,
      projectionMensuelle,
      commentaire
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // En-tête
      pdf.setFillColor(6, 182, 212);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INDEMNITÉS KILOMÉTRIQUES 2025', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Barème fiscal officiel (CGI art. 83-3)', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });

      // Données
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNÉES', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      [
        `Puissance fiscale : ${inputs.cv} CV`,
        `Kilomètres mensuels : ${inputs.kmMensuels.toLocaleString()} km`,
        `Kilomètres annuels : ${results.kmAnnuels.toLocaleString()} km`,
        `Jours travaillés/mois : ${inputs.joursTravailles}`,
      ].forEach(h => {
        pdf.text(h, 25, y);
        y += 7;
      });

      // Résultats
      y += 10;
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(20, y - 5, pageWidth - 40, 35, 3, 3, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INDEMNITÉS', 25, y + 5);
      
      pdf.setFontSize(20);
      pdf.text(`${currency(results.indemniteMensuelle)} / mois`, 25, y + 15);
      pdf.setFontSize(14);
      pdf.text(`${currency(results.indemniteAnnuelle)} / an`, 25, y + 25);

      // Détail tranches
      y += 45;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DÉTAIL PAR TRANCHE', 20, y);
      
      y += 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Tranche', 22, y);
      pdf.text('Km', 90, y);
      pdf.text('Taux €/km', 120, y);
      pdf.text('Montant', 160, y);
      
      pdf.setLineWidth(0.5);
      pdf.line(20, y + 2, pageWidth - 20, y + 2);
      
      y += 8;
      pdf.setFont('helvetica', 'normal');
      
      results.detailTranches.forEach(t => {
        pdf.text(t.tranche, 22, y);
        pdf.text(t.km.toLocaleString(), 90, y);
        pdf.text(t.taux.toFixed(3), 120, y);
        pdf.text(currency(t.montant), 160, y);
        y += 7;
      });

      // Barème complet
      y += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`BARÈME OFFICIEL ${inputs.cv} CV`, 20, y);
      
      y += 10;
      pdf.setFontSize(9);
      pdf.text(`0 à 5 000 km : ${results.bareme.tranche1} €/km`, 25, y);
      y += 6;
      pdf.text(`5 001 à 20 000 km : ${results.bareme.tranche2} €/km`, 25, y);
      y += 6;
      pdf.text(`Plus de 20 000 km : ${results.bareme.tranche3} €/km`, 25, y);

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Déclic Entrepreneurs • Indemnités kilométriques 2025', pageWidth / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });

      pdf.save(`ik-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();

      // Feuille 1 : Synthèse
      const syntheseData = [
        ['INDEMNITÉS KILOMÉTRIQUES 2025', ''],
        ['Date', new Date().toLocaleDateString('fr-FR')],
        ['', ''],
        ['VOS DONNÉES', ''],
        ['Puissance fiscale (CV)', inputs.cv],
        ['Km mensuels', inputs.kmMensuels],
        ['Km annuels', results.kmAnnuels],
        ['Jours travaillés/mois', inputs.joursTravailles],
        ['', ''],
        ['RÉSULTATS', ''],
        ['Indemnité mensuelle', results.indemniteMensuelle],
        ['Indemnité annuelle', results.indemniteAnnuelle],
        ['Coût moyen au km', results.coutKmMoyen],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(syntheseData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Synthèse');

      // Feuille 2 : Détail tranches
      const tranchesData = [
        ['DÉTAIL PAR TRANCHE', '', '', ''],
        ['', '', '', ''],
        ['Tranche', 'Kilomètres', 'Taux €/km', 'Montant'],
        ...results.detailTranches.map(t => [t.tranche, t.km, t.taux, t.montant])
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(tranchesData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Détail tranches');

      // Feuille 3 : Projection mensuelle
      const projectionData = [
        ['PROJECTION MENSUELLE', '', ''],
        ['', '', ''],
        ['Mois', 'Kilomètres', 'Indemnité'],
        ...results.projectionMensuelle.map(p => [p.mois, p.km, p.indemnite])
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(projectionData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Projection mensuelle');

      XLSX.writeFile(wb, `ik-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Poppins', sans-serif; }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-cyan-600 hover:text-cyan-800 mb-6 font-medium">
          <ArrowLeft size={20} />
          Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Indemnités Kilométriques</h1>
          <p className="text-xl text-slate-600">Barème fiscal 2025 • CGI art. 83-3</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* SIDEBAR */}
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Car className="text-cyan-600" size={24} />
              Configuration
            </h3>

            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">Puissance fiscale (CV)</Label>
                <select 
                  value={inputs.cv} 
                  onChange={(e) => setInputs({...inputs, cv: Number(e.target.value)})} 
                  className="w-full h-12 px-3 rounded-md border border-slate-300 font-semibold"
                >
                  {[3,4,5,6,7].map(cv => (
                    <option key={cv} value={cv}>{cv} CV</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-2 block">Kilomètres mensuels</Label>
                <Input 
                  type="number" 
                  value={inputs.kmMensuels as any} 
                  onChange={(e) => setInputs({...inputs, kmMensuels: Number(e.target.value) || 0})} 
                  className="h-12 text-lg" 
                />
                <p className="text-xs text-slate-500 mt-1">
                  {results.kmAnnuels.toLocaleString()} km/an
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Jours travaillés/mois</Label>
                <Input 
                  type="number" 
                  value={inputs.joursTravailles as any} 
                  onChange={(e) => setInputs({...inputs, joursTravailles: Number(e.target.value) || 0})} 
                  className="h-12" 
                />
                <p className="text-xs text-slate-500 mt-1">
                  {(inputs.kmMensuels / inputs.joursTravailles).toFixed(0)} km/jour
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button 
                onClick={exportToPDF}
                disabled={exportingPDF}
                className="w-full bg-red-600 hover:bg-red-700 h-12 font-bold"
              >
                {exportingPDF ? 'PDF...' : (
                  <>
                    <FileText size={18} className="mr-2" />
                    Export PDF
                  </>
                )}
              </Button>

              <Button 
                onClick={exportToExcel}
                disabled={exportingExcel}
                className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold"
              >
                {exportingExcel ? 'Excel...' : (
                  <>
                    <FileSpreadsheet size={18} className="mr-2" />
                    Export Excel
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* RESULTS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Montants */}
            <Card className="p-8 bg-gradient-to-br from-cyan-600 to-blue-600 text-white">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-cyan-100 mb-2">Indemnité mensuelle</p>
                  <p className="text-5xl font-black mb-4">{currency(results.indemniteMensuelle)}</p>
                  <p className="text-cyan-100">
                    soit {currency(results.indemniteMensuelle / inputs.joursTravailles)}/jour
                  </p>
                </div>
                <div>
                  <p className="text-sm text-cyan-100 mb-2">Indemnité annuelle</p>
                  <p className="text-5xl font-black mb-4">{currency(results.indemniteAnnuelle)}</p>
                  <p className="text-cyan-100">
                    soit {currency(results.coutKmMoyen)}/km
                  </p>
                </div>
              </div>
            </Card>

            {/* Commentaire */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-blue-900 mb-2">Analyse</h3>
                  <p className="text-blue-800 text-sm">{results.commentaire}</p>
                </div>
              </div>
            </Card>

            {/* Détail tranches */}
            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calculator className="text-cyan-600" size={24} />
                Détail par tranche
              </h3>
              <div className="space-y-3">
                {results.detailTranches.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900">{t.tranche}</p>
                      <p className="text-sm text-slate-600">
                        {t.km.toLocaleString()} km × {t.taux} €/km
                      </p>
                    </div>
                    <p className="text-2xl font-black text-cyan-600">
                      {currency(t.montant)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Barème */}
            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Barème officiel {inputs.cv} CV</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                  <p className="text-xs text-emerald-700 font-bold mb-1">0 à 5 000 km</p>
                  <p className="text-3xl font-black text-emerald-900">{results.bareme.tranche1} €</p>
                  <p className="text-xs text-emerald-700">par kilomètre</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-bold mb-1">5 001 à 20 000 km</p>
                  <p className="text-3xl font-black text-blue-900">{results.bareme.tranche2} €</p>
                  <p className="text-xs text-blue-700">par kilomètre</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 font-bold mb-1">Plus de 20 000 km</p>
                  <p className="text-3xl font-black text-orange-900">{results.bareme.tranche3} €</p>
                  <p className="text-xs text-orange-700">par kilomètre</p>
                </div>
              </div>
            </Card>

            {/* Info légale */}
            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="text-amber-600 flex-shrink-0" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-bold mb-2">À savoir :</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Barème applicable pour les véhicules de tourisme</li>
                    <li>• Déductible fiscalement selon CGI art. 83-3</li>
                    <li>• Le barème couvre : carburant, entretien, assurance, dépréciation</li>
                    <li>• Alternative : frais réels (sur justificatifs)</li>
                    <li>• Révision annuelle du barème par l'administration fiscale</li>
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