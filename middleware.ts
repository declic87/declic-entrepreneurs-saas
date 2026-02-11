import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = request.nextUrl.pathname

  // 1. Protection : Redirection vers /auth/login si non connecté
  const protectedPaths = ['/admin', '/client', '/commercial', '/expert', '/dashboard']
  if (protectedPaths.some(p => path.startsWith(p)) && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Intelligence des Rôles (RBAC)
  if (session) {
    // ✅ CORRECTION : Récupérer le rôle depuis la table users
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single()

    const role = (userData?.role || 'CLIENT').toUpperCase()
    console.log("🔍 Middleware - Rôle détecté:", role, "pour path:", path)

    // Redirection automatique depuis le login ou le dashboard racine
    if (path === '/auth/login' || path === '/dashboard' || path === '/login') {
      const routes: Record<string, string> = {
        ADMIN: '/admin',
        HOS: '/commercial',
        CLOSER: '/commercial',
        SETTER: '/commercial',
        COMMERCIAL: '/commercial',
        EXPERT: '/expert',
        CLIENT: '/client',
      }
      const redirectUrl = routes[role] || '/client'
      console.log("🔍 Middleware - Redirection vers:", redirectUrl)
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // ✅ Protection des accès croisés
    if (path.startsWith('/admin') && role !== 'ADMIN') {
      console.log("❌ Middleware - Accès ADMIN refusé pour rôle:", role)
      return NextResponse.redirect(new URL('/client', request.url))
    }

    if (path.startsWith('/client') && role === 'ADMIN') {
      console.log("⚠️ Middleware - ADMIN accède à /client (autorisé)")
      // Autoriser l'admin à accéder à /client (pour tests)
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*', '/commercial/:path*', '/expert/:path*', '/auth/login', '/login', '/dashboard'],
}