import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypasse les RLS
);

export async function POST(req: NextRequest) {
  try {
    const { clientId, statutType } = await req.json();

    console.log('🔄 API validation statut:', statutType, 'pour client:', clientId);

    // UPSERT avec service role (bypass RLS)
    const { data, error } = await supabase
      .from('company_creation_data')
      .upsert({
        user_id: clientId,
        company_type: statutType,
        step: 'info_collection',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('❌ Erreur upsert:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Statut validé:', data);

    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error('❌ Erreur API:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}