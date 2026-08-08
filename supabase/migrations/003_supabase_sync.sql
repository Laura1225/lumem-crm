-- ══════════════════════════════════════════════════════════════
-- Lumem CRM — Supabase Data Sync + Workspace Collaboration
-- Substitui Firebase Realtime Database
-- Execute este arquivo no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ── Perfis de usuário ──
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'admin',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ── Store de dados do usuário (substitui Firebase RTDB) ──
-- Cada linha é um par (user_id, data_key, value) em JSON
create table if not exists public.user_store (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  primary key (user_id, data_key)
);

alter table public.user_store enable row level security;

-- Usuário gerencia seus próprios dados
drop policy if exists "Own data access" on public.user_store;
create policy "Own data access" on public.user_store
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Membros do workspace (colaboradores) ──
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_email text not null,
  member_id uuid references auth.users(id),
  role text not null default 'colaborador', -- 'colaborador' | 'admin'
  created_at timestamptz default now(),
  unique(owner_id, member_email)
);

alter table public.workspace_members enable row level security;

-- Admin gerencia membros do seu workspace
drop policy if exists "Owner manages members" on public.workspace_members;
create policy "Owner manages members" on public.workspace_members
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Colaborador vê sua própria associação
drop policy if exists "Members see own membership" on public.workspace_members;
create policy "Members see own membership" on public.workspace_members
  for select using (auth.uid() = member_id);

-- Colaboradores podem LER os dados do workspace do dono
drop policy if exists "Collaborator read access" on public.user_store;
create policy "Collaborator read access" on public.user_store
  for select using (
    exists (
      select 1 from public.workspace_members
      where owner_id = user_store.user_id
      and member_id = auth.uid()
    )
  );

-- Colaboradores podem ESCREVER dados compartilhados (demandas, clientes, etc.)
drop policy if exists "Collaborator write shared data" on public.user_store;
create policy "Collaborator write shared data" on public.user_store
  for all using (
    data_key in (
      'demandTasks','demandColumns','clients','leads','proposals',
      'briefings','contracts','portfolio','history','folders','archive'
    )
    and exists (
      select 1 from public.workspace_members
      where owner_id = user_store.user_id
      and member_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workspace_members
      where owner_id = user_store.user_id
      and member_id = auth.uid()
    )
  );

-- ── Habilitar Realtime no user_store ──
alter publication supabase_realtime add table public.user_store;

-- ── Trigger: criar perfil e linkar colaborador ao fazer signup ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
SET search_path = public
as $$
begin
  -- Cria perfil
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'admin'
  )
  on conflict (id) do nothing;

  -- Auto-vincula se este email foi convidado como colaborador
  update public.workspace_members
  set member_id = new.id
  where member_email = lower(new.email) and member_id is null;

  return new;
exception when others then
  raise log 'handle_new_user error: % %', sqlerrm, sqlstate;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
