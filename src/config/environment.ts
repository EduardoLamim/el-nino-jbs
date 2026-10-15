export const HML_PROJECT = 'ufeahglxwygvlugfsopi';
export const PRD_REPOSITORY = 'EduardoLamim/el-nino-jbs';
export function validPrdProject(ref: unknown): ref is string {
  return typeof ref === 'string' && /^[a-z]{20}$/.test(ref) && ref !== HML_PROJECT;
}
export function publicEnvironment(env: Record<string,string|undefined>, required = false) {
  if(Object.keys(env).some(k=>k.startsWith('VITE_')&&!['VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY'].includes(k))) throw new Error('Variável pública não autorizada');
  const mode=env.APP_ENV ?? 'production';
  const ref=mode==='hml'?HML_PROJECT:env.PRD_SUPABASE_PROJECT_REF;
  if(env.REQUIRE_PUBLIC_CONFIG==='true' && ref==='pppppppppppppppppppp') throw new Error('Fixture project is not publishable');
  const url=env.VITE_SUPABASE_URL, key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!required&&!url&&!key) return;
  if(!['production','hml'].includes(mode)||!ref||(mode==='production'&&!validPrdProject(ref))||url!==`https://${ref}.supabase.co`||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key??'')) throw new Error('Configuração pública incompatível com o ambiente');
  return {mode,ref,url,key:key!};
}
export const storageKey=(environment:string,project:string,kind:string)=>`jbs:${environment}:${project}:${kind}:v1`;
