'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulateurACRE() {
  const [ca, setCA] = useState(40000);
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const annees = [
    { annee: 1, taux: 0.11, cotis: ca * 0.11, exo: ca * (0.22 - 0.11) },
    { annee: 2, taux: 0.22, cotis: ca * 0.22, exo: 0 },
    { annee: 3, taux: 0.22, cotis: ca * 0.22, exo: 0 },
    { annee: 4, taux: 0.22, cotis: ca * 0.22, exo: 0 },
  ];

  const economieTotal = annees[0].exo;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 mb-6"><ArrowLeft size={20} />Retour</Link>
        <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur ACRE</h1>
        <p className="text-xl text-slate-600 mb-12">Exonération 50% année 1</p>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Rocket className="text-green-600" size={24} />Config</h3>
            <div><Label>CA annuel (€)</Label><Input type="number" value={ca as any} onChange={(e) => setCA(Number(e.target.value) || 0)} className="h-12 mt-2" /></div>
            <Card className="p-4 bg-green-50 border-green-200 mt-6">
              <p className="text-xs text-green-700 mb-1">Économie ACRE</p>
              <p className="text-3xl font-black text-green-900">{currency(economieTotal)}</p>
            </Card>
          </Card>

          <Card className="md:col-span-2 p-6 bg-white">
            <h3 className="text-xl font-bold mb-4">Projection 4 ans</h3>
            <table className="w-full">
              <thead><tr className="border-b-2"><th className="text-left py-3">Année</th><th className="text-right py-3">Taux</th><th className="text-right py-3">Cotisations</th><th className="text-right py-3">Exonération</th></tr></thead>
              <tbody>
                {annees.map(a => (
                  <tr key={a.annee} className={`border-b ${a.annee === 1 ? 'bg-green-50 font-bold' : ''}`}>
                    <td className="py-3">Année {a.annee}</td>
                    <td className="text-right">{(a.taux * 100).toFixed(0)}%</td>
                    <td className="text-right text-orange-600">{currency(a.cotis)}</td>
                    <td className="text-right text-green-600 font-bold">{a.exo > 0 ? currency(a.exo) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}