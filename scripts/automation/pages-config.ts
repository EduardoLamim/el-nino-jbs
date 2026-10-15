import { publicEnvironment } from '../../src/config/environment';
export function basePages(env: Record<string, string | undefined> = process.env) {
  const repo = env.GITHUB_REPOSITORY?.split('/')[1];
  const base = env.PAGES_BASE_PATH || (repo ? (repo.endsWith('.github.io') ? '/' : `/${repo}/`) : '/el-nino-jbs/');
  if (!/^\/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*$/.test(base)) throw new Error('PAGES_BASE_PATH deve ser um caminho absoluto com barra final.');
  return base;
}

export function validarAmbientePublico(env: Record<string,string|undefined>, exigir=false) { return publicEnvironment(env,exigir); }
