import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_EMAIL = 'serveupadmin@gmail.com'

const PROTECTED = ['/dashboard', '/perfil', '/torneos']
const AUTH_PAGES = ['/login', '/registro']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const isProtected = PROTECTED.some((r) => path.startsWith(r))
  const isAuthPage = AUTH_PAGES.some((r) => path.startsWith(r))

  // Unauthenticated user tries to access a protected route
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Non-admin tries to access /dashboard
  if (path.startsWith('/dashboard') && user && user.email !== ADMIN_EMAIL) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Authenticated user tries to access login/registro
  if (isAuthPage && user) {
    const dest = user.email === ADMIN_EMAIL ? '/dashboard' : '/'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
