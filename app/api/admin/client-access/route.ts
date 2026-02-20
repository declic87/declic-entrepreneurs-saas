import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  console.log('🔑 SERVICE_ROLE_KEY présente:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('🔑 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('📥 API: Chargement des accès...');

  const { data, error } = await supabase
    .from('client_access')
    .select('*');

  console.log('🔍 Données:', data);
  console.log('❌ Erreur:', error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ data: [], debug: 'No data found' });
  }

  const userIds = data.map((a: any) => a.user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, first_name, last_name, email')
    .in('id', userIds);

  const merged = data.map((access: any) => ({
    ...access,
    user: users?.find((u: any) => u.id === access.user_id)
  }));

  return NextResponse.json({ data: merged });
}