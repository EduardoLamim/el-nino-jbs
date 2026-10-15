import { readFile,writeFile,unlink,rename,mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
// Local/CI verification only. Fixture artifacts can never be published by this script.
const snapshot='public/data/status.json';
const original=existsSync(snapshot)?await readFile(snapshot):null;
let created=false;
if(existsSync('dist'))throw new Error('Move any existing dist artifact aside before offline verification');
await mkdir('.local/tmp',{recursive:true});
const env={...process.env,APP_ENV:'production',PRD_SUPABASE_PROJECT_REF:'p'.repeat(20),VITE_SUPABASE_URL:`https://${'p'.repeat(20)}.supabase.co`,VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_offline_fixture',PAGES_BASE_PATH:'/el-nino-jbs/',ENABLE_HML_SIMULATION:'false',TEMP:resolve('.local/tmp'),TMP:resolve('.local/tmp'),TMPDIR:resolve('.local/tmp')};
function run(args:string[]){const r=spawnSync(process.execPath,args,{env,stdio:'inherit'});if(r.status!==0)throw new Error('Local verification failed');}
try {
 run(['--import','tsx','scripts/prd/fixture.ts']);
 if(!original){await writeFile(snapshot,await readFile('tests/fixtures/status-operacional.json'),{flag:'wx'});created=true;}
 run(['node_modules/vitest/vitest.mjs','run','--exclude','.local/**','--maxWorkers','4']);
 run(['node_modules/eslint/bin/eslint.js','.']);
 run(['node_modules/typescript/bin/tsc','--noEmit']);
 run(['node_modules/typescript/bin/tsc','--noEmit','-p','supabase/tsconfig.json']);
 run(['node_modules/vite/bin/vite.js','build','--mode','pages']);
 run(['--import','tsx','scripts/automation/validate.ts','--artifact']);
 const stamp=Date.now();
 await rename('dist',`.local/NOT-FOR-PUBLICATION-${stamp}`);
 console.log('Offline PRD validation passed. Artifact quarantined; no operational snapshot retained.');
}finally{
 if(existsSync('dist'))await rename('dist',`.local/FAILED-NOT-FOR-PUBLICATION-${Date.now()}`);
 if(created&&existsSync(snapshot))await unlink(snapshot);
 if(original)assert.ok((await readFile(snapshot)).equals(original),'Existing operational snapshot changed during verification');
}

