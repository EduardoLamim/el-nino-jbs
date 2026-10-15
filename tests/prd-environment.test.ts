import { describe,it,expect,vi } from 'vitest';
import { mkdtemp,writeFile,readFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';import {join} from 'node:path';
import { publicEnvironment,HML_PROJECT,storageKey } from '../src/config/environment';
import { prdUrl } from '../supabase/functions/_shared/environment';
import { bootstrap } from '../scripts/prd/bootstrap';
import { parseStatus } from '../src/domain/contracts';
import status from './fixtures/status-operacional.json';
const ref='p'.repeat(20);
const env={APP_ENV:'production',PRD_SUPABASE_PROJECT_REF:ref,VITE_SUPABASE_URL:`https://${ref}.supabase.co`,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'};
describe('PRD — ambiente e inicialização isolados',()=>{
 it('aceita configuração pública PRD e HML apenas no contexto explícito correto',()=>{
  expect(publicEnvironment(env,true)?.ref).toBe(ref);
  expect(publicEnvironment({...env,APP_ENV:'hml',VITE_SUPABASE_URL:`https://${HML_PROJECT}.supabase.co`},true)?.mode).toBe('hml');
 });
 it.each([
  {...env,PRD_SUPABASE_PROJECT_REF:HML_PROJECT,VITE_SUPABASE_URL:`https://${HML_PROJECT}.supabase.co`},
  {...env,VITE_SUPABASE_URL:`https://${HML_PROJECT}.supabase.co`},
  {...env,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_fixture'},
  {...env,PRD_SUPABASE_PROJECT_REF:''}, {...env,VITE_ADMIN_TOKEN:'forbidden'},
  {...env,APP_ENV:'unknown'},
 ])('rejeita configuração cruzada/incompleta ou credencial privada', input=>expect(()=>publicEnvironment(input,true)).toThrow());
 it('Edge exige projeto PRD explícito e rejeita HML e URL divergente',()=>{
  expect(prdUrl('q'.repeat(20),`https://${'q'.repeat(20)}.supabase.co`)).toBe(`https://${'q'.repeat(20)}.supabase.co`);
  expect(()=>prdUrl(ref,env.VITE_SUPABASE_URL)).toThrow();
  expect(()=>prdUrl(HML_PROJECT,`https://${HML_PROJECT}.supabase.co`)).toThrow();
  expect(()=>prdUrl(ref,`https://${HML_PROJECT}.supabase.co`)).toThrow();
 });
 it('chaves operacionais não colidem entre projetos/ambientes',()=>{
  expect(storageKey('prd',ref,'impacto')).not.toBe(storageKey('hml',HML_PROJECT,'impacto'));
 });
 it('bootstrap exclusivo não consulta fontes quando já existe memória e não sobrescreve corrida',async()=>{
  const root=await mkdtemp(join(tmpdir(),'prd-bootstrap-'));const file=join(root,'status.json');
  try {
   const next=parseStatus(status);const pipeline=vi.fn().mockResolvedValue(next);
   await bootstrap(file,pipeline);expect(pipeline).toHaveBeenCalledTimes(1);
   await expect(bootstrap(file,pipeline)).rejects.toThrow('existe');expect(pipeline).toHaveBeenCalledTimes(1);
   expect(JSON.parse(await readFile(file,'utf8'))).toEqual(next);
   const raced=join(root,'raced.json');
   await expect(bootstrap(raced,async()=>{await writeFile(raced,'preservar');return next;})).rejects.toThrow();
   expect(await readFile(raced,'utf8')).toBe('preservar');
  }finally{await rm(root,{recursive:true,force:true});}
 });
});
