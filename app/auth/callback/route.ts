import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  console.log('🔄 Callback type:', type);

  // ⭐ RECOVERY : On redirige vers reset-password AVEC les query params
  if (type === 'recovery' && code) {
    console.log('🔑 Reset password flow detected');
    
    // On passe le code dans l\'URL pour que la page client puisse l\'échanger
    return NextResponse.redirect(
      new URL(`/auth/reset-password?code=${code}`, requestUrl.origin)
    );
  }

  // ⭐ Flow normal (invitation, etc.)
  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('❌ Erreur callback:', error);
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role, status')
        .eq('auth_id', user.id)
        .single();

      const needsPassword = userData?.status === 'pending';

      console.log('👤 User:', user.email);
      console.log('📊 Status:', userData?.status);
      console.log('🔑 Needs password:', needsPassword);

      if (needsPassword) {
        console.log('➡️ Redirect to set-password');
        return NextResponse.redirect(new URL('/auth/set-password', requestUrl.origin));
      }

      const role = userData?.role || type;

      console.log('✅ User has password, redirect to dashboard. Role:', role);

      if (role === 'EXPERT') {
        return NextResponse.redirect(new URL('/expert', requestUrl.origin));
      } else if (role === 'HOS' || role === 'CLOSER' || role === 'SETTER') {
        return NextResponse.redirect(new URL('/commercial', requestUrl.origin));
      } else if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', requestUrl.origin));
      } else if (role === 'CLIENT') {
        return NextResponse.redirect(new URL('/client/dashboard', requestUrl.origin));
      }
    }
  }

  console.log('⚠️ No code or user, redirect to login');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
