'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import MessagerieStaff from '@/components/messagerie/MessagerieStaff';
import MessagerieClientExpert from '@/components/messagerie/MessagerieClientExpert';
import { Loader2, Users, MessageCircle } from 'lucide-react';

export default function ExpertMessagesPage() {
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'staff' | 'clients'>('clients');

  useEffect(() => {
    async function loadUser() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .eq('auth_id', user.id)
          .single();

        if (profile) {
          setUserData({
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
          });
        }
      }
      
      setLoading(false);
    }

    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Impossible de charger vos informations</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Tabs */}
      <div className="bg-white border-b px-6 py-3 flex gap-2">
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'clients'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageCircle size={18} />
          Mes Clients
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'staff'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users size={18} />
          Équipe
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'clients' ? (
          <MessagerieClientExpert
            userId={userData.id}
            userName={userData.name}
            userRole="expert"
          />
        ) : (
          <MessagerieStaff
            role="expert"
            userId={userData.id}
            userName={userData.name}
          />
        )}
      </div>
    </div>
  );
}