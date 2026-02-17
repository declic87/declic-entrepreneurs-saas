"use client";
import React, { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Sidebar } from "@/components/ui/sidebar-FIXED";
import { Loader2 } from "lucide-react";

export default function CommercialLayout({ children }: { children: React.ReactNode }) {
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
  const [userData, setUserData] = useState({
    name: "Chargement...",
    email: "",
    role: "COMMERCIAL"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from("users")
            .select("name, email, role")
            .eq("authId", session.user.id)
            .single();

          if (profile && !error) {
            setUserData({
              name: profile.name || "Commercial",
              email: profile.email || session.user.email || "",
              role: profile.role || "COMMERCIAL"
            });
          }
        }
      } catch (e) {
        console.error("Layout error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [supabase]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - Fixe à gauche */}
      <Sidebar 
        role="COMMERCIAL" 
        userName={userData.name} 
        userEmail={userData.email} 
      />

      {/* Zone de contenu principal */}
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 opacity-20" />
          </div>
        ) : (
          <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full transition-all duration-300">
            {children}
          </main>
        )}
      </div>
    </div>
  );
}