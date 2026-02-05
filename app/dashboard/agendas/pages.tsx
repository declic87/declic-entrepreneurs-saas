"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AgendaPage() {
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRdvs = async () => {
      // ACTION : On récupère les RDV avec le nom du client ET de l'expert
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
        .limit(100); // Sécurité : on ne charge pas 10 000 lignes d'un coup

      if (!error) setRdvs(data || []);
      setLoading(false);
    };

    fetchRdvs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Agenda des rendez-vous</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Client</th>
            <th className="p-2 border">Expert</th>
          </tr>
        </thead>
        <tbody>
          {rdvs.map((rdv: any) => (
            <tr key={rdv.id}>
              <td className="p-2 border">{new Date(rdv.date).toLocaleString()}</td>
              <td className="p-2 border">{rdv.client?.user?.name || "Inconnu"}</td>
              <td className="p-2 border">{rdv.expert?.user?.name || "Non assigné"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}