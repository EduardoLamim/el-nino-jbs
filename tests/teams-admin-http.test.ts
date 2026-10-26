import { describe, expect, it } from 'vitest';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const ps7 = process.env.POWERSHELL7_EXE ?? 'pwsh';
function run(exe: string, command: string) {
  return new Promise<{code:number|null;out:string}>((resolve,reject) => {
    const p=spawn(exe,['-NoProfile','-NonInteractive','-Command',command],{windowsHide:true});
    let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);p.on('error',reject);p.on('close',code=>resolve({code,out}));
  });
}
describe.skipIf(process.platform !== 'win32')('Transporte administrativo PS5.1/7, sem acesso remoto',()=>{
  it.each(['powershell.exe',ps7])('DirectConnection contorna proxy inválido por requisição em %s',async exe=>{
    const bodies:string[]=[];
    const server=createServer((req,res)=>{let b='';req.on('data',d=>b+=d);req.on('end',()=>{bodies.push(b);res.writeHead(req.url==='/denied'?401:200,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:true}));});});
    await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
    const port=(server.address() as {port:number}).port;
    try {
      const result=await run(exe,`$ErrorActionPreference='Stop'; . ./scripts/teams/admin-http.ps1; $old=[Net.ServicePointManager]::SecurityProtocol; [Net.WebRequest]::DefaultWebProxy=New-Object Net.WebProxy('http://127.0.0.1:1'); $env:HTTP_PROXY='http://127.0.0.1:1'; $env:HTTPS_PROXY='http://127.0.0.1:1'; $r=Invoke-TeamsAdminHttp -Uri 'http://127.0.0.1:${port}/ok' -Headers @{} -Body '{"query":"select 1"}' -DirectConnection; if(!$r.ok -or [Net.ServicePointManager]::SecurityProtocol -ne $old){exit 2}; try { Invoke-TeamsAdminHttp -Uri 'http://127.0.0.1:${port}/denied' -Headers @{} -Body '{}' -DirectConnection; exit 3 } catch { $f=Get-TeamsAdminHttpFailure $_.Exception; if($f.Category -ne 'authentication_rejected' -or $f.HttpStatus -ne 401){Write-Output $f.Category;exit 4} }; if([Net.ServicePointManager]::SecurityProtocol -ne $old){exit 5}; Write-Output 'DIRECT_OK_TLS_RESTORED'`);
      expect(result.code,result.out).toBe(0);expect(result.out).toContain('DIRECT_OK_TLS_RESTORED');expect(bodies).toEqual(['{"query":"select 1"}','{}']);
    } finally {await new Promise<void>((r,j)=>server.close(e=>e?j(e):r()));}
  },30000);
  it.each(['powershell.exe',ps7])('gates de ativação interrompem antes do PAT em %s',async exe=>{
    const r=await run(exe,`function Read-Host { param($Prompt,[switch]$AsSecureString); if($AsSecureString){throw 'PAT_REACHED'}; return 'CANCELAR' }; try { & ./scripts/teams/admin-prd.ps1 -ProjectRef gqbqqconxrjcarvynwvl -Action enable-operational -ExpectedCommit '${'a'.repeat(40)}' -Reason 'Teste offline de protecao'; exit 2 } catch {if($_.Exception.Message -match 'PAT_REACHED'){exit 3}; Write-Output 'GATE_OK'}`);
    expect(r.code,r.out).toBe(0);expect(r.out).toContain('GATE_OK');
  },20000);
  it('não altera validação de certificados nem usa parâmetros exclusivos do PS7 no baseline',()=>{
    const transport=readFileSync('scripts/teams/admin-http.ps1','utf8');
    expect(transport).not.toMatch(/ServerCertificateValidationCallback|SkipCertificateCheck/);
    expect(transport).toContain('$request.Proxy = $null');
    expect(transport).toContain('$request.AllowAutoRedirect = $false');
    expect(readFileSync('scripts/teams/admin-prd.ps1','utf8')).not.toContain('ConvertFrom-Json -AsHashtable');
  });
});
