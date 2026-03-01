'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulateurDividendes() {
  const [inputs, setInputs] = useState({ dividendes: 50000, tmi: 30, nbParts: 1 });
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const pfu = inputs.dividendes * 0.30;
  const netPFU = inputs.dividendes - pfu;

  const abattement40 = inputs.dividendes * 0.40;
  const baseBareme = inputs.dividendes - abattement40;
  const qf = baseBareme / inputs.nbParts;
  let irBareme = 0;
  if (qf <= 11294) irBareme = 0;
  else if (qf <= 28797) irBareme = (qf - 11294) * 0.11;
  else if (qf <= 82341) irBareme = (28797 - 11294) * 0.11 + (qf - 28797) * 0.30;
  else if (qf <= 177106) irBareme = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (qf - 82341) * 0.41;
  else irBareme = (28797 - 11294) * 0.11 + (82341 - 28797) * 0.30 + (177106 - 82341) * 0.41 + (qf - 177106) * 0.45;
  irBareme = Math.round(irBareme * inputs.nbParts);
  const ps = inputs.dividendes * 0.172;
  const totalBareme = irBareme + ps;
  const netBareme = inputs.dividendes - totalBareme;

  const meilleur = netPFU > netBareme ? 'PFU' : 'Barème';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-6">
          <ArrowLeft size={20} />Retour
        </Link>
        <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur Dividendes</h1>
        <p className="text-xl text-slate-600 mb-12">PFU 30% vs Barème progressif</p>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><TrendingUp className="text-purple-600" size={24} />Configuration</h3>
            <div className="space-y-5">
              <div><Label>Dividendes bruts (€)</Label><Input type="number" value={inputs.dividendes as any} onChange={(e) => setInputs({...inputs, dividendes: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
              <div><Label>TMI (%)</Label><Input type="number" value={inputs.tmi as any} onChange={(e) => setInputs({...inputs, tmi: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
              <div><Label>Parts fiscales</Label><Input type="number" step="0.5" value={inputs.nbParts as any} onChange={(e) => setInputs({...inputs, nbParts: Number(e.target.value) || 1})} className="h-12 mt-2" /></div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className={`p-6 ${meilleur === 'PFU' ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">PFU (Flat Tax 30%)</h3>
                {meilleur === 'PFU' && <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">OPTIMAL</span>}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span>Prélèvement 30%</span><span className="font-bold text-red-600">{currency(pfu)}</span></div>
                <div className="pt-3 border-t"><span className="text-sm text-slate-500">Net perçu</span><p className="text-3xl font-black text-emerald-600">{currency(netPFU)}</p></div>
              </div>
            </Card>

            <Card className={`p-6 ${meilleur === 'Barème' ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Barème progressif</h3>
                {meilleur === 'Barème' && <span className="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full">OPTIMAL</span>}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span>IR (après abattement 40%)</span><span className="font-bold text-red-600">{currency(irBareme)}</span></div>
                <div className="flex justify-between"><span>PS 17.2%</span><span className="font-bold text-red-600">{currency(ps)}</span></div>
                <div className="pt-3 border-t"><span className="text-sm text-slate-500">Net perçu</span><p className="text-3xl font-black text-emerald-600">{currency(netBareme)}</p></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}