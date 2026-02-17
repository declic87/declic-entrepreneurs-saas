"use client";

import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Sidebar } from "@/components/ui/sidebar-FIXED";

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [userName, setUserName] = useState("Expert");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Correction : on utilise 'id' (qui contient l'UUID Auth) 
          // et on récupère first_name/last_name
          const { data: profile } = await supabase
            .from("users")
            .select("first_name, last_name, email, role")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            const fullName = profile.first_name 
              ? `${profile.first_name} ${profile.last_name || ""}`.trim() 
              : "Expert";
            
            setUserName(fullName);
            setUserEmail(profile.email || session.user.email || "");
          }
        }
      } catch (e) {
        console.error("Layout error:", e);
      }
    }
    loadUser();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar fixe à gauche */}
      <div className="w-64 fixed inset-y-0">
        <Sidebar role="expert" userName={userName} userEmail={userEmail} />
      </div>
      
      {/* Zone de contenu principale décalée de la largeur de la sidebar */}
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}