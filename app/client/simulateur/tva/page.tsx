'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt, FileText, FileSpreadsheet, ArrowLeft, Info, CheckCircle, AlertCircle, Calculator } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurTVA() {
  const [inputs, setInputs] = useState({
    caHT: 80000,
    chargesHT: 20000,
    typeClient: 'B2B' as 'B2B' | 'B2C' | 'MIXTE',
    pctB2B: 70,
  });

  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const results = useMemo(() => {
    // FRANCHISE EN BASE
    const franchiseCaTTC = inputs.typeClient === 'B2B' ? inputs.caHT : inputs.caHT * 1.20;
    const franchiseChargesTTC = inputs.chargesHT * 1.20;
    const franchiseMarge = franchiseCaTTC - franchiseChargesTTC;
    const franchiseTresorerie = franchiseMarge;

    let franchiseCommentaire = '';
    if (inputs.caHT > 37500 && inputs.caHT <= 41400) {
      franchiseCommentaire = '⚠️ Zone de tolérance (37 500€ - 41 400€). Franchise maintenue si dépassement exceptionnel.';
    } else if (inputs.caHT > 41400) {
      franchiseCommentaire = '⚠️ CA au-dessus du seuil majoré (41 400€). Passage obligatoire au régime réel dès le 1er jour du mois de dépassement.';
    } else if (inputs.caHT > 37500) {
      franchiseCommentaire = '💡 Proche du seuil de base (37 500€). Surveillez votre CA pour éviter un dépassement.';
    } else if (inputs.typeClient === 'B2C') {
      franchiseCommentaire = '✅ Franchise intéressante en B2C : vous encaissez la TVA sans la reverser (marge supplémentaire).';
    } else {
      franchiseCommentaire = '✅ Franchise adaptée à votre situation. Simplicité administrative maximale.';
    }

    // RÉGIME RÉEL
    const reelTvaCollectee = inputs.caHT * 0.20;
    const reelTvaDeductible = inputs.chargesHT * 0.20;
    const reelTvaAVerser = reelTvaCollectee - reelTvaDeductible;
    const reelChargesTTC = inputs.chargesHT * 1.20;
    const reelCaTTC = inputs.typeClient === 'B2B' ? inputs.caHT : inputs.caHT * 1.20;
    const reelMarge = reelCaTTC - reelChargesTTC - reelTvaAVerser;
    const reelTresorerie = reelMarge;

    let reelCommentaire = '';
    if (inputs.chargesHT > inputs.caHT * 0.5) {
      reelCommentaire = '✅ Charges importantes : le régime réel vous permet de récupérer beaucoup de TVA. Plus avantageux que la franchise.';
    } else if (inputs.typeClient === 'B2B') {
      reelCommentaire = '✅ En B2B, vos clients récupèrent la TVA donc pas d\'impact prix. Le réel est souvent préférable.';
    } else if (inputs.typeClient === 'B2C') {
      reelCommentaire = '⚠️ En B2C, vos prix augmentent de 20% avec la TVA. Impact sur votre compétitivité à considérer.';
    } else {
      reelCommentaire = '💡 Le régime réel offre plus de flexibilité et de crédibilité professionnelle.';
    }

    // COMPARAISON
    const meilleur = franchiseTresorerie > reelTresorerie ? 'Franchise' : 'Réel';
    const difference = Math.abs(franchiseTresorerie - reelTresorerie);

    // SIMULATEUR PRIX
    const prixHT = 100;
    const prixFranchise = inputs.typeClient === 'B2B' ? prixHT : prixHT;
    const prixReel = inputs.typeClient === 'B2B' ? prixHT : prixHT * 1.20;

    return {
      franchise: {
        caTTC: franchiseCaTTC,
        chargesTTC: franchiseChargesTTC,
        marge: franchiseMarge,
        tresorerie: franchiseTresorerie,
        commentaire: franchiseCommentaire,
        avantages: [
          'Aucune déclaration de TVA',
          'Simplicité administrative totale',
          'Pas de TVA à reverser',
          'Marge supplémentaire en B2C'
        ],
        inconvenients: [
          'Plafond 37 500€ (base) / 41 400€ (majoré)',
          'TVA non récupérable sur achats',
          'Mention obligatoire sur factures',
          'Moins crédible auprès grands comptes'
        ]
      },
      reel: {
        caTTC: reelCaTTC,
        tvaCollectee: reelTvaCollectee,
        tvaDeductible: reelTvaDeductible,
        tvaAVerser: reelTvaAVerser,
        chargesTTC: reelChargesTTC,
        marge: reelMarge,
        tresorerie: reelTresorerie,
        commentaire: reelCommentaire,
        avantages: [
          'Récupération TVA sur achats',
          'Pas de plafond de CA',
          'Crédibilité professionnelle',
          'Obligatoire si CA > 41 400€'
        ],
        inconvenients: [
          'Déclarations TVA mensuelles/trimestrielles',
          'Gestion de trésorerie (TVA à reverser)',
          'Comptabilité plus complexe',
          'Prix +20% en B2C'
        ]
      },
      meilleur,
      difference,
      simulateurPrix: {
        prixHT,
        franchise: prixFranchise,
        reel: prixReel
      }
    };
  }, [inputs]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(236, 72, 153);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SIMULATEUR TVA 2026', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Franchise en base vs Régime réel', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('VOS DONNÉES', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      let y = 75;
      [
        `CA HT : ${currency(inputs.caHT)}`,
        `Charges HT : ${currency(inputs.chargesHT)}`,
        `Type clients : ${inputs.typeClient}`,
      ].forEach(h => { pdf.text(h, 25, y); y += 7; });

      y += 10;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPARAISON', 20, y);
      
      y += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Franchise : ${currency(results.franchise.tresorerie)}`, 25, y);
      pdf.text(`Réel : ${currency(results.reel.tresorerie)}`, 25, y + 7);
      pdf.text(`Recommandation : ${results.meilleur}`, 25, y + 14);

      pdf.save(`tva-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ['SIMULATEUR TVA 2026', ''],
        ['', ''],
        ['CA HT', inputs.caHT],
        ['Charges HT', inputs.chargesHT],
        ['Type clients', inputs.typeClient],
        ['', ''],
        ['FRANCHISE', ''],
        ['Trésorerie', results.franchise.tresorerie],
        ['', ''],
        ['RÉGIME RÉEL', ''],
        ['TVA collectée', results.reel.tvaCollectee],
        ['TVA déductible', results.reel.tvaDeductible],
        ['TVA à verser', results.reel.tvaAVerser],
        ['Trésorerie', results.reel.tresorerie],
        ['', ''],
        ['RECOMMANDATION', results.meilleur],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Simulation');
      XLSX.writeFile(wb, `tva-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Work Sans', sans-serif; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-800 mb-6 font-medium">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur TVA</h1>
          <p className="text-xl text-slate-600">Franchise en base vs Régime réel • Seuils 2026</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Receipt className="text-rose-600" size={24} />Config
            </h3>
            <div className="space-y-5">
              <div>
                <Label className="mb-2 block">CA HT annuel (€)</Label>
                <Input type="number" value={inputs.caHT as any} onChange={(e) => setInputs({...inputs, caHT: Number(e.target.value) || 0})} className="h-12 text-lg font-bold" />
                <p className="text-xs text-slate-500 mt-1">
                  Seuil franchise : 37 500€ (majoré 41 400€)
                </p>
              </div>
              <div>
                <Label className="mb-2 block">Charges HT (€)</Label>
                <Input type="number" value={inputs.chargesHT as any} onChange={(e) => setInputs({...inputs, chargesHT: Number(e.target.value) || 0})} className="h-12 text-lg" />
              </div>
              <div>
                <Label className="mb-2 block">Type clients</Label>
                <select value={inputs.typeClient} onChange={(e) => setInputs({...inputs, typeClient: e.target.value as any})} className="w-full h-12 px-3 rounded-md border font-semibold">
                  <option value="B2B">B2B (Professionnels)</option>
                  <option value="B2C">B2C (Particuliers)</option>
                  <option value="MIXTE">Mixte</option>
                </select>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <Button onClick={exportToPDF} disabled={exportingPDF} className="w-full bg-red-600 hover:bg-red-700 h-12 font-bold">
                {exportingPDF ? 'PDF...' : <><FileText size={18} className="mr-2" />Export PDF</>}
              </Button>
              <Button onClick={exportToExcel} disabled={exportingExcel} className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold">
                {exportingExcel ? 'Excel...' : <><FileSpreadsheet size={18} className="mr-2" />Export Excel</>}
              </Button>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-gradient-to-r from-rose-600 to-pink-600 text-white">
              <h3 className="text-2xl font-bold mb-2">Régime recommandé</h3>
              <p className="text-4xl font-black mb-2">{results.meilleur}</p>
              <p className="text-rose-100">Différence de {currency(results.difference)}</p>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className={`p-6 ${results.meilleur === 'Franchise' ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Franchise en base</h3>
                  {results.meilleur === 'Franchise' && <CheckCircle className="text-emerald-600" size={24} />}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">CA encaissé</p>
                    <p className="font-bold text-lg">{currency(results.franchise.caTTC)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Charges TTC payées</p>
                    <p className="font-bold text-red-600">-{currency(results.franchise.chargesTTC)}</p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 uppercase font-bold">Trésorerie</p>
                    <p className="text-3xl font-black text-emerald-600">{currency(results.franchise.tresorerie)}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-800">{results.franchise.commentaire}</p>
                  </div>
                </div>
              </Card>

              <Card className={`p-6 ${results.meilleur === 'Réel' ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">Régime réel</h3>
                  {results.meilleur === 'Réel' && <CheckCircle className="text-emerald-600" size={24} />}
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500">TVA collectée</p>
                    <p className="font-bold text-red-600">{currency(results.reel.tvaCollectee)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">TVA déductible</p>
                    <p className="font-bold text-green-600">+{currency(results.reel.tvaDeductible)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">TVA à verser</p>
                    <p className="font-bold text-orange-600">-{currency(results.reel.tvaAVerser)}</p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 uppercase font-bold">Trésorerie</p>
                    <p className="text-3xl font-black text-emerald-600">{currency(results.reel.tresorerie)}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-blue-800">{results.reel.commentaire}</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calculator className="text-rose-600" size={24} />
                Impact prix (exemple 100€ HT)
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Franchise en base</p>
                  <p className="text-3xl font-black text-slate-900">{currency(results.simulateurPrix.franchise)}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {inputs.typeClient === 'B2B' ? 'Prix HT (B2B)' : 'Prix identique au HT (pas de TVA affichée)'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600 mb-2">Régime réel</p>
                  <p className="text-3xl font-black text-slate-900">{currency(results.simulateurPrix.reel)}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {inputs.typeClient === 'B2B' ? 'Prix HT (B2B récupère TVA)' : 'Prix TTC (+20%)'}
                  </p>
                </div>
              </div>
            </Card>

            {['franchise', 'reel'].map((key) => {
              const r = results[key as keyof typeof results] as any;
              return (
                <Card key={key} className="p-6 bg-white">
                  <h3 className="text-xl font-bold mb-4 capitalize">{key === 'franchise' ? 'Franchise en base' : 'Régime réel'} - Détails</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-emerald-600 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} />Avantages
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {r.avantages.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">✓</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-600 mb-3 flex items-center gap-2">
                        <AlertCircle size={18} />Inconvénients
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {r.inconvenients.map((i: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-red-600 mt-1">✗</span>
                            <span>{i}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card className="p-6 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-3">
                <Info className="text-amber-600 flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-amber-900 mb-3">Seuils franchise TVA 2026</h3>
                  <div className="text-sm text-amber-800 space-y-2">
                    <p><strong>Prestations de services :</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• Seuil de base : <strong>37 500€</strong></li>
                      <li>• Seuil majoré : <strong>41 400€</strong> (tolérance)</li>
                    </ul>
                    <p className="mt-3"><strong>Ventes de marchandises :</strong></p>
                    <ul className="ml-4 space-y-1">
                      <li>• Seuil de base : <strong>85 800€</strong></li>
                      <li>• Seuil majoré : <strong>94 300€</strong> (tolérance)</li>
                    </ul>
                    <p className="mt-3 text-xs italic">
                      ⚠️ En cas de dépassement du seuil majoré, passage obligatoire au régime réel dès le 1er jour du mois de dépassement.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}