import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = 'https://rbqbgwxbgbkmjwkdpvwp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicWJnd3hiZ2JrbWp3a2RwdndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMzE3NjMsImV4cCI6MjEwMTcwNzc2M30.YT7Axish7vl1reUWhcNxkJFc9RZlpgKkt-gnurQ45ng'

export async function GET() {
  let html = readFileSync(join(process.cwd(), 'public/app.html'), 'utf-8')

  html = html.replace(/__SUPABASE_URL__/g, SUPABASE_URL)
  html = html.replace(/__SUPABASE_ANON_KEY__/g, SUPABASE_ANON_KEY)

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
