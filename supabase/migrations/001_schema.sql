-- ============================================================
-- LUMEM CRM — Schema inicial
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- Workspaces (estúdios / empresas)
create table if not exists workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  logo_url text,
  created_at timestamptz default now()
);

-- Perfis de usuário (extende auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  workspace_id uuid references workspaces on delete cascade,
  name text not null default '',
  email text not null default '',
  role text not null default 'member' check (role in ('admin','member')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Clientes
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  name text not null,
  email text,
  phone text,
  type text not null default 'freela' check (type in ('mensal','freela')),
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  avatar text,
  notes text,
  monthly_value numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Pastas de clientes
create table if not exists client_folders (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  client_id uuid references clients on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Colunas do Kanban de demandas
create table if not exists demand_columns (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  title text not null,
  color text not null default '#a855f7',
  position integer not null default 0,
  created_at timestamptz default now()
);

-- Demandas (cards do Kanban)
create table if not exists demands (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  column_id uuid references demand_columns on delete set null,
  client_id uuid references clients on delete set null,
  title text not null,
  description text,
  cover_image text,
  priority text not null default 'media' check (priority in ('baixa','media','alta')),
  due_date date,
  tags text[] default '{}',
  position integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Financeiro
create table if not exists financial (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  client_id uuid references clients on delete set null,
  type text not null check (type in ('receita','despesa')),
  description text not null,
  amount numeric(10,2) not null default 0,
  date date not null,
  status text not null default 'pendente' check (status in ('pago','pendente','cancelado')),
  category text,
  created_at timestamptz default now()
);

-- Propostas
create table if not exists proposals (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  client_id uuid references clients on delete set null,
  title text not null,
  content text,
  value numeric(10,2),
  status text not null default 'rascunho' check (status in ('rascunho','enviada','aprovada','recusada')),
  created_at timestamptz default now()
);

-- Briefings
create table if not exists briefings (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  client_id uuid references clients on delete set null,
  title text not null,
  answers jsonb default '{}',
  created_at timestamptz default now()
);

-- Contratos
create table if not exists contracts (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  client_id uuid references clients on delete set null,
  title text not null,
  content text,
  value numeric(10,2),
  status text not null default 'aguardando' check (status in ('ativo','encerrado','aguardando')),
  signed_at date,
  created_at timestamptz default now()
);

-- Portfólio
create table if not exists portfolio_items (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  title text not null,
  description text,
  image_url text,
  tags text[] default '{}',
  client_name text,
  created_at timestamptz default now()
);

-- CRM (pipeline de vendas)
create table if not exists crm_contacts (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  name text not null,
  email text,
  phone text,
  company text,
  stage text not null default 'lead',
  notes text,
  value numeric(10,2),
  created_at timestamptz default now()
);

-- Log de atividades
create table if not exists activities (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces on delete cascade not null,
  user_id uuid references profiles on delete set null,
  icon text not null default '📝',
  section text not null,
  action text not null,
  detail text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada workspace só vê os próprios dados
-- ============================================================

alter table workspaces enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_folders enable row level security;
alter table demand_columns enable row level security;
alter table demands enable row level security;
alter table financial enable row level security;
alter table proposals enable row level security;
alter table briefings enable row level security;
alter table contracts enable row level security;
alter table portfolio_items enable row level security;
alter table crm_contacts enable row level security;
alter table activities enable row level security;

-- Helper function: retorna workspace_id do usuário logado
create or replace function get_my_workspace_id()
returns uuid language sql stable
as $$ select workspace_id from profiles where id = auth.uid() $$;

-- Policies: usuário só acessa dados do seu workspace
create policy "workspace_isolation" on workspaces
  for all using (id = get_my_workspace_id());

create policy "workspace_isolation" on profiles
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on clients
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on client_folders
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on demand_columns
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on demands
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on financial
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on proposals
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on briefings
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on contracts
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on portfolio_items
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on crm_contacts
  for all using (workspace_id = get_my_workspace_id());

create policy "workspace_isolation" on activities
  for all using (workspace_id = get_my_workspace_id());

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================

create or replace function update_updated_at()
returns trigger language plpgsql
as $$ begin new.updated_at = now(); return new; end $$;

create trigger clients_updated_at before update on clients
  for each row execute function update_updated_at();

create trigger demands_updated_at before update on demands
  for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER: cria perfil automaticamente no cadastro
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer
as $$
declare
  ws_id uuid;
begin
  -- Cria workspace para o novo usuário (ou vincula ao existente via invite)
  insert into workspaces (name) values (coalesce(new.raw_user_meta_data->>'workspace_name', 'Meu Estúdio'))
  returning id into ws_id;

  insert into profiles (id, workspace_id, name, email, role)
  values (
    new.id,
    ws_id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'admin'
  );

  -- Cria colunas padrão do Kanban
  insert into demand_columns (workspace_id, title, color, position) values
    (ws_id, 'A fazer', '#6366f1', 0),
    (ws_id, 'Em andamento', '#f59e0b', 1),
    (ws_id, 'Revisão', '#ec4899', 2),
    (ws_id, 'Concluído', '#22c55e', 3);

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
