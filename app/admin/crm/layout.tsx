"use client";

import React from "react";
import { LayoutDashboard, Users, Target, DollarSign, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const crmNavItems = [
  { label: "Dashboard CRM", href: "/admin/crm", icon: LayoutDashboard },
  { label: "Équipe", href: "/admin/crm/equipe", icon: Users },
  { label: "Pipeline Global", href: "/admin/crm/pipeline", icon: Target },
  { label: "Commissions", href: "/admin/crm/commissions", icon: DollarSign },
];

export default function AdminCRMLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Simple */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-orange-500">CRM MASTER</h2>
          <p className="text-xs text-slate-400 mt-1">Administration</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {crmNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-bold">Admin</p>
              <p className="text-xs text-slate-500">CRM Master</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all w-full">
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu */}
      <div className="flex-1 ml-64">
        <main className="p-8 max-w-[1800px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}