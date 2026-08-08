import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /app is self-contained (has its own Supabase auth check)
  if (pathname === '/app') {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app'],
}
