-- Execute only after explicit approval, with the real PRD project already linked.
-- Configuration and Vault secret must exist. No duplicate job is allowed.
begin;
do $$ begin
 if current_setting('jbs.confirmation',true) is distinct from 'ATIVAR CRON PRD' then raise exception 'Explicit PRD activation required'; end if;
 if not exists(select 1 from monitoramento_prd.configuration) then raise exception 'PRD configuration required'; end if;
 if not exists(select 1 from vault.secrets where name='MONITORAMENTO_CRON_SECRET_PRD') then raise exception 'Vault secret required'; end if;
 if exists(select 1 from cron.job where jobname='monitoramento-prd-10min') then raise exception 'Job already exists; inspect instead of repeating'; end if;
end $$;
select cron.schedule('monitoramento-prd-10min', '2,12,22,32,42,52 * * * *',
 'select monitoramento_prd.trigger_dispatch();');
commit;
