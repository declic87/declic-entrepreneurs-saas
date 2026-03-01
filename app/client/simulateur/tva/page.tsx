'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Receipt, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulateurTVA() {
  const [inputs, setInputs] = useState({ caHT: 80000, chargesHT: 20000, typeClient: 'B2B' as 'B2B' | 'B2C' });
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const franchise = { caTTC: inputs.caHT, chargesTTC: inputs.chargesHT * 1.20, marge: inputs.caHT - inputs.chargesHT * 1.20 };
  const reel = { caTTC: inputs.caHT * 1.20, tvaCollectee: inputs.caHT * 0.20, tvaDeductible: inputs.chargesHT * 0.20, tvaAVerser: inputs.caHT * 0.20 - inputs.chargesHT * 0.20, chargesTTC: inputs.chargesHT * 1.20, marge: inputs.caHT * 1.20 - inputs.chargesHT * 1.20 - (inputs.caHT * 0.20 - inputs.chargesHT * 0.20) };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-800 mb-6"><ArrowLeft size={20} />Retour</Link>
        <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur TVA</h1>
        <p className="text-xl text-slate-600 mb-12">Franchise vs Régime réel</p>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Receipt className="text-rose-600" size={24} />Config</h3>
            <div className="space-y-5">
              <div><Label>CA HT (€)</Label><Input type="number" value={inputs.caHT as any} onChange={(e) => setInputs({...inputs, caHT: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
              <div><Label>Charges HT (€)</Label><Input type="number" value={inputs.chargesHT as any} onChange={(e) => setInputs({...inputs, chargesHT: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
              <div><Label>Type client</Label>
                <select value={inputs.typeClient} onChange={(e) => setInputs({...inputs, typeClient: e.target.value as any})} className="w-full h-12 px-3 rounded-md border mt-2">
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <h3 className="text-lg font-bold mb-4">Franchise TVA</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-slate-500">CA TTC</p><p className="font-bold">{currency(franchise.caTTC)}</p></div>
              <div><p className="text-xs text-slate-500">Charges TTC</p><p className="font-bold text-red-600">{currency(franchise.chargesTTC)}</p></div>
              <div className="pt-3 border-t"><p className="text-xs text-slate-500">Marge nette</p><p className="text-3xl font-black text-emerald-600">{currency(franchise.marge)}</p></div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 ring-2 ring-emerald-400">
            <h3 className="text-lg font-bold mb-4">Régime Réel</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-emerald-700">TVA collectée</p><p className="font-bold">{currency(reel.tvaCollectee)}</p></div>
              <div><p className="text-xs text-emerald-700">TVA déductible</p><p className="font-bold text-green-600">{currency(reel.tvaDeductible)}</p></div>
              <div><p className="text-xs text-emerald-700">TVA à verser</p><p className="font-bold text-red-600">{currency(reel.tvaAVerser)}</p></div>
              <div className="pt-3 border-t border-emerald-200"><p className="text-xs text-emerald-700">Marge nette</p><p className="text-3xl font-black text-emerald-900">{currency(reel.marge)}</p></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}