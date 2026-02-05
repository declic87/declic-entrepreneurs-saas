"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Settings, 
  LogOut, 
  Target, 
  BarChart3,
  ShieldCheck
} from "lucide-react";

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
}

function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  // Configuration des menus selon le rôle
  const menuConfig = [
    {
      title: "Général",
      roles: ["ADMIN", "HOS", "CLOSER", "SETTER", "COMMERCIAL"],
      links: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Mes Leads", href: "/leads", icon: Target },
      ]
    },
    {
      title: "Équipe",
      roles: ["ADMIN", "HOS"],
      links: [
        { name: "Mon Équipe", href: "/equipe", icon: Users },
        { name: "Performances", href: "/stats", icon: BarChart3 },
      ]
    },
    {
      title: "Administration",
      roles: ["ADMIN"],
      links: [
        { name: "Gestion Users", href: "/admin/users", icon: ShieldCheck },
        { name: "Paramètres", href: "/admin/settings", icon: Settings },
      ]
    }
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col z-50">
      {/* Logo / Header */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="text-xl font-black text-white tracking-tight italic">CRM_PRO</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-8 mt-4 overflow-y-auto">
        {menuConfig.map((section) => section.roles.includes(role.toUpperCase()) && (
          <div key={section.title}>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 px-2">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                        : "hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <link.icon size={18} />
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Utilisateur */}
      <div className="p-4 bg-slate-950/50 mt-auto border-t border-slate-800/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border border-slate-600">
            {userName[0]}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase font-black">{role}</p>
          </div>
        </div>
        
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
  export default function LeadsPage() {
    return (
      <div className="flex min-h-screen bg-slate-50">
        {/* On appelle ton composant Sidebar ici */}
        <Sidebar 
          role="ADMIN" 
          userName="Utilisateur" 
          userEmail="admin@test.com" 
        />
        
        {/* Le contenu principal à droite de la sidebar */}
        <main className="ml-64 p-8 w-full">
          <h1 className="text-2xl font-bold text-slate-900">Gestion des Leads</h1>
          <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-600">Le contenu de vos leads s'affichera ici.</p>
          </div>
        </main>
      </div>
    );
}