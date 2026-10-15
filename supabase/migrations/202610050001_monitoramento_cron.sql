-- Somente orquestração PRD. Nenhum dado ambiental ou segredo literal.
create extension if not exists pg_cron;
create extension if not exists pg_net;
create schema if not exists monitoramento_prd;
revoke all on schema monitoramento_prd from public, anon, authenticated;

create table monitoramento_prd.configuration (
 id boolean primary key default true check(id),
 project_ref text not null check(project_ref ~ '^[a-z]{20}$' and project_ref <> 'ufeahglxwygvlugfsopi')
);
revoke all on monitoramento_prd.configuration from public,anon,authenticated;
alter table monitoramento_prd.configuration enable row level security;
-- Empty until explicit PRD configuration; no Cron activation.
create table if not exists monitoramento_prd.dispatch_requests (
  request_id bigint primary key,
  expected_at timestamptz not null,
  requested_at timestamptz not null default clock_timestamp()
);
revoke all on monitoramento_prd.dispatch_requests from public, anon, authenticated;
alter table monitoramento_prd.dispatch_requests enable row level security;

create or replace function monitoramento_prd.trigger_dispatch()
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  credential text;
  ref text;
  request_id bigint;
  expected_at timestamptz := to_timestamp(floor((extract(epoch from statement_timestamp()) - 120) / 600) * 600 + 120);
begin
  select project_ref into strict ref from monitoramento_prd.configuration where id=true;
  select decrypted_secret into strict credential from vault.decrypted_secrets
    where name = 'MONITORAMENTO_CRON_SECRET_PRD';
  if length(credential) < 32 then raise exception 'Credencial do agendador indisponível'; end if;
  select net.http_post(
    url := 'https://' || ref || '.supabase.co/functions/v1/trigger-monitoramento',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || credential),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  ) into request_id;
  insert into monitoramento_prd.dispatch_requests(request_id, expected_at) values (request_id, expected_at);
  return request_id;
end;
$$;
revoke all on function monitoramento_prd.trigger_dispatch() from public, anon, authenticated;
-- Ativação deliberadamente separada: somente após provisionamento e teste real da Edge.
