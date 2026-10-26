import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';
it.skipIf(process.platform !== 'win32').each(['cancel','changed','uncertain','success'])('helper PS5.1: %s, sem rede nem retries',scenario=>{
  const command = `
  $global:reports=0; $global:resumes=0; $global:writes=0;
  function Read-Host { param($Prompt,[switch]$AsSecureString); if($AsSecureString){$s=New-Object Security.SecureString; 'offline-fixture-not-a-token'.ToCharArray() | ForEach-Object {$s.AppendChar($_)}; return $s}; return '${scenario === 'cancel' ? 'CANCELAR' : 'RETOMAR TEAMS PRD'}' }
  function Invoke-RestMethod { param($Uri,$Method,$Headers,$ContentType,$Body,$TimeoutSec)
    $b=[Text.Encoding]::UTF8.GetString($Body) | ConvertFrom-Json;
    if($Uri -like '*ufeahglxwygvlugfsopi*'){if($b.query -ne 'select mode,live_until from jbs_notifications.settings where id=true'){throw 'HML_WRITE'}; return @{mode='disabled';live_until=$null}}
    if($b.query -like '*to_regprocedure*'){return @{installed=$true;recorded=$true}}
    if($b.query -like '*old_unresolved*'){return @{old_unresolved=0;old_eligible=0}}
    if($b.query -like '*resume_operational*'){$global:resumes++; if('${scenario}' -eq 'uncertain'){throw (New-Object Net.WebException('do-not-log', [Net.WebExceptionStatus]::Timeout))}; return @{result=@{mode='operational';dismissed=51}}}
    if($b.query -like '*execute*report*'){$global:reports++; $sha='${'a'.repeat(40)}'; if('${scenario}' -eq 'changed' -and $global:reports -gt 1){$sha='${'b'.repeat(40)}'}; return @{result=@{mode='operational';checkpoint=$sha;operational_since='2026-10-19T18:07:47Z';queue_summary=@{in_flight=0;uncertain=0;eligible_pending=37}}}}
    $global:writes++; throw 'Unexpected query'
  }
  try { & ./scripts/teams/resume-prd.ps1 } catch { Write-Output ('SAFE_STOP: '+$_.Exception.Message) }
  Write-Output ('CALLS='+$global:resumes+';UNEXPECTED='+$global:writes)
  `;
  const r=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{encoding:'utf8',windowsHide:true});
  expect(r.status,r.stderr).toBe(0);
  expect(r.stdout).toContain(`CALLS=${['success','uncertain'].includes(scenario)?1:0};UNEXPECTED=0`);
  expect(r.stdout).not.toContain('offline-fixture-not-a-token');
  if(scenario==='success') expect(r.stdout).toContain('Retomada concluida');
  else expect(r.stdout).toContain('SAFE_STOP');
},15000);
