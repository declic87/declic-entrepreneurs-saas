'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User, Bell, Clock, Phone, Target, Save } from 'lucide-react';

interface SetterSettings {
  daily_call_goal: number;
  notification_rdv: boolean;
  notification_new_lead: boolean;
  work_hours_start: string;
  work_hours_end: string;
  auto_assign_leads: boolean;
}

export default function SetterSettingsPage() {
  const [settings, setSettings] = useState<SetterSettings>({
    daily_call_goal: 40,
    notification_rdv: true,
    notification_new_lead: true,
    work_hours_start: '09:00',
    work_hours_end: '18:00',
    auto_assign_leads: false,
  });
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    loadUserInfo();
    loadSettings();
  }, []);

  async function loadUserInfo() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      setUserInfo(profile);
    }
  }

  async function loadSettings() {
    // TODO: Charger depuis table settings ou user preferences
    // Pour l'instant, valeurs par défaut
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    
    // TODO: Sauvegarder dans Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaving(false);
    alert('Paramètres sauvegardés !');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-2">Personnalisez votre espace de travail</p>
        </div>

        {/* Profil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="text-blue-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Profil</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {userInfo?.first_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {userInfo?.first_name} {userInfo?.last_name}
              </h3>
              <p className="text-gray-600">{userInfo?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                SETTER
              </span>
            </div>
          </div>
        </div>

        {/* Objectifs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-green-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Objectifs</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objectif d'appels quotidien
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={settings.daily_call_goal}
                  onChange={(e) => setSettings({ ...settings, daily_call_goal: parseInt(e.target.value) })}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-gray-600">appels par jour</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horaires */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-purple-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Horaires de Travail</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Début
              </label>
              <input
                type="time"
                value={settings.work_hours_start}
                onChange={(e) => setSettings({ ...settings, work_hours_start: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fin
              </label>
              <input
                type="time"
                value={settings.work_hours_end}
                onChange={(e) => setSettings({ ...settings, work_hours_end: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="text-orange-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_rdv}
                onChange={(e) => setSettings({ ...settings, notification_rdv: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">RDV bookés</p>
                <p className="text-sm text-gray-600">Recevoir une notification quand un RDV est confirmé</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_new_lead}
                onChange={(e) => setSettings({ ...settings, notification_new_lead: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">Nouveaux leads</p>
                <p className="text-sm text-gray-600">Recevoir une notification pour chaque nouveau lead assigné</p>
              </div>
            </label>
          </div>
        </div>

        {/* Attribution automatique */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Phone className="text-blue-500" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Attribution des Leads</h2>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.auto_assign_leads}
              onChange={(e) => setSettings({ ...settings, auto_assign_leads: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="font-medium text-gray-900">Attribution automatique</p>
              <p className="text-sm text-gray-600">
                Recevoir automatiquement de nouveaux leads en fonction de votre disponibilité
              </p>
            </div>
          </label>
        </div>

        {/* Bouton Sauvegarder */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save size={20} />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}