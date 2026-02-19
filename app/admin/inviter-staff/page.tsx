'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Mail, UserPlus, Briefcase, Users, Target, Award } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'HOS', label: 'Head of Sales', icon: Target, color: 'bg-indigo-100 text-indigo-700' },
  { value: 'CLOSER', label: 'Closer', icon: Briefcase, color: 'bg-purple-100 text-purple-700' },
  { value: 'SETTER', label: 'Setter', icon: Users, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'EXPERT', label: 'Expert', icon: Award, color: 'bg-emerald-100 text-emerald-700' },
];

export default function AdminInviterStaffPage() {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'CLOSER',
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSuccess(false);

    try {
      // Appeler l'API route d'invitation
      const response = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'invitation');
      }

      setSuccess(true);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'CLOSER',
      });

      alert('✅ Invitation envoyée avec succès !');

    } catch (error: any) {
      console.error('Erreur:', error);
      alert('❌ Erreur : ' + error.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Inviter un membre de l'équipe</h1>
          <p className="text-gray-600 mt-2">
            Envoyez une invitation par email pour rejoindre la plateforme
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleInvite} className="space-y-6">
            {/* Sélection rôle */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-4">
                Sélectionner le rôle *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLE_OPTIONS.map((role) => {
                  const Icon = role.icon;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setFormData({...formData, role: role.value})}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.role === role.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${role.color}`}>
                          <Icon size={20} />
                        </div>
                        <span className="font-bold text-gray-900">{role.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} />
                Email professionnel *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="prenom.nom@exemple.fr"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Nom Prénom */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                📧 Un email sera envoyé à <strong>{formData.email || 'l\'adresse saisie'}</strong> avec 
                un lien pour créer son mot de passe et accéder à son espace {formData.role}.
              </p>
            </div>

            {/* Bouton */}
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Envoyer l'invitation
                </>
              )}
            </button>
          </form>
        </div>

        {/* Liste des invitations récentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Invitations récentes</h2>
          <p className="text-sm text-gray-600">
            Les invitations envoyées apparaîtront ici
          </p>
        </div>
      </div>
    </div>
  );
}