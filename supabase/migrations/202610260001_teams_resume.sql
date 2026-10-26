-- Installs an administrative-only operation; installation does not change queue or mode.
begin;
set local lock_timeout='2s';
set local statement_timeout='25s';
create function jbs_notifications.resume_operational(expected_commit text, expected_since timestamptz, reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s jbs_notifications.settings; c jbs_notifications.cursor; cutoff timestamptz; floor_seq bigint; closed integer;
begin
  select * into s from jbs_notifications.settings where id=true for update;
  select * into c from jbs_notifications.cursor where id=true for update;
  if s.mode is distinct from 'operational' or s.operational_since is distinct from expected_since
    or expected_since is null or expected_commit is null or expected_commit !~ '^[a-f0-9]{40}$'
    or c.commit_sha is distinct from expected_commit or s.impact_baseline is null then
    raise exception 'Operational state or checkpoint changed; inspect before retry';
  end if;
  if reason is distinct from 'Retomada operacional após ativação do fluxo Power Automate; notificações históricas não reenviadas para evitar alertas desatualizados.' then
    raise exception 'Explicit audited reason required';
  end if;
  if exists(select 1 from jbs_notifications.outbox where status in ('leased','sending','uncertain','retry','dead')) then
    raise exception 'Unreviewed delivery state; no changes applied';
  end if;
  cutoff:=clock_timestamp();
  select coalesce(max(sequence),0) into floor_seq from jbs_notifications.outbox;
  with dismissed as (
    update jbs_notifications.outbox set status='dismissed',updated_at=cutoff
      where sequence<=floor_seq and status in ('pending','blocked')
      returning id
  ) insert into jbs_notifications.audit(action,reference,reason)
      select 'resolve',id::text,reason from dismissed;
  get diagnostics closed=row_count;
  update jbs_notifications.settings set operational_since=cutoff,operational_floor=floor_seq,live_until=null where id=true;
  insert into jbs_notifications.audit(action,reference,reason) values('resume_operational',c.commit_sha,
    reason||'; cutoff='||cutoff::text||'; floor='||floor_seq::text||'; dismissed='||closed::text);
  return jsonb_build_object('mode','operational','checkpoint',c.commit_sha,'operational_since',cutoff,
    'operational_floor',floor_seq,'dismissed',closed);
end $$;
revoke all on function jbs_notifications.resume_operational(text,timestamptz,text) from public,anon,authenticated;
commit;
