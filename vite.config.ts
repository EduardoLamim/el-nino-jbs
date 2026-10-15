import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { basePages, validarAmbientePublico } from './scripts/automation/pages-config';

export default defineConfig(({ mode, command }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  if (command==='build' && env.APP_ENV !== 'production') throw new Error('Build deste checkout exige production');
  if (command==='build' && env.GITHUB_REPOSITORY && env.GITHUB_REPOSITORY!=='EduardoLamim/el-nino-jbs') throw new Error('Repositório incompatível');
  if (command==='build' && env.PAGES_BASE_PATH && env.PAGES_BASE_PATH!=='/el-nino-jbs/') throw new Error('Base path PRD inválido');
  validarAmbientePublico(env, command==='build' || process.env.REQUIRE_PUBLIC_CONFIG === 'true');
  return { plugins: [react()], define: { __APP_ENV__: JSON.stringify('production'), __PRD_PROJECT_REF__: JSON.stringify(env.PRD_SUPABASE_PROJECT_REF ?? ''), __HML_SIMULATION__: JSON.stringify(false) }, base: mode === 'pages' ? basePages() : './', build: { manifest: true } };
});
