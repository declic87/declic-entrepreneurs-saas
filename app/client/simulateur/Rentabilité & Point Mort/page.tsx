'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulateurRentabilite() {
  const [inputs, setInputs] = useState({ chargesFixes: 3000, tauxMarge: 60, objectifSalaire: 2500 });
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const pointMort = inputs.chargesFixes / (inputs.tauxMarge / 100);
  const caObjectif = (inputs.chargesFixes + inputs.objectifSalaire) / (inputs.tauxMarge / 100);
  const margeContribution = caObjectif * (inputs.tauxMarge / 100);
  const resultatObjectif = margeContribution - inputs.chargesFixes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 mb-6"><ArrowLeft size={20} />Retour</Link>
        <h1 className="text-5xl font-black text-slate-900 mb-3">Point Mort & Rentabilité</h1>
        <p className="text-xl text-slate-600 mb-12">Seuil de rentabilité</p>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Target className="text-orange-600" size={24} />Config</h3>
            <div className="space-y-5">
              <div><Label>Charges fixes mensuelles (€)</Label><Input type="number" value={inputs.chargesFixes as any} onChange={(e) => setInputs({...inputs, chargesFixes: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
              <div><Label>Taux de marge (%)</Label><Input type="number" value={inputs.tauxMarge as any} onChange={(e) => setInputs({...inputs, tauxMarge: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
              <div><Label>Objectif salaire mensuel (€)</Label><Input type="number" value={inputs.objectifSalaire as any} onChange={(e) => setInputs({...inputs, objectifSalaire: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-orange-600 to-red-600 text-white">
              <p className="text-sm text-orange-100 mb-2">Point mort mensuel</p>
              <p className="text-5xl font-black mb-2">{currency(pointMort)}</p>
              <p className="text-orange-100 text-sm">CA minimum pour couvrir les charges</p>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold mb-4">Pour atteindre votre objectif</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-50 rounded"><span>CA objectif mensuel</span><span className="font-bold text-2xl">{currency(caObjectif)}</span></div>
                <div className="flex justify-between p-3 bg-slate-50 rounded"><span>Marge contributive</span><span className="font-bold text-emerald-600">{currency(margeContribution)}</span></div>
                <div className="flex justify-between p-3 bg-slate-50 rounded"><span>Charges fixes</span><span className="font-bold text-red-600">-{currency(inputs.chargesFixes)}</span></div>
                <div className="flex justify-between p-3 bg-orange-50 rounded border border-orange-200"><span>Disponible pour salaire</span><span className="font-bold text-orange-900 text-2xl">{currency(resultatObjectif)}</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}