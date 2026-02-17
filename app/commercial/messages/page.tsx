'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import MessagerieStaff from '@/components/messagerie/MessagerieStaff';
import { Loader2 } from 'lucide-react';

export default function CommercialMessagesPage() {
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

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
    <MessagerieStaff
      role="commercial"
      userId={userData.id}
      userName={userData.name}
    />
  );
}