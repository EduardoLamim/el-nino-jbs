param(
 [Parameter(Mandatory=$true)][string]$ProjectRef,
 [ValidateSet('migrations','deploy')][string]$Stage='migrations',
 [switch]$Execute
)
$ErrorActionPreference='Stop'
if ($ProjectRef -cnotmatch '^[a-z]{20}$' -or $ProjectRef -eq 'ufeahglxwygvlugfsopi' -or $ProjectRef -eq 'pppppppppppppppppppp') { throw 'Projeto PRD real obrigatório' }
$root=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
Write-Output "Destino PRD: $ProjectRef; etapa: $Stage. Não configura secrets, baseline, Cron ou Teams."
if (!$Execute) { Write-Output 'Plano somente. Execução exige -Execute e confirmação interativa após autorização.'; exit 0 }
if ((Read-Host 'Digite PREPARAR PRD para confirmar esta etapa autorizada') -cne 'PREPARAR PRD') { throw 'Não confirmado' }
Push-Location $root
try {
 if (!(Test-Path supabase/.temp/project-ref) -or (Get-Content supabase/.temp/project-ref -Raw).Trim() -ne $ProjectRef) { throw 'Projeto local vinculado divergente; vincule explicitamente o PRD antes' }
 if ($Stage -eq 'migrations') {
  & supabase db push --linked --dry-run
  if ($LASTEXITCODE) { throw 'Preflight falhou' }
  if ((Read-Host 'Após revisar o dry-run, digite APLICAR MIGRATIONS PRD') -cne 'APLICAR MIGRATIONS PRD') { throw 'Não confirmado' }
  & supabase db push --linked
 } else {
  & supabase functions deploy impacto-jbs trigger-monitoramento teams-notifications --project-ref $ProjectRef --use-api
 }
 if ($LASTEXITCODE) { throw 'Etapa falhou ou resultado incerto. Inspecione antes de repetir; não há retry automático.' }
 Write-Output 'Etapa concluída. Conferir estado remoto por leitura; envios não foram ativados por este script.'
} finally { Pop-Location }
