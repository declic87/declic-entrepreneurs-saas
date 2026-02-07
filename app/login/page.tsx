'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Accès refusé. Vérifiez vos identifiants.');
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', data.session?.user.id)  // ← CORRIGÉ ICI
        .single();

      const role = userData?.role || 'CLIENT';

      const routes = {
        ADMIN: '/admin',
        HOS: '/commercial',
        CLOSER: '/commercial',
        SETTER: '/commercial',
        EXPERT: '/expert',
        CLIENT: '/client'
      };

      router.push(routes[role as keyof typeof routes] || '/client');
      router.refresh();

    } catch (err) {
      setError('Erreur système. Réessayez plus tard.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="mb-8">
        <Link href="/">
          <Logo size="lg" showText variant="dark" />
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-[#123055] text-center mb-6">
          Connexion
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <Input
              type="email"
              placeholder="contact@jj-conseil.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Mot de passe
            </label>
            <Input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <Button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white py-5 text-base"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-600 mt-6">
          Pas encore de compte ?{" "}
          <Link href="https://calendly.com/contact-jj-conseil/rdv-analyste" target="_blank" className="text-[#F59E0B] hover:underline">
            Réserver un diagnostic
          </Link>
        </p>
      </div>
    </div>
  );
}