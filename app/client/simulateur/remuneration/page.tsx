'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulateurRemuneration() {
  const [inputs, setInputs] = useState({ benefice: 80000, pctSalaire: 60 });
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const scenarios = [0, 20, 40, 60, 80, 100].map(pct => {
    const salaireBrut = inputs.benefice * (pct / 100);
    const tresorerie = inputs.benefice * ((100 - pct) / 100);
    const cotisations = salaireBrut * 0.80;
    const salaireNet = salaireBrut - cotisations;
    return { pct, salaireBrut, salaireNet, tresorerie, cotisations };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6">
          <ArrowLeft size={20} />Retour
        </Link>
        <h1 className="text-5xl font-black text-slate-900 mb-3">Rémunération Dirigeant</h1>
        <p className="text-xl text-slate-600 mb-12">Optimisation salaire / trésorerie</p>

        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Wallet className="text-orange-600" size={24} />Config</h3>
            <div className="space-y-5">
              <div><Label>Bénéfice (€)</Label><Input type="number" value={inputs.benefice as any} onChange={(e) => setInputs({...inputs, benefice: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
              <div><Label>% Salaire: {inputs.pctSalaire}%</Label><Input type="range" min="0" max="100" step="20" value={inputs.pctSalaire as any} onChange={(e) => setInputs({...inputs, pctSalaire: Number(e.target.value)})} className="w-full mt-2" /></div>
            </div>
          </Card>

          {scenarios.slice(0, 3).map(s => (
            <Card key={s.pct} className={`p-6 ${s.pct === inputs.pctSalaire ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 ring-2 ring-orange-400' : 'bg-white'}`}>
              <h3 className="font-bold text-lg mb-4">{s.pct}% Salaire</h3>
              <div className="space-y-3 text-sm">
                <div><p className="text-slate-500">Salaire brut</p><p className="font-bold">{currency(s.salaireBrut)}</p></div>
                <div><p className="text-slate-500">Cotisations</p><p className="font-bold text-red-600">-{currency(s.cotisations)}</p></div>
                <div><p className="text-slate-500">Salaire net</p><p className="font-bold text-emerald-600">{currency(s.salaireNet)}</p></div>
                <div><p className="text-slate-500">Trésorerie</p><p className="font-bold text-blue-600">{currency(s.tresorerie)}</p></div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-white">
          <h3 className="text-xl font-bold mb-4">Comparatif 6 scénarios</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b-2"><th className="text-left py-3">Scénario</th><th className="text-right py-3">Cotisations</th><th className="text-right py-3">Salaire net</th><th className="text-right py-3">Trésorerie</th></tr></thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.pct} className={`border-b hover:bg-orange-50 ${s.pct === inputs.pctSalaire ? 'bg-orange-50 font-bold' : ''}`}>
                  <td className="py-3">{s.pct}% Salaire</td>
                  <td className="text-right text-red-600">{currency(s.cotisations)}</td>
                  <td className="text-right text-emerald-600">{currency(s.salaireNet)}</td>
                  <td className="text-right text-blue-600">{currency(s.tresorerie)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}