'use client';
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home, FileText, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulateurImmobilier() {
  const [inputs, setInputs] = useState({
    prixAchat: 200000,
    travaux: 20000,
    loyerMensuel: 800,
    chargesAnnuelles: 1500,
    emprunt: 180000,
    tauxEmprunt: 3.5,
    dureeEmprunt: 20,
    tmi: 30,
  });

  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const results = useMemo(() => {
    const loyerAnnuel = inputs.loyerMensuel * 12;
    const mensualite = inputs.emprunt > 0 ? (inputs.emprunt * (inputs.tauxEmprunt / 100 / 12)) / (1 - Math.pow(1 + inputs.tauxEmprunt / 100 / 12, -inputs.dureeEmprunt * 12)) : 0;
    const chargesEmprunt = mensualite * 12;
    const interets = inputs.emprunt * (inputs.tauxEmprunt / 100);

    const amortMobilier = inputs.travaux * 0.10;
    const amortImmo = inputs.prixAchat * 0.02;
    const chargesLMNP = inputs.chargesAnnuelles + interets + amortMobilier + amortImmo;
    const resultatLMNP = Math.max(0, loyerAnnuel - chargesLMNP);
    const impotLMNP = resultatLMNP * (inputs.tmi / 100);
    const cashflowLMNP = loyerAnnuel - inputs.chargesAnnuelles - chargesEmprunt - impotLMNP;

    const abattementMicro = loyerAnnuel * 0.50;
    const resultatMicro = loyerAnnuel - abattementMicro;
    const impotMicro = resultatMicro * (inputs.tmi / 100);
    const cashflowMicro = loyerAnnuel - inputs.chargesAnnuelles - chargesEmprunt - impotMicro;

    const resultatSCI_IS = loyerAnnuel - inputs.chargesAnnuelles - interets - amortImmo;
    const isSCI = Math.max(0, resultatSCI_IS) * 0.15;
    const cashflowSCI_IS = loyerAnnuel - inputs.chargesAnnuelles - chargesEmprunt - isSCI;

    return {
      LMNP_REEL: { impot: impotLMNP, cashflow: cashflowLMNP },
      LMNP_MICRO: { impot: impotMicro, cashflow: cashflowMicro },
      SCI_IS: { impot: isSCI, cashflow: cashflowSCI_IS },
    };
  }, [inputs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 mb-6">
          <ArrowLeft size={20} />Retour
        </Link>

        <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur Immobilier</h1>
        <p className="text-xl text-slate-600 mb-12">LMNP • SCI IS/IR • Déficit Foncier</p>

        <div className="grid lg:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Home className="text-emerald-600" size={24} />Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Prix d'achat (€)</Label>
                <Input type="number" value={inputs.prixAchat as any} onChange={(e) => setInputs({...inputs, prixAchat: Number(e.target.value) || 0})} className="h-12 mt-2" />
              </div>
              <div>
                <Label>Travaux (€)</Label>
                <Input type="number" value={inputs.travaux as any} onChange={(e) => setInputs({...inputs, travaux: Number(e.target.value) || 0})} className="h-12 mt-2" />
              </div>
              <div>
                <Label>Loyer mensuel (€)</Label>
                <Input type="number" value={inputs.loyerMensuel as any} onChange={(e) => setInputs({...inputs, loyerMensuel: Number(e.target.value) || 0})} className="h-12 mt-2" />
              </div>
              <div>
                <Label>Charges annuelles (€)</Label>
                <Input type="number" value={inputs.chargesAnnuelles as any} onChange={(e) => setInputs({...inputs, chargesAnnuelles: Number(e.target.value) || 0})} className="h-12 mt-2" />
              </div>
              <div>
                <Label>Emprunt (€)</Label>
                <Input type="number" value={inputs.emprunt as any} onChange={(e) => setInputs({...inputs, emprunt: Number(e.target.value) || 0})} className="h-12 mt-2" />
              </div>
              <div>
                <Label>Taux (%)</Label>
                <Input type="number" step="0.1" value={inputs.tauxEmprunt as any} onChange={(e) => setInputs({...inputs, tauxEmprunt: Number(e.target.value) || 0})} className="h-12 mt-2" />
              </div>
              <div>
                <Label>Durée (années)</Label>
                <Input type="number" value={inputs.dureeEmprunt as any} onChange={(e) => setInputs({...inputs, dureeEmprunt: Number(e.target.value) || 0})} className="h-12 mt-2" />
              </div>
              <div>
                <Label>TMI (%)</Label>
                <Input type="number" value={inputs.tmi as any} onChange={(e) => setInputs({...inputs, tmi: Number(e.target.value) || 0})} className="h-12 mt-2" />
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Card className="p-6 bg-white">
              <h3 className="text-xl font-bold mb-4">Comparatif des régimes</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3">Régime</th>
                    <th className="text-right py-3">Impôt</th>
                    <th className="text-right py-3">Cashflow</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(results).map(([key, data]) => (
                    <tr key={key} className="border-b hover:bg-emerald-50">
                      <td className="py-3 font-semibold">{key.replace('_', ' ')}</td>
                      <td className="text-right text-red-600">{currency(data.impot)}</td>
                      <td className="text-right font-bold text-emerald-600">{currency(data.cashflow)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}