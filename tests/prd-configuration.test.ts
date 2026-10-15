import {describe,it,expect,vi} from 'vitest';
import {randomBytes} from 'node:crypto';
import {configure,credentialNames,type Configuration} from '../scripts/prd/configure-core';
const config=():Configuration=>({project:'q'.repeat(20),pat:'mock-only',secrets:{...Object.fromEntries(credentialNames.map(k=>[k,randomBytes(48).toString('hex')])),JBS_IMPACT_PIN:'mock-pin',JBS_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_mock',MONITORAMENTO_CRON_SECRET_PRD:'x'.repeat(40),GITHUB_DISPATCH_TOKEN_PRD:'mock-only',TEAMS_WORKFLOW_URL_PRD:'https://example.logic.azure.com/mock'}});
describe('PRD configuração inicial — somente mocks',()=>{
 it('recusa HML e instalação existente antes de mutação',async()=>{
  const api=vi.fn().mockResolvedValue([{mode:'disabled',configured:1,deliveries:0}]);
  await expect(configure({...config(),project:'ufeahglxwygvlugfsopi'},api)).rejects.toThrow();expect(api).not.toHaveBeenCalled();
  await expect(configure(config(),api)).rejects.toThrow();expect(api).toHaveBeenCalledTimes(1);
 });
 it('configura escopos distintos e não ativa/baselineia/envia',async()=>{
  const api=vi.fn().mockResolvedValue([{mode:'disabled',configured:0,deliveries:0}]);
  expect(await configure(config(),api)).toEqual({configured:true,mode:'disabled',messages:0});
  expect(api).toHaveBeenCalledTimes(3);expect(api.mock.calls.map(c=>c[0])).toEqual(['/database/query','/database/query','/secrets']);
 });
 it('falha parcial interrompe sem retry e sem chamar Teams',async()=>{
  const api=vi.fn().mockResolvedValueOnce([{mode:'disabled',configured:0,deliveries:0}]).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('network'));
  await expect(configure(config(),api)).rejects.toThrow();expect(api).toHaveBeenCalledTimes(3);
 });
});
