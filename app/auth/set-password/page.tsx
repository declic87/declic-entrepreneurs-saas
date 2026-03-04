'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      // Vérifier s'il y a un token dans l'URL (recovery link)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        // On a un token de récupération, on l'utilise
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: hashParams.get('refresh_token') || '',
        });

        if (sessionError) {
          setError('Lien invalide ou expiré. Demandez un nouveau lien.');
        }
      } else {
        // Vérifier s'il y a déjà une session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setError('Session expirée. Veuillez demander un nouveau lien d\'invitation.');
        }
      }
    } catch (err: any) {
      setError('Erreur de connexion: ' + err.message);
    } finally {
      setCheckingSession(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Récupérer le rôle de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single();

        // Mettre le statut en "active"
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('auth_id', user.id);

        const role = userData?.role;

        // Rediriger selon le rôle
        if (role === 'EXPERT') {
          router.push('/expert');
        } else if (role === 'HOS' || role === 'CLOSER' || role === 'SETTER') {
          router.push('/hos');
        } else if (role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/client/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Créez votre mot de passe
          </h1>
          <p className="text-gray-600">
            Bienvenue chez DÉCLIC Entrepreneurs
          </p>
        </div>

        <form onSubmit={handleSetPassword} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
              {error.includes('Session expirée') && (
                <div className="mt-2">
                  <a 
                    href="/contact" 
                    className="text-red-800 underline font-medium"
                  >
                    Contactez l'administrateur
                  </a>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              placeholder="Minimum 8 caractères"
              disabled={!!error}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              placeholder="Retapez votre mot de passe"
              disabled={!!error}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!error}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création...' : 'Créer mon mot de passe'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Déjà un mot de passe ?</p>
          <a href="/login" className="text-orange-600 hover:text-orange-700 font-medium">
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}