"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowLeft, Calculator, AlertCircle, Calendar, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default function SimuRetraitePage() {
  const [ca, setCa] = useState(80000);
  const [remuneration, setRemuneration] = useState(30000);
  const [activite, setActivite] = useState("BNC");
  const [age, setAge] = useState(35);
  const [trimValides, setTrimValides] = useState(40);
  const [computed, setComputed] = useState(false);

  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const currency = (n: number) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  // Constantes Légales 2026
  const SMIC_HORAIRE = 12.02; // Décret 2025-1228
  const SEUIL_1TRIM = Math.round(SMIC_HORAIRE * 150);
  const SEUIL_4TRIM = Math.round(SMIC_HORAIRE * 600);
  const AGE_RETRAITE = 64;
  const TRIM_REQUIS = 172;

  const abattements: Record<string, number> = { BNC: 0.34, BIC_SERVICES: 0.50, BIC_VENTES: 0.71 };

  const calculation = useMemo(() => {
    const abt = abattements[activite] || 0.34;
    const microRevenu = Math.round(ca * (1 - abt));
    
    const getTrim = (val: number) => Math.min(4, Math.floor(val / SEUIL_1TRIM));

    const microTrim = getTrim(microRevenu);
    const sasuBrut = Math.round(remuneration / 0.75);
    const sasuTrim = getTrim(sasuBrut);
    const eurlTrim = getTrim(remuneration);
    
    const anneesRestantes = Math.max(0, AGE_RETRAITE - age);

    // Points AGIRC-ARRCO (SASU)
    const prixAchat = 19.6321;
    const valeurPoint = 1.4159;
    const pointsAnnuels = Math.round((sasuBrut * 0.0648) / prixAchat);
    const retraiteComplAnnuelle = Math.round(pointsAnnuels * anneesRestantes * valeurPoint);

    return {
      microRevenu,
      microTrim,
      sasuBrut,
      sasuTrim,
      eurlTrim,
      anneesRestantes,
      pointsAnnuels,
      retraiteComplAnnuelle,
      totals: {
        micro: trimValides + (microTrim * anneesRestantes),
        sasuIS: trimValides + (sasuTrim * anneesRestantes),
        sasuIR: trimValides, // 0 trim / an
        eurl: trimValides + (eurlTrim * anneesRestantes)
      }
    };
  }, [ca, remuneration, activite, age, trimValides]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/client/simulateur" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Simulateur Retraite 2026</h1>
          <p className="text-gray-500 mt-1 font-medium italic underline decoration-blue-300">Validation de trimestres & Projection</p>
        </div>
      </div>

      <Card className="border-t-4 border-t-blue-600 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">CA Annuel (Micro)</label>
              <input type="number" value={ca} onChange={(e) => setCa(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Activité</label>
              <select value={activite} onChange={(e) => setActivite(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                <option value="BNC">BNC (Prestation)</option>
                <option value="BIC_SERVICES">BIC Services</option>
                <option value="BIC_VENTES">BIC Ventes</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Rémunération (Société)</label>
              <input type="number" value={remuneration} onChange={(e) => setRemuneration(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Âge Actuel</label>
              <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Trimestres acquis</label>
              <input type="number" value={trimValides} onChange={(e) => setTrimValides(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>
          <Button className="mt-6 w-full md:w-auto bg-blue-600 hover:bg-blue-700 font-bold gap-2 shadow-lg shadow-blue-100" onClick={() => setComputed(true)}>
            <Calculator size={18} /> Calculer ma projection
          </Button>
        </CardContent>
      </Card>

      {computed && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Section Seuils */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map((t) => (
               <div key={t} className={`p-4 rounded-xl border-2 ${t === 4 ? "border-emerald-500 bg-emerald-50" : "border-gray-100 bg-white"}`}>
                 <p className="text-[10px] font-bold text-gray-400 uppercase">{t} Trimestre{t > 1 ? 's' : ''}</p>
                 <p className={`text-xl font-black ${t === 4 ? "text-emerald-700" : "text-gray-700"}`}>{fmt(SEUIL_1TRIM * t)} €</p>
                 <p className="text-[10px] text-gray-400 italic">Revenu minimum requis</p>
               </div>
             ))}
          </div>

          {/* Comparatif par Statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatutCard title="Micro-Entrepreneur" trim={calculation.microTrim} info={`Revenu après abt: ${fmt(calculation.microRevenu)}€`} color="blue" />
            <StatutCard title="SASU (IS / Salaire)" trim={calculation.sasuTrim} info={`Salaire Brut: ${fmt(calculation.sasuBrut)}€`} color="orange" />
            <StatutCard title="SASU (IR / Dividendes)" trim={0} info="0€ de cotisations sociales" color="red" warning />
            <StatutCard title="EURL (TNS / IS)" trim={calculation.eurlTrim} info={`Rémunération: ${fmt(remuneration)}€`} color="purple" />
          </div>

          {/* Tableau de Projection */}
          <Card className="overflow-hidden shadow-md">
            <div className="bg-slate-900 p-4">
              <h2 className="text-white font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                <Calendar size={18} className="text-blue-400" /> Projection à 64 ans ({calculation.anneesRestantes} ans restants)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b text-[10px] font-bold text-gray-500 uppercase">
                    <th className="p-4 text-left">Statut envisagé</th>
                    <th className="p-4 text-center">Trim. / an</th>
                    <th className="p-4 text-center">Total à 64 ans</th>
                    <th className="p-4 text-right">Éligibilité Taux Plein</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(calculation.totals).map(([key, total]) => (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700 capitalize">{key.replace('sasuIS', 'SASU (Salarié)').replace('sasuIR', 'SASU (IR/Dividendes)').replace('eurl', 'EURL (Gérant)')}</td>
                      <td className="p-4 text-center font-medium">
                        {key === 'sasuIR' ? 0 : key === 'micro' ? calculation.microTrim : key === 'eurl' ? calculation.eurlTrim : calculation.sasuTrim}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-black ${total >= TRIM_REQUIS ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {total} / {TRIM_REQUIS}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {total >= TRIM_REQUIS ? 
                          <span className="text-emerald-600 flex items-center justify-end gap-1 font-bold"><ShieldCheck size={16}/> Validé</span> : 
                          <span className="text-red-500 font-medium">-{TRIM_REQUIS - total} trimestres</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Focus Retraite Complémentaire */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-orange-500" /> Focus Retraite Complémentaire (SASU)
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-[10px] text-orange-600 font-bold uppercase">Points / an (Agirc-Arrco)</p>
                    <p className="text-xl font-black text-orange-700">{calculation.pointsAnnuels}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Estimation Pension</p>
                    <p className="text-xl font-black text-emerald-700">{fmt(Math.round(calculation.retraiteComplAnnuelle / 12))} € / mois</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed italic">
                  * Basé sur une valeur de point 2026 de 1.4159€. En Micro et EURL, la complémentaire dépend de votre caisse (CIPAV/RCI) et n'est pas calculée ici.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <div className="space-y-2">
                    <p className="font-bold text-amber-800 text-sm">Alerte SASU IR</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      En SASU à l'IR, sans salaire, vous ne validez <strong>aucun trimestre</strong>. 
                      Pour obtenir vos 4 trimestres, vous devez vous verser un salaire brut d'au moins <strong>{fmt(SEUIL_4TRIM)} €</strong> par an.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
            Sources : CSS art. R351-9 (150h SMIC) | Décret 2025-1228 | Réforme 2023 (64 ans / 172 trim.)
          </p>
        </div>
      )}
    </div>
  );
}

function StatutCard({ title, trim, info, color, warning = false }: any) {
  const colorMap: any = {
    blue: "text-blue-600 border-blue-100",
    orange: "text-orange-600 border-orange-100",
    red: "text-red-600 border-red-100",
    purple: "text-purple-600 border-purple-100"
  };

  return (
    <Card className={`border-2 ${colorMap[color]} shadow-sm`}>
      <CardContent className="p-5 text-center">
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">{title}</p>
        <p className={`text-4xl font-black ${warning ? "text-red-500" : ""}`}>{trim}</p>
        <p className="text-[10px] font-medium text-gray-500">trimestres / an</p>
        <div className="mt-3 pt-3 border-t border-gray-50">
          <p className="text-[10px] text-gray-400 font-medium italic">{info}</p>
        </div>
      </CardContent>
    </Card>
  );
}