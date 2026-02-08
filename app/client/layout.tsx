"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Sidebar } from "@/components/ui/sidebar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Corrigé : auth_id au lieu de authId
          const { data: profile, error } = await supabase
            .from("users")
            .select("first_name, last_name, email, role")
            .eq("auth_id", session.user.id)
            .single();

          if (profile && !error) {
            setUserName(`${profile.first_name} ${profile.last_name}`);
            setUserEmail(profile.email || session.user.email || "");
          } else {
            // Fallback
            setUserName("Membre");
            setUserEmail(session.user.email || "");
          }
        }
      } catch (e) {
        console.error("Layout initialization error:", e);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fixe à gauche */}
      <aside className="fixed inset-y-0 left-0 w-64 z-50">
        <Sidebar 
          role="client" 
          userName={loading ? "Chargement..." : userName || "Utilisateur"} 
          userEmail={loading ? "" : userEmail || ""} 
        />
      </aside>

      {/* Zone de contenu principal */}
      <main className="flex-1 ml-64 min-h-screen transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}