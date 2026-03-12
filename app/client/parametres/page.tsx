'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OnboardingVideo } from '@/components/OnboardingVideo';
import { Bell, Lock, User } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function ParametresPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
    }
    getUser();
  }, [supabase]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        setError('Utilisateur non connecté');
        setLoading(false);
        return;
      }

      // Vérifier l'ancien mot de passe
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setError('Mot de passe actuel incorrect');
        setLoading(false);
        return;
      }

      // Changer le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess('✅ Mot de passe changé avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      setError(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* VIDÉO ONBOARDING */}
      <OnboardingVideo pageSlug="parametres" role="CLIENT" />

      <h1 className="text-3xl font-bold text-[#123055]">Paramètres</h1>

      {/* Profil */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6 flex items-center gap-2">
            <User size={20} />
            Informations personnelles
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Prénom</label>
              <Input placeholder="Client" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Nom</label>
              <Input placeholder="Test" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
              <Input type="email" value={userEmail} disabled className="bg-slate-100" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Téléphone</label>
              <Input placeholder="+33 6 12 34 56 78" />
            </div>
          </div>

          <Button className="mt-6 bg-amber-500 hover:bg-amber-600 text-white">
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6 flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Nouveaux coachings</p>
                <p className="text-sm text-slate-500">Recevoir une notification lors de nouveaux coachings</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Nouveaux ateliers</p>
                <p className="text-sm text-slate-500">Recevoir une notification lors de nouveaux ateliers</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Nouvelles vidéos</p>
                <p className="text-sm text-slate-500">Recevoir une notification pour les nouveaux contenus</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Messages experts</p>
                <p className="text-sm text-slate-500">Notification quand un expert vous répond</p>
              </div>
              <input type="checkbox" className="w-5 h-5" defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité - FONCTIONNEL */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-[#123055] mb-6 flex items-center gap-2">
            <Lock size={20} />
            Sécurité
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Mot de passe actuel
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Declic2026!"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Nouveau mot de passe
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Confirmer le mot de passe
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retapez le mot de passe"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <Button 
              type="submit"
              disabled={loading}
              className="mt-6 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {loading ? 'Modification en cours...' : 'Modifier le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}