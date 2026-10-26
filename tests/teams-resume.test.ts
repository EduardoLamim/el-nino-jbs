import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
let db: PGlite;
const sha = 'a'.repeat(40);
const reason = 'Retomada operacional após ativação do fluxo Power Automate; notificações históricas não reenviadas para evitar alertas desatualizados.';
beforeAll(async () => {
  db = new PGlite(); await db.exec('create role anon; create role authenticated;');
  for (const name of ['202610020001_impactos_jbs','202610130001_teams_notifications','202610140001_teams_operational','202610260001_teams_resume']) {
    await db.exec(readFileSync(`supabase/migrations/${name}.sql`,'utf8'));
  }
},30000);
beforeEach(async () => {
  await db.exec("reset role; truncate jbs_notifications.attempts,jbs_notifications.outbox,jbs_notifications.events,jbs_notifications.cursor,jbs_notifications.processed_snapshots,jbs_notifications.audit; update jbs_notifications.settings set mode='operational',operational_since='2026-10-19T18:07:47Z',operational_floor=13,impact_baseline='2026-10-19T18:00:00Z';");
  await db.query<Record<string, unknown>>('insert into jbs_notifications.cursor(id,commit_sha,snapshot) values(true,$1,$2)',[sha,{level:'normalidade',collected_at:'2026-10-25T00:00:00Z'}]);
  await db.exec("select jbs_notifications.add_event('old:'||i,'level','{}'::jsonb) from generate_series(1,51) i; update jbs_notifications.outbox set status='blocked',attempts=1 where event_key='old:14'; insert into jbs_notifications.attempts(id,delivery_id,number,outcome,http_status) select gen_random_uuid(),id,1,'blocked',400 from jbs_notifications.outbox where event_key='old:14';");
});
afterAll(async()=>{await db.close();});
const state = async () => (await db.query<Record<string, unknown>>("select operational_since::text at from jbs_notifications.settings")).rows[0]!.at;
const resume = async (commit=sha, at: unknown='2026-10-19T18:07:47Z') => db.query<Record<string, unknown>>('select jbs_notifications.resume_operational($1,$2::timestamptz,$3) r',[commit,at,reason]);
it('encerra 51 entregas, preserva eventos e tentativas, audita e permite somente novas transições',async()=>{
  const events=await db.query<Record<string, unknown>>('select * from jbs_notifications.events order by event_key');
  const attempts=await db.query<Record<string, unknown>>('select * from jbs_notifications.attempts');
  const cursor=await db.query<Record<string, unknown>>('select * from jbs_notifications.cursor');
  expect((await resume()).rows[0]!.r).toMatchObject({dismissed:51,mode:'operational',checkpoint:sha});
  expect((await db.query<Record<string, unknown>>("select count(*)::int n from jbs_notifications.outbox where status='dismissed'")).rows[0]!.n).toBe(51);
  expect(await db.query<Record<string, unknown>>('select * from jbs_notifications.events order by event_key')).toEqual(events);
  expect(await db.query<Record<string, unknown>>('select * from jbs_notifications.attempts')).toEqual(attempts);
  expect(await db.query<Record<string, unknown>>('select * from jbs_notifications.cursor')).toEqual(cursor);
  expect((await db.query<Record<string, unknown>>('select count(*)::int n from jbs_notifications.audit')).rows[0]!.n).toBe(52);
  expect((await db.query<Record<string, unknown>>("select jbs_notifications.execute('claim') r")).rows[0]!.r).toBeNull();
  const now=new Date().toISOString();
  await db.query<Record<string, unknown>>("select jbs_notifications.execute('snapshot',$1)",[{commit:'b'.repeat(40),previous_commit:sha,snapshot:{level:'atencao',collected_at:now,since:now,reasons:[]}}]);
  expect((await db.query<Record<string, unknown>>("select jbs_notifications.execute('claim') r")).rows[0]!.r).toMatchObject({mode:'operational',event:{kind:'level',is_test:false}});
});
it.each(['leased','sending','uncertain','retry','dead'])('recusa %s sem alterar nada',async status=>{
  await db.query<Record<string, unknown>>("update jbs_notifications.outbox set status=$1 where event_key='old:1'",[status]);
  const before=await state();
  await expect(resume()).rejects.toThrow('Unreviewed');
  expect(await state()).toBe(before);
  expect((await db.query<Record<string, unknown>>('select count(*)::int n from jbs_notifications.audit')).rows[0]!.n).toBe(0);
});
it('recusa checkpoint divergente e repetição com marco anterior',async()=>{
  await expect(resume('b'.repeat(40))).rejects.toThrow('checkpoint changed');
  await resume();
  await expect(resume()).rejects.toThrow('checkpoint changed');
});
it.each(['anon','authenticated'])('nega acesso público de %s',async role=>{
  await db.exec(`set role ${role}`); await expect(resume()).rejects.toThrow(); await db.exec('reset role');
});
it('rollback integral se auditoria falhar',async()=>{
  await db.exec("create function pg_temp.reject_audit() returns trigger language plpgsql as $$ begin raise exception 'audit failure'; end $$; create trigger fail_audit before insert on jbs_notifications.audit for each row execute function pg_temp.reject_audit();");
  try {
    await expect(resume()).rejects.toThrow('audit failure');
    expect((await db.query<Record<string, unknown>>("select count(*)::int n from jbs_notifications.outbox where status='dismissed'")).rows[0]!.n).toBe(0);
    expect(await state()).toContain('2026-10-19');
  } finally { await db.exec('drop trigger fail_audit on jbs_notifications.audit'); }
});
