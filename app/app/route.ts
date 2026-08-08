import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  let html = readFileSync(join(process.cwd(), 'public/app.html'), 'utf-8')

  // Inject Supabase credentials at serve time
  html = html.replace(/__SUPABASE_URL__/g, process.env.NEXT_PUBLIC_SUPABASE_URL || '')
  html = html.replace(/__SUPABASE_ANON_KEY__/g, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
