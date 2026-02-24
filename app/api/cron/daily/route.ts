import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API Route CRON combinée :
 * 1. Désactiver les subscriptions expirées
 * 2. Envoyer rappels RDV 24h avant
 * 
 * À appeler via Vercel Cron quotidien à 9h
 */
export async function GET(req: NextRequest) {
  // Vérifier l'autorisation
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    subscriptions: { count: 0, success: false },
    reminders: { count: 0, success: false }
  };

  try {
    // ==========================================
    // PARTIE 1 : DÉSACTIVER SUBSCRIPTIONS EXPIRÉES
    // ==========================================
    const today = new Date().toISOString().split('T')[0];

    const { data: expiredSubs, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, pack_type, end_date')
      .eq('is_active', true)
      .lt('end_date', today);

    if (!fetchError && expiredSubs && expiredSubs.length > 0) {
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true)
        .lt('end_date', today);

      if (!updateError) {
        results.subscriptions = {
          count: expiredSubs.length,
          success: true
        };
        console.log(`✅ Désactivé ${expiredSubs.length} subscription(s)`);
      }
    } else {
      results.subscriptions = { count: 0, success: true };
    }

    // ==========================================
    // PARTIE 2 : ENVOYER RAPPELS RDV 24H AVANT
    // ==========================================
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString();
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString();

    // Récupérer les RDV de demain
    const { data: rdvs, error: rdvError } = await supabase
      .from('expert_appointments')
      .select(`
        id,
        scheduled_at,
        meet_link,
        users:user_id (
          first_name,
          last_name,
          email
        ),
        experts:expert_id (
          first_name,
          last_name
        )
      `)
      .eq('status', 'scheduled')
      .gte('scheduled_at', tomorrowStart)
      .lte('scheduled_at', tomorrowEnd);

    if (!rdvError && rdvs && rdvs.length > 0) {
      let remindersSent = 0;

      for (const rdv of rdvs) {
        try {
          const client = rdv.users as any;
          const expert = rdv.experts as any;

          if (!client || !expert) continue;

          const rdvDate = new Date(rdv.scheduled_at);
          const rdvDateStr = rdvDate.toISOString().split('T')[0];
          const rdvTimeStr = rdvDate.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          // Envoyer l'email de rappel
          const emailResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/emails/rdv-reminder`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientName: `${client.first_name} ${client.last_name}`,
                clientEmail: client.email,
                expertName: `${expert.first_name} ${expert.last_name}`,
                rdvDate: rdvDateStr,
                rdvTime: rdvTimeStr,
                meetLink: rdv.meet_link || 'https://meet.google.com/xxx'
              })
            }
          );

          if (emailResponse.ok) {
            remindersSent++;
            console.log(`✅ Rappel envoyé à ${client.email}`);
          }
        } catch (emailError) {
          console.error('Erreur envoi rappel:', emailError);
        }
      }

      results.reminders = {
        count: remindersSent,
        success: true
      };
    } else {
      results.reminders = { count: 0, success: true };
    }

    // ==========================================
    // RÉSULTAT FINAL
    // ==========================================
    console.log('✅ CRON job terminé:', results);

    return NextResponse.json({ 
      success: true,
      message: 'CRON job exécuté avec succès',
      results
    });

  } catch (error: any) {
    console.error('❌ Erreur CRON job:', error);
    return NextResponse.json({ 
      error: error.message,
      results 
    }, { status: 500 });
  }
}