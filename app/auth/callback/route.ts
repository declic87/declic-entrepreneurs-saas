import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  console.log('🔄 Callback type:', type);

  if (!code) {
    console.log('⚠️ No code, redirect to login');
    return NextResponse.redirect(new URL('/login', requestUrl.origin));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Échange le code pour une session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('❌ Erreur exchange code:', error);
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
  }

  console.log('✅ Session établie pour:', data.user?.email);

  // ⭐ NOUVEAU : Si c'est un reset password, rediriger avec les tokens dans le hash
  if (type === 'recovery') {
    console.log('🔑 Reset password flow detected');
    
    const accessToken = data.session?.access_token;
    const refreshToken = data.session?.refresh_token;
    
    if (accessToken && refreshToken) {
      // Redirige avec les tokens dans le hash (comme Supabase le fait normalement)
      const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
      redirectUrl.hash = `access_token=${accessToken}&refresh_token=${refreshToken}&type=recovery`;
      
      return NextResponse.redirect(redirectUrl.toString());
    }
  }

  // ⭐ Flow normal (invitation, etc.)
  const user = data.user;

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role, status')
      .eq('auth_id', user.id)
      .single();

    // Si status = pending → Jamais créé de mot de passe
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

    // Rediriger selon le rôle
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

  console.log('⚠️ No user, redirect to login');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}
