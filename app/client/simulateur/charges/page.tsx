'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SimulateurCharges() {
  const [ca, setCA] = useState(50000);
  const currency = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const micro = { cotis: ca * 0.22, net: ca * 0.78, taux: 22 };
  const sasu = { cotis: ca * 0.80, net: ca * 0.20, taux: 80 };
  const eurl = { cotis: ca * 0.45, net: ca * 0.55, taux: 45 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/client/simulateur" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-800 mb-6"><ArrowLeft size={20} />Retour</Link>
        <h1 className="text-5xl font-black text-slate-900 mb-3">Charges Sociales</h1>
        <p className="text-xl text-slate-600 mb-12">Comparatif Micro • SASU • EURL</p>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 bg-white shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield className="text-teal-600" size={24} />CA</h3>
            <div><Label>CA annuel (€)</Label><Input type="number" value={ca as any} onChange={(e) => setCA(Number(e.target.value) || 0)} className="h-12 mt-2" /></div>
          </Card>

          {[
            { nom: 'Micro', data: micro, color: 'blue' },
            { nom: 'SASU', data: sasu, color: 'green' },
            { nom: 'EURL', data: eurl, color: 'purple' }
          ].map(r => (
            <Card key={r.nom} className={`p-6 bg-${r.color}-50 border-${r.color}-200`}>
              <h3 className={`text-lg font-bold mb-4 text-${r.color}-900`}>{r.nom}</h3>
              <div className="space-y-3">
                <div><p className="text-xs text-slate-500">Taux cotisations</p><p className="text-2xl font-black">{r.data.taux}%</p></div>
                <div><p className="text-xs text-slate-500">Cotisations</p><p className="font-bold text-red-600">{currency(r.data.cotis)}</p></div>
                <div className="pt-3 border-t"><p className="text-xs text-slate-500">Net disponible</p><p className="text-3xl font-black text-emerald-600">{currency(r.data.net)}</p></div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6 bg-white mt-8">
          <h3 className="text-xl font-bold mb-4">Protection sociale</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b-2"><th className="text-left py-3">Garantie</th><th className="text-center py-3">Micro</th><th className="text-center py-3">SASU</th><th className="text-center py-3">EURL</th></tr></thead>
            <tbody>
              {[
                ['Maladie', '✅', '✅✅', '✅'],
                ['Retraite', '⚠️', '✅✅', '✅'],
                ['Chômage', '❌', '❌', '❌'],
                ['AT/MP', '❌', '✅', '❌'],
              ].map(([g, m, s, e]) => (
                <tr key={g} className="border-b"><td className="py-3">{g}</td><td className="text-center">{m}</td><td className="text-center">{s}</td><td className="text-center">{e}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}