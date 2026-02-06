"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function AgendaPage() {
  // 1. Initialisation du client Supabase
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [rdvs, setRdvs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRdvs = async () => {
      // On utilise le client 'supabase' défini juste au-dessus
      const { data, error } = await supabase
        .from("rdvs")
        .select(`
          id, 
          date, 
          status,
          client:clientId(user:userId(name)),
          expert:expertId(user:userId(name))
        `)
        .order("date", { ascending: true })
        .limit(100);

      if (!error) {
        setRdvs(data || []);
      } else {
        console.error("Erreur Supabase:", error);
      }
      setLoading(false);
    };

    fetchRdvs();
  }, [supabase]); // Ajout de supabase ici pour la cohérence

  if (loading) {
    return <div className="p-6">Chargement de l'agenda...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 uppercase italic">Agenda des rendez-vous</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-slate-900 text-white text-left">
              <th className="p-3 text-xs uppercase font-black">Date</th>
              <th className="p-3 text-xs uppercase font-black">Client</th>
              <th className="p-3 text-xs uppercase font-black">Expert</th>
            </tr>
          </thead>
          <tbody>
            {rdvs.map((rdv: any) => (
              <tr key={rdv.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-3 text-sm font-medium">
                  {new Date(rdv.date).toLocaleString('fr-FR')}
                </td>
                <td className="p-3 text-sm font-bold text-orange-600">
                  {rdv.client?.user?.name || "Inconnu"}
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {rdv.expert?.user?.name || "Non assigné"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {rdvs.length === 0 && (
          <div className="p-10 text-center text-gray-400 italic">
            Aucun rendez-vous trouvé.
          </div>
        )}
      </div>
    </div>
  );
}