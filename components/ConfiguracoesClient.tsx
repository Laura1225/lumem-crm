'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { User, Building2, Users, Shield, Save } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface Props {
  profile: any
  members: Pick<Profile, 'id' | 'name' | 'email' | 'role' | 'created_at'>[]
  userId: string
}

export default function ConfiguracoesClient({ profile, members, userId }: Props) {
  const [tab, setTab] = useState<'perfil' | 'equipe' | 'workspace'>('perfil')
  const [name, setName] = useState(profile?.name || '')
  const [wsName, setWsName] = useState(profile?.workspaces?.name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const supabase = createClient()
  const router = useRouter()
  const isAdmin = profile?.role === 'admin'

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update({ name }).eq('id', userId)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function saveWorkspace() {
    setSaving(true)
    await supabase.from('workspaces').update({ name: wsName }).eq('id', profile?.workspace_id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function changeRole(memberId: string, role: string) {
    await supabase.from('profiles').update({ role }).eq('id', memberId)
    router.refresh()
  }

  const tabs = [
    { k: 'perfil' as const, label: 'Meu perfil', icon: User },
    { k: 'equipe' as const, label: 'Equipe', icon: Users },
    { k: 'workspace' as const, label: 'Estúdio', icon: Building2 },
  ]

  return (
    <div>
      <PageHeader title="Configurações" />

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {tabs.map(({ k, label, icon: Icon }) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? 'bg-accent-purple text-white' : 'bg-bg-hover text-text-secondary hover:text-text-primary'}`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {tab === 'perfil' && (
        <div className="card max-w-md">
          <h2 className="text-text-primary font-semibold mb-4">Informações pessoais</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input opacity-50 cursor-not-allowed" value={profile?.email || ''} disabled />
              <p className="text-text-muted text-xs mt-1">O e-mail não pode ser alterado aqui.</p>
            </div>
            <div>
              <label className="label">Função</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-hover border border-bg-border rounded-lg">
                <Shield size={14} className={isAdmin ? 'text-accent-purple' : 'text-text-muted'} />
                <span className="text-text-primary text-sm capitalize">{profile?.role}</span>
              </div>
            </div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary w-full justify-center disabled:opacity-60">
              <Save size={15} />{saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </div>
      )}

      {tab === 'equipe' && (
        <div className="max-w-2xl">
          <div className="card">
            <h2 className="text-text-primary font-semibold mb-4">Membros do estúdio</h2>
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-bg-hover rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-accent-purple/20 flex items-center justify-center text-sm font-bold text-accent-purple flex-shrink-0">
                    {m.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-medium truncate">{m.name}</p>
                    <p className="text-text-muted text-xs truncate">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && m.id !== userId ? (
                      <select
                        value={m.role}
                        onChange={e => changeRole(m.id, e.target.value)}
                        className="text-xs bg-bg border border-bg-border rounded-lg px-2 py-1 text-text-secondary outline-none focus:border-accent-purple"
                      >
                        <option value="member">Membro</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`badge text-xs ${m.role === 'admin' ? 'bg-accent-purple/15 text-accent-purple' : 'bg-bg text-text-muted'}`}>
                        {m.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-bg-border">
              <h3 className="text-text-secondary text-sm font-medium mb-3">Convidar membro</h3>
              <p className="text-text-muted text-xs mb-3">
                Compartilhe o link do sistema com seu colaborador. Ele cria a própria conta e entra no mesmo estúdio usando o código abaixo.
              </p>
              <div className="bg-bg-hover border border-bg-border rounded-lg p-3">
                <p className="text-text-muted text-xs mb-1">Código do estúdio:</p>
                <p className="text-accent-purple font-mono text-sm font-bold">{profile?.workspace_id?.slice(0, 8).toUpperCase()}</p>
              </div>
              <p className="text-text-muted text-xs mt-2">⚠️ Funcionalidade de convite por e-mail em breve.</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'workspace' && isAdmin && (
        <div className="card max-w-md">
          <h2 className="text-text-primary font-semibold mb-4">Configurações do estúdio</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Nome do estúdio</label>
              <input className="input" value={wsName} onChange={e => setWsName(e.target.value)} placeholder="Nome do seu estúdio" />
            </div>
            <button onClick={saveWorkspace} disabled={saving} className="btn-primary w-full justify-center disabled:opacity-60">
              <Save size={15} />{saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
