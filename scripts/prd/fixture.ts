import { readFile, writeFile } from 'node:fs/promises';
import { coletar } from '../collectors/pipeline';
import { aplicarMotor } from '../../src/domain/alert-engine';
import { urls, urlPrevisaoEpagri } from '../collectors/sources';
/** Offline fixture generation; never consults a source or imports an HML snapshot. */
export async function fixture() {
 const read=async(name:string)=>JSON.parse(await readFile(`tests/fixtures/${name}.json`,'utf8'));
 const html=(v:unknown)=>`<div id="app" data-page="${JSON.stringify(v).replaceAll('&','&amp;').replaceAll('"','&quot;')}"></div>`;
 const responses=new Map<string,string>([
 [urls.situacao_atual,JSON.stringify(await read('situacao-atencao'))], [urls.alertas_ativo,JSON.stringify(await read('alertas-null'))],
 [urls.rios,html(await read('rios'))],[urls.chuvas,html(await read('chuvas'))],[urls.barragens,html(await read('barragens'))],
 [urls.epagri,JSON.stringify(await read('epagri-municipio'))],[urlPrevisaoEpagri,JSON.stringify(await read('epagri-itajai'))],
 ]);
 const status=await coletar(async url=>{const body=responses.get(url);if(!body)throw new Error('Offline fixture only');return new Response(body);});
 const at='2026-10-01T20:00:00.000Z';
 status.atualizado_em=at;delete status.motor;
 for(const f of Object.values(status.fontes)){f.coletado_em=at;for(const r of f.requisicoes??[])r.coletado_em=at;}
 if(status.blumenau)status.blumenau.coletado_em=at;
 return aplicarMotor(status);
}
await writeFile('tests/fixtures/status-operacional.json',JSON.stringify(await fixture(),null,2)+'\n');
