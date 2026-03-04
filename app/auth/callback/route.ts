import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Erreur callback:', error);
      return NextResponse.redirect(new URL('/login?error=auth_callback_failed', requestUrl.origin));
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('role, status')
        .eq('auth_id', user.id)
        .single();

      // ⭐ Si status = pending, rediriger vers création mot de passe
      if (userData?.status === 'pending') {
        return NextResponse.redirect(new URL('/auth/set-password', requestUrl.origin));
      }

      const role = userData?.role || type;

      if (role === 'EXPERT') {
        return NextResponse.redirect(new URL('/expert', requestUrl.origin));
      } else if (role === 'HOS' || role === 'CLOSER' || role === 'SETTER') {
        return NextResponse.redirect(new URL('/hos', requestUrl.origin));
      } else if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', requestUrl.origin));
      } else if (role === 'CLIENT') {
        return NextResponse.redirect(new URL('/client/dashboard', requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}