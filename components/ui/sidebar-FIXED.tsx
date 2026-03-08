"use client";

import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { NotificationBell } from "@/components/ui/notification-bell";
import CompanySelector from "@/components/creation/CompanySelector";
import {
  LayoutDashboard, Target, Users, Briefcase, CreditCard, RefreshCw,
  CheckCircle, Calendar, Mail, BarChart3, Settings, XCircle, Clock,
  UserCheck, FileText, Calculator, MessageSquare, LogOut, Building,
  Play, Video, ChevronRight, Handshake, TrendingUp, DollarSign, UserPlus,
  BookOpen, GraduationCap
} from "lucide-react";

interface SidebarProps {
  role: string;
  userName?: string;
  userEmail?: string;
}

const navItemsByRole: Record<string, { label: string; href: string; icon: any }[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "CRM Master", href: "/admin/crm", icon: Target },
    { label: "Pipeline", href: "/admin/pipeline", icon: Target },
    { label: "Clients", href: "/admin/clients", icon: Users },
    { label: "Gestion Accès", href: "/admin/gestion-acces", icon: UserCheck },
    { label: "Inviter Staff", href: "/admin/inviter-staff", icon: UserPlus },
    { label: "Equipe", href: "/admin/equipe", icon: Users },
    { label: "Experts", href: "/admin/experts", icon: Briefcase },
    { label: "Contrats", href: "/admin/contrats", icon: FileText },
    { label: "Contenus", href: "/admin/contenus", icon: Video },
    { label: "Onboarding Staff", href: "/admin/onboarding-staff", icon: Play },
    { label: "Vidéos Onboarding", href: "/admin/videos", icon: Video },
    { label: "Paiements", href: "/admin/paiements", icon: CreditCard },
    { label: "Outils Experts", href: "/admin/outils-experts", icon: FileText },
    { label: "Remboursements", href: "/admin/remboursements", icon: RefreshCw },
    { label: "Tâches", href: "/admin/taches", icon: CheckCircle },
    { label: "Agendas", href: "/admin/agendas", icon: Calendar },
    { label: "Validation Documents", href: "/admin/documents-validation", icon: FileText },
    { label: "Messages Équipe", href: "/admin/messages", icon: MessageSquare },
    { label: "Statistiques", href: "/admin/stats", icon: BarChart3 },
    { label: "Paramètres", href: "/admin/settings", icon: Settings },
  ],
  commercial: [
    { label: "Dashboard", href: "/commercial", icon: LayoutDashboard },
    { label: "Pipeline", href: "/commercial/pipeline", icon: Target },
    { label: "Mon Agenda", href: "/commercial/agenda", icon: Calendar },
    { label: "No-Shows", href: "/commercial/no-shows", icon: XCircle },
    { label: "Non Closes", href: "/commercial/non-closes", icon: Clock },
    { label: "📚 Formations", href: "/commercial/formations", icon: GraduationCap },
    { label: "📖 Tutos", href: "/commercial/tutos", icon: BookOpen },
    { label: "🎥 Coachings", href: "/commercial/coachings", icon: Video },
    { label: "🎓 Ateliers", href: "/commercial/ateliers", icon: Users },
    { label: "Mon Contrat", href: "/commercial/contrat", icon: FileText },
    { label: "Mes Commissions", href: "/commercial/commissions", icon: DollarSign },
    { label: "Statistiques", href: "/commercial/stats", icon: BarChart3 },
    { label: "Messages Équipe", href: "/commercial/messages", icon: MessageSquare },
    { label: "Onboarding", href: "/commercial/onboarding", icon: UserCheck },
    { label: "Scripts", href: "/commercial/scripts", icon: FileText },
    { label: "Paramètres", href: "/commercial/settings", icon: Settings },
  ],
  setter: [
    { label: "Dashboard", href: "/setter", icon: LayoutDashboard },
    { label: "Mes Leads", href: "/setter/leads", icon: Users },
    { label: "Mon Agenda", href: "/setter/agenda", icon: Calendar },
    { label: "Onboarding", href: "/setter/onboarding", icon: Video },
    { label: "Mon Contrat", href: "/setter/contrat", icon: FileText },
    { label: "Mes Commissions", href: "/setter/commissions", icon: DollarSign },
    { label: "Messages Équipe", href: "/setter/messages", icon: MessageSquare },
    { label: "Performances", href: "/setter/stats", icon: BarChart3 },
    { label: "Paramètres", href: "/setter/settings", icon: Settings },
  ],
  hos: [
    { label: "Dashboard", href: "/hos", icon: LayoutDashboard },
    { label: "Pipeline Global", href: "/hos/pipeline", icon: Target },
    { label: "Mon Équipe", href: "/hos/equipe", icon: Users },
    { label: "Rendez-vous", href: "/hos/rdv", icon: Calendar },
    { label: "Leads", href: "/hos/leads", icon: Users },
    { label: "Onboarding", href: "/hos/onboarding", icon: Video },
    { label: "Contrats Équipe", href: "/hos/contrats-equipe", icon: FileText },
    { label: "Mon Contrat", href: "/hos/contrat", icon: FileText },
    { label: "Mes Commissions", href: "/hos/commissions", icon: DollarSign },
    { label: "Messages Équipe", href: "/hos/messages", icon: MessageSquare },
    { label: "Performance", href: "/hos/performance", icon: TrendingUp },
    { label: "Paramètres", href: "/hos/parametres", icon: Settings },
  ],
  expert: [
    { label: "Dashboard", href: "/expert", icon: LayoutDashboard },
    { label: "Mes Clients", href: "/expert/clients", icon: Users },
    { label: "Agenda", href: "/expert/agenda", icon: Calendar },
    { label: "📚 Formations", href: "/expert/formations", icon: GraduationCap },
    { label: "📖 Tutos", href: "/expert/tutos", icon: BookOpen },
    { label: "🎥 Coachings", href: "/expert/coachings", icon: Video },
    { label: "🎓 Ateliers", href: "/expert/ateliers", icon: Users },
    { label: "Formation", href: "/expert/onboarding", icon: Video },
    { label: "Boîte à Outils", href: "/expert/outils", icon: FileText },
    { label: "Tâches", href: "/expert/taches", icon: CheckCircle },
    { label: "Documents", href: "/expert/documents", icon: FileText },
    { label: "Mon Contrat", href: "/expert/contrat", icon: FileText },
    { label: "Mes Commissions", href: "/expert/commissions", icon: DollarSign },
    { label: "Messages Clients", href: "/expert/messagerie", icon: Users },
    { label: "Messages Équipe", href: "/expert/team-messages", icon: MessageSquare },
    { label: "Statistiques", href: "/expert/stats", icon: BarChart3 },
    { label: "Paramètres", href: "/expert/settings", icon: Settings },
  ],
  client: [
    { label: "Dashboard", href: "/client", icon: LayoutDashboard },
    { label: "Création Société", href: "/client/creation-societe", icon: Building },
    { label: "Mon Dossier", href: "/client/mon-dossier", icon: FileText },
    { label: "Paiements", href: "/client/paiements", icon: CreditCard },
    { label: "Documents", href: "/client/documents", icon: FileText },
    { label: "Tutos Pratiques", href: "/client/tutos", icon: FileText },
    { label: "Formations", href: "/client/formations", icon: Video },
    { label: "Coachings", href: "/client/coachings", icon: Play },
    { label: "Ateliers", href: "/client/ateliers", icon: Users },
    { label: "Simulateur", href: "/client/simulateur", icon: Calculator },
    { label: "Messages", href: "/client/messagerie", icon: MessageSquare },
    { label: "Partenaire", href: "/client/partenaire", icon: Handshake },
    { label: "Paramètres", href: "/client/parametres", icon: Settings },
  ],
};

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [packType, setPackType] = useState<string | null>(null);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const currentRole = role?.toLowerCase() || "client";
  const items = navItemsByRole[currentRole] || [];

  useEffect(() => {
    async function fetchUserId() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", user.id)
          .single();
        
        if (userData) {
          setUserId(userData.id);
          
          if (currentRole === 'client') {
            const { data: accessData } = await supabase
              .from("client_access")
              .select("pack_type")
              .eq("user_id", userData.id)
              .single();
            
            if (accessData) {
              setPackType(accessData.pack_type);
            }
          }
        }
      }
    }
    fetchUserId();
  }, [supabase, currentRole]);

  const { unreadCount } = useUnreadMessages(userId);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth/login");
  }

  const roleLabels: Record<string, string> = {
    admin: "Administration",
    commercial: "Espace Commercial",
    setter: "Espace Setter",
    hos: "Head of Sales",
    expert: "Espace Expert",
    client: "Espace Client",
  };

  const filteredItems = currentRole === 'client' 
    ? items.filter(item => {
        if (['plateforme', 'createur', 'agent_immo'].includes(packType || '')) {
          return !item.href.includes('/creation-societe') && !item.href.includes('/documents');
        }
        return true;
      })
    : items;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0F172A] text-white flex flex-col z-50 shadow-2xl border-r border-white/5">
      <div className="p-6 border-b border-white/5 bg-slate-900/50">
        <div className="flex items-center justify-between mb-2">
          <Logo variant="light" size="sm" />
          <NotificationBell />
        </div>
        <div className="inline-block px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
          <p className="text-[10px] uppercase tracking-widest text-orange-400 font-bold">
            {roleLabels[currentRole] || currentRole}
          </p>
        </div>
      </div>

      {currentRole === 'client' && (
        <div className="px-4 pt-4 pb-2 border-b border-white/5">
          <CompanySelector />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-6 space-y-1 custom-scrollbar">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== `/${currentRole}` && pathname.startsWith(item.href));
          const isMessagesItem = item.label.includes("Messages");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "text-orange-500 bg-orange-500/5" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 bg-orange-500 rounded-r-full shadow-[0_0_10px_rgba(230,126,34,0.5)]" />
              )}
              
              <div className="relative">
                <Icon size={18} className={cn(
                  "transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-orange-500" : "text-slate-500 group-hover:text-slate-300"
                )} />
                
                {isMessagesItem && unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse shadow-lg">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </div>
              
              <span className="flex-1">{item.label}</span>
              
              {isActive && <ChevronRight size={14} className="opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 bg-slate-900/80 border-t border-white/5">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-sm font-bold shadow-lg">
            {userName?.charAt(0) || "A"}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{userName || "Admin"}</p>
            <p className="text-[10px] text-slate-500 truncate">{userEmail || "contact@declic.fr"}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all w-full group"
        >
          <LogOut size={16} className="group-hover:-translate-x-1 transition-transform text-slate-600 group-hover:text-red-400" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}