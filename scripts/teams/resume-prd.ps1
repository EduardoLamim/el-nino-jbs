param([switch]$DirectConnection)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'admin-http.ps1')
$project = 'gqbqqconxrjcarvynwvl'
$hml = 'ufeahglxwygvlugfsopi'
$reason = 'Retomada operacional após ativação do fluxo Power Automate; notificações históricas não reenviadas para evitar alertas desatualizados.'
$evidence = [ordered]@{ project=$project; started_at=[DateTime]::UtcNow.ToString('o'); stage='read_preflight' }
$secureToken = Read-Host 'PAT administrativo Supabase com acesso ao PRD e leitura HML (entrada oculta)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
function Query([string]$Ref, [string]$Sql, [object[]]$Parameters=@()) {
  $body = @{ query=$Sql }
  if ($Parameters.Count) { $body.parameters=$Parameters }
  return Invoke-TeamsAdminHttp -Uri "https://api.supabase.com/v1/projects/$Ref/database/query" -Headers $headers -Body ($body | ConvertTo-Json -Depth 10) -DirectConnection:$DirectConnection
}
try {
  $headers = @{Authorization='Bearer '+[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)}
  # Read-only HML check: no mutation is ever issued to this project.
  $hmlState = @(Query $hml "select mode,live_until from jbs_notifications.settings where id=true")[0]
  $evidence.hml_before=$hmlState
  if ($hmlState.mode -ne 'disabled') { throw 'HML is not disabled; stop without changes' }
  $before = @(Query $project "select jbs_notifications.execute('report') as result")[0].result
  $evidence.before=$before
  if ($before.mode -ne 'operational' -or $before.queue_summary.in_flight -ne 0 -or $before.queue_summary.uncertain -ne 0) { throw 'Unsafe operational state; no changes' }
  if ($before.checkpoint -cnotmatch '^[a-f0-9]{40}$' -or !$before.operational_since) { throw 'Missing checkpoint or cutoff' }
  Write-Output ('Checkpoint conferido: '+$before.checkpoint)
  Write-Output ('Pendencias elegiveis: '+$before.queue_summary.eligible_pending)
  Write-Output 'A operacao encerra o historico sem enviar e libera somente futuras transicoes reais. Nao ha replay nem drain.'
  if ((Read-Host 'Digite exatamente RETOMAR TEAMS PRD') -cne 'RETOMAR TEAMS PRD') { throw 'Confirmation cancelled; no changes' }
  $evidence.stage='migration_inspection'
  $installed = @(Query $project "select to_regprocedure('jbs_notifications.resume_operational(text,timestamptz,text)') is not null as installed, exists(select 1 from supabase_migrations.schema_migrations where version='202610260001') as recorded")[0]
  if ($installed.installed -ne $installed.recorded) { throw 'Partial migration; inspect without retry' }
  if (!$installed.installed) {
    $evidence.stage='migration_application'
    $sql = [IO.File]::ReadAllText((Join-Path $PSScriptRoot '../../supabase/migrations/202610260001_teams_resume.sql'))
    $sql = $sql.Replace('commit;', "insert into supabase_migrations.schema_migrations(version,name,statements) values('202610260001','teams_resume',ARRAY[]::text[]);`ncommit;")
    Query $project $sql | Out-Null
  }
  # Compare the original report again. Never silently adopt a new checkpoint.
  $current = @(Query $project "select jbs_notifications.execute('report') as result")[0].result
  if ($current.checkpoint -cne $before.checkpoint -or $current.operational_since -cne $before.operational_since) { throw 'Checkpoint or cutoff changed; migration may be installed but no resume was attempted' }
  $evidence.stage='resume_attempt'
  $evidence.resume = @(Query $project 'select jbs_notifications.resume_operational($1,$2::timestamptz,$3) as result' @($before.checkpoint,$before.operational_since,$reason))[0].result
  $evidence.stage='postflight'
  $evidence.after = @(Query $project "select jbs_notifications.execute('report') as result")[0].result
  $evidence.historical = @(Query $project "select count(*) filter(where q.sequence<=s.operational_floor and q.status in ('pending','blocked','retry','leased','sending','uncertain','dead')) as old_unresolved, count(*) filter(where q.sequence<=s.operational_floor and jbs_notifications.eligible(e,q.sequence,s)) as old_eligible from jbs_notifications.outbox q join jbs_notifications.events e using(event_key) cross join jbs_notifications.settings s")[0]
  $evidence.hml_after = @(Query $hml "select mode,live_until from jbs_notifications.settings where id=true")[0]
  if ($evidence.after.mode -ne 'operational' -or $evidence.historical.old_unresolved -ne 0 -or $evidence.historical.old_eligible -ne 0 -or $evidence.hml_after.mode -ne 'disabled') { throw 'Postflight divergence; inspect persisted state, do not retry' }
  $evidence.stage='completed'
  Write-Output 'Retomada concluida. Historico encerrado sem replay; somente novas transicoes elegiveis. HML disabled.'
} catch {
  $failure=Get-TeamsAdminHttpFailure $_.Exception
  $evidence.error=@{category=$failure.Category;http=$failure.HttpStatus}
  throw "Procedimento interrompido na etapa $($evidence.stage); categoria=$($failure.Category); HTTP=$($failure.HttpStatus). Nao repita. Consulte a evidencia sanitizada."
} finally {
  $headers=$null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  $secureToken.Dispose()
  $directory=Join-Path $PSScriptRoot '../../.codex_work'
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
  $path=Join-Path $directory ('teams-resume-'+[guid]::NewGuid().ToString()+'.json')
  $evidence | ConvertTo-Json -Depth 16 | Set-Content -LiteralPath $path -Encoding UTF8
  Write-Output ('Evidencia sanitizada: '+[IO.Path]::GetFullPath($path))
}
