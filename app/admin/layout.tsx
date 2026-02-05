import { createServerClient } from "@supabase/ssr"; // On passe sur SSR
import { cookies } from "next/headers";
import { Sidebar } from "@/components/ui/sidebar";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();

  // Nouvelle méthode de création du client serveur compatible Next.js 16
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
  
  // 1. On récupère la session
  const { data: { session } } = await supabase.auth.getSession();

  // 2. Si pas de session, redirection
  if (!session) {
    redirect("/auth/login");
  }

  // 3. Extraction des infos (basée sur notre SQL de tout à l'heure)
  const userRole = session.user.user_metadata?.role || "admin"; 
  const userName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* La Sidebar reçoit les bonnes props */}
      <Sidebar 
        role={userRole} 
        userName={userName} 
        userEmail={session.user.email} 
      />

      <div className="flex-1 flex flex-col relative overflow-y-auto ml-64">
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}