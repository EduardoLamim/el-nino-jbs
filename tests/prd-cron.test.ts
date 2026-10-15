import { PGlite } from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';import {it,expect} from 'vitest';
it('schema Cron PRD válido, privado, sem ativação ou destino HML',async()=>{
 const db=new PGlite();try{
  await db.exec('create role anon;create role authenticated;create schema vault;create table vault.decrypted_secrets(name text,decrypted_secret text);create table vault.secrets(name text);create schema net;create schema cron;create table cron.job(jobname text,schedule text,active boolean);');
  await db.exec("create function net.http_post(url text,headers jsonb,body jsonb,timeout_milliseconds int) returns bigint language sql as $$ select 1::bigint $$;create function cron.schedule(name text,schedule text,command text) returns bigint language sql as $$ insert into cron.job values(name,schedule,true);select 1::bigint $$;");
  const migration=readFileSync('supabase/migrations/202610050001_monitoramento_cron.sql','utf8').replace(/^create extension.*;$/gm,'');await db.exec(migration);
  expect((await db.query('select * from cron.job')).rows).toHaveLength(0);
  await expect(db.exec("insert into monitoramento_prd.configuration values(true,'ufeahglxwygvlugfsopi')")).rejects.toThrow();
  await db.exec('set role anon');await expect(db.exec('select * from monitoramento_prd.configuration')).rejects.toThrow();await db.exec('reset role');
  await expect(db.exec(readFileSync('scripts/automation/activate-prd-cron.sql','utf8'))).rejects.toThrow();await db.exec('rollback');
  expect((await db.query('select * from cron.job')).rows).toHaveLength(0);
 }finally{await db.close();}
},30000);
