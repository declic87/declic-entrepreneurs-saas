import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

async function getStats() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Récupération des données réelles sur Supabase
  const [clients, payments, leads] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    supabase.from('payments').select('amount'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'NEW'),
  ]);

  const totalRevenue = payments.data?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0;

  return {
    clientCount: clients.count || 0,
    revenue: totalRevenue,
    pendingLeads: leads.count || 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      title: "Clients Totaux",
      value: stats.clientCount,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Chiffre d'Affaires",
      value: `${stats.revenue}€`,
      icon: CreditCard,
      color: "text-[#E67E22]", // Orange Declic
      bg: "bg-orange-100",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Leads en attente",
      value: stats.pendingLeads,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-100",
      trend: "-3%",
      trendUp: false,
    },
    {
      title: "Taux de Conversion",
      value: "24%",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-100",
      trend: "+5%",
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h1>
        <p className="text-gray-500">Bienvenue sur votre tableau de bord <span className="text-[#E67E22] font-semibold">Declic Entrepreneurs</span>.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center text-sm font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                {card.trend}
                {card.trendUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 flex flex-col items-center justify-center">
          <TrendingUp size={48} className="text-gray-200 mb-4" />
          <p className="text-gray-400 italic font-light">Analyse des revenus en temps réel</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Dernières Activités</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 text-center py-10">Flux Supabase prêt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}