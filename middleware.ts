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
  const protectedPaths = ['/admin', '/client', '/commercial', '/expert', '/setter', '/hos']
  if (protectedPaths.some(p => path.startsWith(p)) && !session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 2. Intelligence des Rôles (RBAC)
  if (session) {
    // ✅ Récupérer le rôle depuis la table users
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single()

    const role = (userData?.role || 'CLIENT').toUpperCase()
    console.log("🔍 Middleware - Rôle détecté:", role, "pour path:", path)

    // ✅ CORRECTION : Routes spécifiques pour chaque rôle
    const routes: Record<string, string> = {
      ADMIN: '/admin',
      HOS: '/hos',              // ✅ CORRIGÉ
      CLOSER: '/commercial',    // ✅ Closer = Commercial
      SETTER: '/setter',        // ✅ CORRIGÉ
      COMMERCIAL: '/commercial',
      EXPERT: '/expert',
      CLIENT: '/client',
    }

    // Redirection automatique depuis le login ou le dashboard racine
    if (path === '/auth/login' || path === '/dashboard' || path === '/login') {
      const redirectUrl = routes[role] || '/client'
      console.log("🔍 Middleware - Redirection vers:", redirectUrl)
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // ✅ Protection des accès croisés
    const roleToPath: Record<string, string> = {
      ADMIN: '/admin',
      HOS: '/hos',
      SETTER: '/setter',
      CLOSER: '/commercial',
      COMMERCIAL: '/commercial',
      EXPERT: '/expert',
      CLIENT: '/client',
    }

    const allowedPath = roleToPath[role]

    // Vérifier si l'utilisateur essaie d'accéder à un espace qui n'est pas le sien
    if (allowedPath && !path.startsWith(allowedPath) && !path.startsWith('/auth')) {
      // Exception : ADMIN peut tout voir
      if (role !== 'ADMIN') {
        console.log("❌ Middleware - Accès refusé. Rôle:", role, "Path:", path)
        return NextResponse.redirect(new URL(allowedPath, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/client/:path*', 
    '/commercial/:path*', 
    '/expert/:path*', 
    '/setter/:path*',      // ✅ AJOUTÉ
    '/hos/:path*',         // ✅ AJOUTÉ
    '/auth/login', 
    '/login', 
    '/dashboard'
  ],
}