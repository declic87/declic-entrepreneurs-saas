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
    const role = session.user.user_metadata?.role?.toUpperCase() || 'CLIENT'

    // Redirection automatique depuis le login ou le dashboard racine
    if (path === '/auth/login' || path === '/dashboard' || path === '/login') {
      const routes: Record<string, string> = {
        ADMIN: '/admin',
        HOS: '/commercial',
        CLOSER: '/commercial',
        SETTER: '/commercial',
        EXPERT: '/expert',
        CLIENT: '/client',
      }
      return NextResponse.redirect(new URL(routes[role] || '/client', request.url))
    }

    // Protection des accès croisés (ex: un client ne peut pas aller sur /admin)
    if (path.startsWith('/admin') && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/client', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*', '/commercial/:path*', '/expert/:path*', '/auth/login', '/login', '/dashboard'],
}