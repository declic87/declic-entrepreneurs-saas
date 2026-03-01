'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulateurRetraite() {
  const [inputs, setInputs] = useState({ salaireBrut: 30000, anneeNaissance: 1990 });
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const SMIC_ANNUEL = 21203;
  const trimValidesAnnee = Math.min(4, Math.floor(inputs.salaireBrut / (SMIC_ANNUEL * 0.25)));
  const ageDepart = 64;
  const trimNecessaires = 172;
  const anneesNecessaires = Math.ceil(trimNecessaires / 4);
  const ageRetraite = inputs.anneeNaissance + ageDepart;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6"><ArrowLeft size={20} />Retour</Link>
        <h1 className="text-5xl font-black text-slate-900 mb-3">Simulateur Retraite</h1>
        <p className="text-xl text-slate-600 mb-12">Validation trimestres</p>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="text-indigo-600" size={24} />Config</h3>
            <div className="space-y-5">
              <div><Label>Salaire brut annuel (€)</Label><Input type="number" value={inputs.salaireBrut as any} onChange={(e) => setInputs({...inputs, salaireBrut: Number(e.target.value) || 0})} className="h-12 mt-2" /></div>
              <div><Label>Année de naissance</Label><Input type="number" value={inputs.anneeNaissance as any} onChange={(e) => setInputs({...inputs, anneeNaissance: Number(e.target.value) || 1990})} className="h-12 mt-2" /></div>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-indigo-600 to-blue-600 text-white">
              <p className="text-sm text-indigo-100 mb-2">Trimestres validés/an</p>
              <p className="text-6xl font-black">{trimValidesAnnee}</p>
            </Card>

            <Card className="p-6 bg-white">
              <h3 className="text-lg font-bold mb-4">Informations</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-slate-50 rounded"><span>Âge départ</span><span className="font-bold">{ageDepart} ans</span></div>
                <div className="flex justify-between p-3 bg-slate-50 rounded"><span>Trimestres requis</span><span className="font-bold">{trimNecessaires}</span></div>
                <div className="flex justify-between p-3 bg-slate-50 rounded"><span>Années nécessaires</span><span className="font-bold">{anneesNecessaires} ans</span></div>
                <div className="flex justify-between p-3 bg-indigo-50 rounded"><span>Départ en retraite</span><span className="font-bold text-indigo-900">{ageRetraite}</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}