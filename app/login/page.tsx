'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [studio, setStudio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
    } else {
      if (!name.trim()) { setError('Insira seu nome.'); setLoading(false); return }
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name, workspace_name: studio || `${name}'s Studio` } }
      })
      if (error) {
        if (error.message.includes('Database error')) {
          setError('Erro ao criar conta. Tente novamente.')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }
      setError('✅ Conta criada! Verifique seu e-mail e faça login.')
      setMode('login')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(600px circle at 50% 30%, rgba(255,10,51,0.12) 0%, rgba(255,10,51,0.04) 40%, transparent 70%), #101010'
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'var(--grad-red)', boxShadow: 'var(--glow-red)' }}
          >
            <span className="text-2xl font-black text-white">L</span>
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Lumem CRM</h1>
          <p className="text-text-muted text-sm mt-1">Gestão criativa do seu estúdio</p>
        </div>

        {/* Card */}
        <div
          className="rounded-modal p-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border-strong)', boxShadow: '0 8px 48px rgba(0,0,0,0.7)' }}
        >
          <div className="flex mb-6 rounded-lg p-1" style={{ background: 'var(--bg-hover)' }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
                style={mode === m
                  ? { background: 'var(--grad-red)', color: '#fff', boxShadow: 'var(--glow-red)' }
                  : { color: 'var(--text-secondary)' }
                }
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="label">Seu nome</label>
                  <input className="input" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Laura Silva" required />
                </div>
                <div>
                  <label className="label">Nome do estúdio</label>
                  <input className="input" value={studio} onChange={e => setStudio(e.target.value)}
                    placeholder="Lumem Studio" />
                </div>
              </>
            )}
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="laura@lumem.com" required />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} />
            </div>

            {error && (
              <p className={`text-xs rounded-lg px-3 py-2 ${
                error.startsWith('✅')
                  ? 'text-green-400'
                  : 'text-red-400'
              }`} style={{ background: error.startsWith('✅') ? 'rgba(143,227,172,0.1)' : 'rgba(255,10,51,0.1)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 text-sm disabled:opacity-60">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Lumem CRM © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
