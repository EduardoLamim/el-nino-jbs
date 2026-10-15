import { readFileSync } from 'node:fs';import { expect,it } from 'vitest';
it('PRD cannot include simulator even in a development build; CI cannot publish fixture',()=>{
 const vite=readFileSync('vite.config.ts','utf8');expect(vite).toContain('__HML_SIMULATION__: JSON.stringify(false)');
 const ci=readFileSync('.github/workflows/ci.yml','utf8');expect(ci).toContain('npm run prd:verify');expect(ci).not.toContain('upload-pages-artifact');
 const deploy=readFileSync('.github/workflows/deploy-pages.yml','utf8');expect(deploy).toContain("REQUIRE_PUBLIC_CONFIG: 'true'");expect(deploy).not.toContain('sb_publishable_offline_fixture');
});
