'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from "@supabase/ssr";

export default function DashboardDispatcher() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkRoleAndRedirect() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/login');
        return;
      }

      // On va chercher le rôle dans ta table 'users' ou 'profiles'
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/commercial');
      }
    }

    checkRoleAndRedirect();
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
      <p className="animate-pulse">Initialisation de votre espace...</p>
    </div>
  );
}