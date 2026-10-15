import { createHash } from 'node:crypto';
import { validPrdProject } from '../../src/config/environment';
export type Configuration = {project:string;pat:string;secrets:Record<string,string>};
export type Api=(path:string,body?:unknown)=>Promise<unknown>;
export const credentialNames=['JBS_IMPACT_BACKEND_TOKEN','TEAMS_DB_INGEST_TOKEN_PRD','TEAMS_DB_WORKER_TOKEN_PRD','TEAMS_DB_ADMIN_TOKEN_PRD','TEAMS_WAKE_TOKEN_PRD','TEAMS_ADMIN_TOKEN_PRD'] as const;
export function validateConfiguration(c:Configuration) {
 if(!validPrdProject(c.project)||c.project==='p'.repeat(20)||!c.pat)throw new Error('Invalid PRD identity');
 for(const key of credentialNames)if(!/^[a-f0-9]{96}$/.test(c.secrets[key]??''))throw new Error('Dedicated credential format invalid');
 if(new Set(credentialNames.map(k=>c.secrets[k])).size!==credentialNames.length)throw new Error('Credentials must be distinct');
 if(!c.secrets.JBS_IMPACT_PIN||c.secrets.JBS_IMPACT_PIN.length>128||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(c.secrets.JBS_SUPABASE_PUBLISHABLE_KEY??'')||(c.secrets.MONITORAMENTO_CRON_SECRET_PRD?.length??0)<32||!c.secrets.GITHUB_DISPATCH_TOKEN_PRD)throw new Error('Missing PRD configuration');
 const url=new URL(c.secrets.TEAMS_WORKFLOW_URL_PRD??'');
 if(url.protocol!=='https:'||url.username||url.password||url.hash||(url.port&&url.port!=='443')||!(url.hostname.endsWith('.logic.azure.com')||url.hostname.endsWith('.environment.api.powerplatform.com')))throw new Error('Invalid Workflow capability URL');
}
/** One initial installation only. Values must already be retained by the administrator. */
export async function configure(c:Configuration,api:Api) {
 validateConfiguration(c);
 const query=(query:string,parameters:unknown[]=[])=>api('/database/query',{query,parameters});
 const before=await query("select (select mode from jbs_notifications.settings) as mode,(select count(*) from jbs_notifications.credentials)+(select count(*) from jbs_private.backend_credential)+(select count(*) from monitoramento_prd.configuration) as configured,(select count(*) from jbs_notifications.outbox) as deliveries") as {mode:string;configured:number;deliveries:number}[];
 if(before[0]?.mode!=='disabled'||Number(before[0].configured)!==0||Number(before[0].deliveries)!==0)throw new Error('Fresh disabled installation required; inspect instead of repeating');
 const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
 // Database state commits first. Partial failure blocks repeating this initial configuration.
 await query(`with impact as (insert into jbs_private.backend_credential(singleton,token_sha256) values(true,$1)),
 team as (insert into jbs_notifications.credentials(scope,token_sha256) select scope,token_sha256 from jsonb_to_recordset($2::jsonb) as x(scope text,token_sha256 text)),
 config as (insert into monitoramento_prd.configuration(id,project_ref) values(true,$3))
 select vault.create_secret($4,'MONITORAMENTO_CRON_SECRET_PRD')`,[
 hash(c.secrets.JBS_IMPACT_BACKEND_TOKEN!),JSON.stringify(['ingest','worker','admin'].map(scope=>({scope,token_sha256:hash(c.secrets[`TEAMS_DB_${scope.toUpperCase()}_TOKEN_PRD`]!)}))),c.project,c.secrets.MONITORAMENTO_CRON_SECRET_PRD]);
 const values={...c.secrets,PRD_SUPABASE_PROJECT_REF:c.project,JBS_ALLOWED_ORIGIN:'https://eduardolamim.github.io'};
 await api('/secrets',Object.entries(values).map(([name,value])=>({name,value})));
 // No GitHub mutation, function deployment, baseline, claim or notification here.
 return {configured:true,mode:'disabled',messages:0};
}
