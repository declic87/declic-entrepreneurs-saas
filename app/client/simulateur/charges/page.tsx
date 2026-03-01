'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, FileText, FileSpreadsheet, ArrowLeft, Info, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export default function SimulateurCharges() {
  const [ca, setCA] = useState(50000);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const results = useMemo(() => {
    // MICRO-ENTREPRISE
    const microCotis = ca * 0.22;
    const microNet = ca - microCotis;
    const microRetraite = microCotis * 0.25;
    
    let microCommentaire = '';
    if (ca > 77700) {
      microCommentaire = '⚠️ CA au-dessus du plafond micro-entreprise (77 700€). Passage obligatoire à un autre régime.';
    } else if (ca < 30000) {
      microCommentaire = '✅ Régime micro adapté pour les petits CA. Simplicité administrative maximale.';
    } else {
      microCommentaire = '💡 Le micro reste intéressant mais pensez à comparer avec les sociétés si vos charges sont importantes.';
    }

    // SASU (Assimilé salarié)
    const sasuCotis = ca * 0.80;
    const sasuNet = ca - sasuCotis;
    const sasuRetraite = sasuCotis * 0.28;
    
    let sasuCommentaire = '';
    if (ca < 30000) {
      sasuCommentaire = '⚠️ Cotisations SASU très élevées (80%) sur petit CA. Peut être défavorable.';
    } else if (ca > 60000) {
      sasuCommentaire = '✅ Protection sociale maximale : maladie, retraite complète, AT/MP. Idéal pour sécurité.';
    } else {
      sasuCommentaire = '✅ Bonne protection mais cotisations élevées. Comparez avec EURL selon vos priorités.';
    }

    // EURL (TNS)
    const eurlCotis = ca * 0.45;
    const eurlNet = ca - eurlCotis;
    const eurlRetraite = eurlCotis * 0.35;
    
    let eurlCommentaire = '';
    if (ca > 50000) {
      eurlCommentaire = '✅ Bon compromis : cotisations modérées (45%) avec protection correcte. Meilleure retraite que SASU.';
    } else {
      eurlCommentaire = '💡 Moins cher que SASU mais protection sociale moins complète (pas d\'AT/MP, pas de chômage).';
    }

    // Meilleur régime
    const regimes = [
      { nom: 'Micro', net: microNet },
      { nom: 'SASU', net: sasuNet },
      { nom: 'EURL', net: eurlNet }
    ];
    const meilleur = regimes.reduce((best, curr) => curr.net > best.net ? curr : best);

    return {
      micro: {
        cotisations: microCotis,
        taux: 22,
        net: microNet,
        retraite: microRetraite,
        protection: 'SSI - Protection de base',
        couverture: {
          maladie: 'Basique',
          retraite: 'Faible',
          chomage: 'Non',
          atmp: 'Non'
        },
        commentaire: microCommentaire,
        avantages: [
          'Aucune comptabilité',
          'Déclaration ultra-simple',
          'Cotisations les plus faibles',
          'Pas de TVA'
        ],
        inconvenients: [
          'Plafond CA 77 700€',
          'Charges non déductibles',
          'Droits retraite limités',
          'Protection sociale minimale'
        ]
      },
      sasu: {
        cotisations: sasuCotis,
        taux: 80,
        net: sasuNet,
        retraite: sasuRetraite,
        protection: 'Régime général - Protection maximale',
        couverture: {
          maladie: 'Complète',
          retraite: 'Bonne',
          chomage: 'Non (dirigeant)',
          atmp: 'Oui'
        },
        commentaire: sasuCommentaire,
        avantages: [
          'Protection sociale maximale',
          'Maladie + retraite complète',
          'AT/MP inclus',
          'Crédibilité professionnelle'
        ],
        inconvenients: [
          'Cotisations très élevées (80%)',
          'Comptabilité obligatoire',
          'Coûts de gestion',
          'Formalisme important'
        ]
      },
      eurl: {
        cotisations: eurlCotis,
        taux: 45,
        net: eurlNet,
        retraite: eurlRetraite,
        protection: 'SSI - Protection intermédiaire',
        couverture: {
          maladie: 'Correcte',
          retraite: 'Meilleure que SASU',
          chomage: 'Non',
          atmp: 'Non'
        },
        commentaire: eurlCommentaire,
        avantages: [
          'Cotisations modérées (45%)',
          'Meilleure retraite que SASU',
          'Bonne protection maladie',
          'Moins cher que SASU'
        ],
        inconvenients: [
          'Pas d\'AT/MP',
          'Protection moins complète',
          'Comptabilité obligatoire',
          'SSI parfois critiqué'
        ]
      },
      meilleur: meilleur.nom
    };
  }, [ca]);

  async function exportToPDF() {
    setExportingPDF(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(20, 184, 166);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('CHARGES SOCIALES 2026', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Comparatif Micro • SASU • EURL', pageWidth / 2, 30, { align: 'center' });
      pdf.text(`${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' });

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMPARAISON', 20, 65);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`CA annuel : ${currency(ca)}`, 25, 75);

      let y = 90;
      ['micro', 'sasu', 'eurl'].forEach((key) => {
        const r = results[key as keyof typeof results] as any;
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(key.toUpperCase(), 25, y);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Taux : ${r.taux}%`, 25, y + 7);
        pdf.text(`Cotisations : ${currency(r.cotisations)}`, 25, y + 14);
        pdf.text(`Net : ${currency(r.net)}`, 25, y + 21);
        pdf.text(`Retraite/an : ${currency(r.retraite)}`, 25, y + 28);
        
        y += 40;
      });

      pdf.save(`charges-sociales-${Date.now()}.pdf`);
    } finally {
      setExportingPDF(false);
    }
  }

  function exportToExcel() {
    setExportingExcel(true);
    try {
      const wb = XLSX.utils.book_new();
      const data = [
        ['CHARGES SOCIALES 2026', ''],
        ['CA annuel', ca],
        ['', ''],
        ['Régime', 'Taux', 'Cotisations', 'Net', 'Retraite/an'],
        ['Micro', results.micro.taux + '%', results.micro.cotisations, results.micro.net, results.micro.retraite],
        ['SASU', results.sasu.taux + '%', results.sasu.cotisations, results.sasu.net, results.sasu.retraite],
        ['EURL', results.eurl.taux + '%', results.eurl.cotisations, results.eurl.net, results.eurl.retraite],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Comparatif');
      XLSX.writeFile(wb, `charges-sociales-${Date.now()}.xlsx`);
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 p-8">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Nunito', sans-serif; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 mb-6 font-medium">
          <ArrowLeft size={20} />Retour
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-black text-slate-900 mb-3">Charges Sociales</h1>
          <p className="text-xl text-slate-600">Comparatif Micro • SASU • EURL • Taux 2026</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-white shadow-xl sticky top-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="text-teal-600" size={24} />CA
            </h3>
            <div>
              <Label className="mb-2 block">CA annuel (€)</Label>
              <Input type="number" value={ca as any} onChange={(e) => setCA(Number(e.target.value) || 0)} className="h-12 text-lg font-bold" />
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

          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
              <h3 className="text-2xl font-bold mb-2">Régime recommandé</h3>
              <p className="text-3xl font-black">{results.meilleur}</p>
              <p className="text-teal-100 mt-2">Meilleur net disponible pour votre CA</p>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
              {(['micro', 'sasu', 'eurl'] as const).map((key) => {
                const r = results[key];
                return (
                  <Card 
                    key={key} 
                    className={`p-6 ${results.meilleur.toLowerCase() === key ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">{key.toUpperCase()}</h3>
                      {results.meilleur.toLowerCase() === key && (
                        <CheckCircle className="text-emerald-600" size={24} />
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-slate-500">Taux cotisations</p>
                        <p className="text-3xl font-black text-slate-900">{r.taux}%</p>
                      </div>
                      
                      <div>
                        <p className="text-xs text-slate-500">Cotisations</p>
                        <p className="font-bold text-red-600 text-lg">-{currency(r.cotisations)}</p>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <p className="text-xs text-slate-500 uppercase font-bold">Net disponible</p>
                        <p className="text-3xl font-black text-emerald-600">{currency(r.net)}</p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Droits retraite/an</p>
                        <p className="font-bold text-purple-600">{currency(r.retraite)}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-blue-800">{r.commentaire}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Protection sociale détaillée</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-2">Garantie</th>
                      <th className="text-center py-3 px-2">Micro</th>
                      <th className="text-center py-3 px-2">SASU</th>
                      <th className="text-center py-3 px-2">EURL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { garantie: 'Maladie', micro: 'Basique', sasu: 'Complète', eurl: 'Correcte' },
                      { garantie: 'Retraite base', micro: 'Faible', sasu: 'Bonne', eurl: 'Meilleure' },
                      { garantie: 'Retraite complémentaire', micro: 'Non', sasu: 'AGIRC-ARRCO', eurl: 'RCI' },
                      { garantie: 'Chômage', micro: 'Non', sasu: 'Non', eurl: 'Non' },
                      { garantie: 'AT/MP', micro: 'Non', sasu: 'Oui', eurl: 'Non' },
                      { garantie: 'Formation', micro: 'Oui', sasu: 'Oui', eurl: 'Oui' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-2 font-semibold">{row.garantie}</td>
                        <td className="text-center py-3 px-2">{row.micro}</td>
                        <td className="text-center py-3 px-2">{row.sasu}</td>
                        <td className="text-center py-3 px-2">{row.eurl}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {(['micro', 'sasu', 'eurl'] as const).map((key) => {
              const r = results[key];
              return (
                <Card key={key} className="p-6 bg-white">
                  <h3 className="text-xl font-bold mb-4">{key.toUpperCase()} - Détails</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-emerald-600 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} />Avantages
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {r.avantages.map((a, i) => (
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
                        {r.inconvenients.map((i, idx) => (
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

            <Card className="p-6 bg-slate-100">
              <div className="flex items-start gap-3">
                <Info className="text-slate-500 flex-shrink-0" size={20} />
                <div className="text-xs text-slate-600">
                  <p className="font-bold mb-2">Méthodologie 2026 :</p>
                  <ul className="space-y-1">
                    <li>• <strong>Micro :</strong> 22% du CA (SSI)</li>
                    <li>• <strong>SASU :</strong> 80% du brut (charges patronales + salariales)</li>
                    <li>• <strong>EURL :</strong> 45% du bénéfice (SSI - TNS)</li>
                    <li>• <strong>AT/MP :</strong> Accidents du travail / Maladies professionnelles</li>
                    <li>• <strong>SSI :</strong> Sécurité Sociale des Indépendants</li>
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