'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient();

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

      // Récupération du rôle dans la table personnalisée
      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('authId', data.session?.user.id)
        .single();

      if (roleError) {
        console.error("Erreur rôle:", roleError);
      }

      const role = userData?.role || 'CLIENT';

      // Mapping des redirections
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block group">
            <span className="text-4xl font-black italic tracking-tighter uppercase">
              Declic<span className="text-orange-500 group-hover:text-black transition-colors">-Studio</span>
            </span>
          </Link>
          <div className="h-1.5 w-20 bg-black mx-auto mt-2"></div>
        </div>

        {/* Card de Connexion Brutaliste */}
        <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black mb-8 uppercase italic italic">Connexion_Espace</h2>
          
          {error && (
            <div className="mb-6 p-4 border-2 border-red-500 bg-red-50 text-red-600 text-xs font-black uppercase">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Mail size={12} /> Email de travail
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="nom@declic.studio" 
                className="w-full px-0 py-3 text-lg font-bold border-b-4 border-gray-100 focus:border-orange-500 outline-none transition-all placeholder:text-gray-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Lock size={12} /> Mot de passe
              </label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                className="w-full px-0 py-3 text-lg font-bold border-b-4 border-gray-100 focus:border-orange-500 outline-none transition-all placeholder:text-gray-200"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full group relative bg-black hover:bg-orange-500 text-white font-black py-4 uppercase italic transition-all disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Entrer dans le studio
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4">
            <a 
              href="https://calendly.com/contact-jj-conseil/rdv-analyste" 
              target="_blank"
              className="text-[10px] font-black text-orange-500 hover:text-black uppercase text-center tracking-tighter transition-colors"
            >
              Pas de compte ? Réserver un diagnostic gratuit →
            </a>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/" className="text-[10px] font-black text-gray-300 hover:text-black uppercase tracking-widest transition-colors">
            ← Retourner à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}