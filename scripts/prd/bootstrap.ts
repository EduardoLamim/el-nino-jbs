import { access, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { coletar } from '../collectors/pipeline';
import { validarStatusPublicavel } from '../automation/status';
import { validPrdProject } from '../../src/config/environment';
/** First PRD acquisition only; never erases history or fabricates normality. */
export async function bootstrap(destination:string, pipeline=coletar) {
 // Exclusive open after collection also prevents a racing writer from being overwritten.
 try { await access(destination); throw new Error('Snapshot já existe; use atualização normal'); } catch(e) { if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e; }
 const next=validarStatusPublicavel(await pipeline());
 await writeFile(destination,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 return next;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.env.APP_ENV!=='production'||!validPrdProject(process.env.PRD_SUPABASE_PROJECT_REF)||process.env.PRD_SUPABASE_PROJECT_REF==='pppppppppppppppppppp'||process.env.PRD_CONFIRM_BOOTSTRAP!=='COLETAR PRD') throw new Error('Bootstrap PRD exige configuração e confirmação explícita');
 await bootstrap('public/data/status.json');
 console.log('Primeiro snapshot PRD coletado e validado. Nenhum Cron, Teams ou publicação foi ativado.');
}
