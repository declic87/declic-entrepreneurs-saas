import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API Route pour désactiver automatiquement les subscriptions expirées
 * À appeler via un cron job quotidien (ex: Vercel Cron)
 */
export async function GET(req: NextRequest) {
  // Vérifier l'autorisation (optionnel mais recommandé)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Trouver toutes les subscriptions expirées qui sont encore actives
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, pack_type, end_date')
      .eq('is_active', true)
      .lt('end_date', today);

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      return NextResponse.json({ 
        message: 'No expired subscriptions to process',
        count: 0 
      });
    }

    // Désactiver toutes les subscriptions expirées
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true)
      .lt('end_date', today);

    if (updateError) {
      console.error('Error updating expired subscriptions:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`✅ Désactivé ${expiredSubs.length} subscription(s) expirée(s)`);

    return NextResponse.json({ 
      success: true,
      message: `${expiredSubs.length} subscription(s) désactivée(s)`,
      count: expiredSubs.length,
      subscriptions: expiredSubs
    });

  } catch (error: any) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}