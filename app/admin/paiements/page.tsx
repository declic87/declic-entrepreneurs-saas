"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, CheckCircle, Clock, XCircle, RefreshCw, 
  TrendingUp, FileSpreadsheet, FileText, Calendar
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// --- Types ---
interface Payment {
  id: string;
  clientId: string;
  amount: number;
  status: string;
  description: string;
  dueDate: string;
  paidAt: string;
  createdAt: string;
  client?: { userId: string; user?: { name: string; email: string } };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PAID: { label: "Payé", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  FAILED: { label: "Échoué", color: "bg-red-100 text-red-700", icon: XCircle },
  REFUNDED: { label: "Remboursé", color: "bg-purple-100 text-purple-700", icon: RefreshCw },
};

export default function PaiementsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États des Filtres
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [period, setPeriod] = useState("THIS_MONTH");

  useEffect(() => {
    async function fetchPayments() {
      const { data } = await supabase
        .from("payments")
        .select("*, client:clientId(userId, user:userId(name, email))")
        .order("createdAt", { ascending: false });

      if (data) setPayments(data);
      setLoading(false);
    }
    fetchPayments();
  }, [supabase]);

  // --- Logique de Filtrage (Recherche + Statut + Période) ---
  const filtered = useMemo(() => {
    const now = new Date();
    return payments.filter((p) => {
      const matchSearch = search === "" || 
        p.client?.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      
      const matchStatus = filterStatus === "ALL" || p.status === filterStatus;

      // Filtre Période
      const dateToCompare = p.paidAt ? new Date(p.paidAt) : new Date(p.createdAt);
      let matchPeriod = true;

      if (period === "THIS_MONTH") {
        matchPeriod = dateToCompare.getMonth() === now.getMonth() && dateToCompare.getFullYear() === now.getFullYear();
      } else if (period === "LAST_30_DAYS") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        matchPeriod = dateToCompare >= thirtyDaysAgo;
      } else if (period === "THIS_YEAR") {
        matchPeriod = dateToCompare.getFullYear() === now.getFullYear();
      }

      return matchSearch && matchStatus && matchPeriod;
    });
  }, [payments, search, filterStatus, period]);

  // --- Stats & Graphique ---
  const { stats, chartData } = useMemo(() => {
    const monthsNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const now = new Date();
    const monthlyData: Record<string, number> = {};

    // Initialisation 6 derniers mois pour le graphique
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyData[`${monthsNames[d.getMonth()]} ${d.getFullYear()}`] = 0;
    }

    let totalPaid = 0;
    let totalPending = 0;

    // On calcule les totaux sur la base des données FILTRÉES
    filtered.forEach(p => {
      const amt = Number(p.amount) || 0;
      if (p.status === "PAID") {
        totalPaid += amt;
        if (p.paidAt) {
          const d = new Date(p.paidAt);
          const key = `${monthsNames[d.getMonth()]} ${d.getFullYear()}`;
          if (monthlyData[key] !== undefined) monthlyData[key] += amt;
        }
      } else if (p.status === "PENDING") {
        totalPending += amt;
      }
    });

    return {
      stats: { totalPaid, totalPending },
      chartData: Object.entries(monthlyData).map(([name, total]) => ({ name, total }))
    };
  }, [filtered]);

  // --- Fonctions d'Export ---
  const exportToExcel = async () => {
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(filtered.map(p => ({
      Client: p.client?.user?.name,
      Description: p.description,
      Montant: p.amount,
      Statut: p.status,
      Date: p.paidAt || p.createdAt
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Paiements");
    XLSX.writeFile(workbook, `Export_CA_${period}.xlsx`);
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF();
    doc.text(`Rapport Financier - ${period}`, 14, 15);
    autoTable(doc, {
      head: [["Client", "Description", "Montant", "Statut", "Date"]],
      body: filtered.map(p => [p.client?.user?.name, p.description, `${p.amount}€`, p.status, p.paidAt || "—"]),
      startY: 25,
      headStyles: { fillColor: [249, 115, 22] }
    });
    doc.save("Rapport.pdf");
  };

  if (loading) return <div className="p-20 text-center font-bold text-orange-500 animate-bounce">Chargement...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6 bg-gray-50/50 min-h-screen">
      
      {/* Header & Stats Rapides */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Admin</h1>
          <p className="text-gray-500 font-medium">Suivi du Chiffre d'Affaires</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border-2 border-emerald-100 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Encaissé (Filtre)</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalPaid.toLocaleString()}€</p>
          </div>
          <div className="bg-white border-2 border-amber-100 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">En attente</p>
            <p className="text-2xl font-black text-gray-900">{stats.totalPending.toLocaleString()}€</p>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <Card className="border-none shadow-lg overflow-hidden rounded-3xl">
        <CardHeader className="bg-white border-b px-6 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> Tendance des Revenus
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToExcel} variant="outline" size="sm" className="rounded-xl gap-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
              <FileSpreadsheet size={16} /> Excel
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm" className="rounded-xl gap-2 text-red-700 border-red-200 hover:bg-red-50">
              <FileText size={16} /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '15px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="total" stroke="#10b981" strokeWidth={4} fill="url(#colorCA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Barre de Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            className="w-full pl-10 pr-4 py-3 bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
          <select 
            className="w-full pl-10 pr-4 py-3 bg-white border-none shadow-sm rounded-2xl outline-none appearance-none cursor-pointer font-medium text-gray-700"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="THIS_MONTH">Ce mois-ci</option>
            <option value="LAST_30_DAYS">30 derniers jours</option>
            <option value="THIS_YEAR">Cette année</option>
            <option value="ALL_TIME">Tout l'historique</option>
          </select>
        </div>
        <select 
          className="w-full px-4 py-3 bg-white border-none shadow-sm rounded-2xl outline-none cursor-pointer font-medium text-gray-700"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tous les statuts</option>
          <option value="PAID">Payés</option>
          <option value="PENDING">En attente</option>
          <option value="FAILED">Échecs</option>
        </select>
      </div>

      {/* Tableau */}
      <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b">
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Client</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Description</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Montant</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Statut</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => {
              const config = STATUS_CONFIG[p.status] || { label: p.status, color: "bg-gray-100", icon: Clock };
              return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{p.client?.user?.name || "Inconnu"}</div>
                    <div className="text-[10px] text-gray-400">{p.client?.user?.email}</div>
                  </td>
                  <td className="p-4 text-gray-600 text-sm italic">{p.description}</td>
                  <td className="p-4 font-black text-gray-900">{p.amount.toLocaleString()} €</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${config.color}`}>
                      <config.icon size={12} /> {config.label.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs font-bold">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString('fr-FR') : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}