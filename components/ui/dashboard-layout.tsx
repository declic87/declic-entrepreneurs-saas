"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { LogOut, Settings, LucideIcon, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userName: string;
  userEmail: string;
}

export function DashboardLayout({
  children,
  navItems,
  userName,
  userEmail,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Menu Button - Apparaît seulement sur petit écran */}
      <div className="lg:hidden fixed top-4 right-4 z-[60]">
        <Button 
          variant="secondary" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[50] lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[55] w-72 bg-[#2C3E50] text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8">
          <Logo variant="light" size="md" />
        </div>

        {/* User Info - On injecte tes couleurs ici */}
        <div className="px-4 py-4 mx-6 mb-6 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#E67E22] rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-orange-900/20">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{userName}</p>
              <p className="text-[11px] text-white/50 truncate font-medium uppercase tracking-wider">{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto">
          <div>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.2em] mb-4 px-4">
              Menu Principal
            </p>
            <ul className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                        isActive
                          ? "bg-white text-[#2C3E50] shadow-xl shadow-black/10"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon size={20} className={cn(
                        "transition-transform group-hover:scale-110",
                        isActive ? "text-[#E67E22]" : "text-white/40 group-hover:text-white/80"
                      )} />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-6 mt-auto border-t border-white/5 space-y-1">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all group"
          >
            <Settings size={18} className="group-hover:rotate-45 transition-transform" />
            <span className="text-sm font-medium">Paramètres</span>
          </Link>
          <button
            onClick={() => {/* Ta logique de déconnexion */}}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}