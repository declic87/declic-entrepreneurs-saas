'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      // ⭐ UTILISER window.location au lieu de useSearchParams
      if (typeof window === 'undefined') {
        setCheckingSession(false);
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        console.log('🔑 Token trouvé dans l\'URL, création de session...');
        
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          console.error('❌ Erreur session:', sessionError);
          setError('Lien invalide ou expiré. Demandez un nouveau lien.');
        } else {
          console.log('✅ Session créée avec succès');
        }
      } else {
        console.log('⚠️ Pas de token dans l\'URL');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('❌ Pas de session active');
          setError('Session expirée. Veuillez demander un nouveau lien d\'invitation.');
        } else {
          console.log('✅ Session active trouvée');
        }
      }
    } catch (err: any) {
      console.error('❌ Erreur checkSession:', err);
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
      console.log('🔒 Mise à jour du mot de passe...');
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('❌ Erreur update password:', updateError);
        throw updateError;
      }

      console.log('✅ Mot de passe mis à jour');

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log('👤 User:', user.email);
        
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single();

        console.log('📊 User data:', userData);

        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('auth_id', user.id);

        console.log('✅ Status mis à jour en "active"');

        const role = userData?.role;

        console.log('🎯 Redirection vers dashboard, rôle:', role);
        
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
      console.error('❌ Erreur handleSetPassword:', err);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
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
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p>{error}</p>
                  {error.includes('Session expirée') && (
                    <div className="mt-2">
                      <p className="text-sm">Veuillez contacter l'administrateur pour recevoir un nouveau lien.</p>
                    </div>
                  )}
                </div>
              </div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="Minimum 8 caractères"
              disabled={!!error}
            />
            <p className="mt-1 text-xs text-gray-500">
              Utilisez au moins 8 caractères avec lettres et chiffres
            </p>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="Retapez votre mot de passe"
              disabled={!!error}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !!error}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Création...
              </span>
            ) : (
              'Créer mon mot de passe'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Déjà un compte ?</span>
            </div>
          </div>
          <div className="mt-4">
            <a 
              href="/login" 
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              Se connecter →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}