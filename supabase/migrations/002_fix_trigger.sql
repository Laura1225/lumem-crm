-- ============================================================
-- CORREÇÃO DO TRIGGER DE CADASTRO
-- Execute este SQL no SQL Editor do Supabase
-- ============================================================

-- Recria a função com search_path correto (corrige "Database error saving new user")
create or replace function handle_new_user()
returns trigger language plpgsql security definer
SET search_path = public
as $$
declare
  ws_id uuid;
begin
  -- Cria workspace
  insert into public.workspaces (name)
  values (coalesce(new.raw_user_meta_data->>'workspace_name', 'Meu Estúdio'))
  returning id into ws_id;

  -- Cria perfil admin
  insert into public.profiles (id, workspace_id, name, email, role)
  values (
    new.id,
    ws_id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'admin'
  );

  -- Cria colunas padrão do Kanban
  insert into public.demand_columns (workspace_id, title, color, position) values
    (ws_id, 'A fazer', '#FF0A33', 0),
    (ws_id, 'Em andamento', '#f59e0b', 1),
    (ws_id, 'Revisão', '#FF5470', 2),
    (ws_id, 'Concluído', '#8fe3ac', 3);

  return new;
exception when others then
  -- Loga o erro mas não bloqueia o cadastro
  raise log 'handle_new_user error: % %', sqlerrm, sqlstate;
  return new;
end $$;

-- Recria o trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
