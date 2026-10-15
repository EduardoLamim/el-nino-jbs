param(
  [string]$ProjectRef,
  [ValidateSet('report','resolve','replay','disable','enable-operational','baseline')][string]$Action = 'report',
  [string]$DeliveryId,
  [ValidateSet('confirmed','dismissed','blocked')][string]$Status = 'confirmed',
  [string]$Reason,
  [string]$ExpectedCommit
)
$ErrorActionPreference = 'Stop'
if ($ProjectRef -cnotmatch '^[a-z]{20}$' -or $ProjectRef -eq 'ufeahglxwygvlugfsopi' -or $ProjectRef -eq 'pppppppppppppppppppp') { throw 'Projeto PRD real obrigatório; HML e fixture recusados' }
$payload = @{}
$rpcAction = $Action
if ($Action -in @('resolve','replay')) {
  $parsedId = [guid]::Empty
  if (-not [guid]::TryParse($DeliveryId, [ref]$parsedId) -or $Reason.Trim().Length -lt 10 -or $Reason.Length -gt 500) {
    throw 'Informe DeliveryId válido e justificativa de 10 a 500 caracteres, sem credenciais.'
  }
  $payload = @{ id = $parsedId.ToString(); status = $Status; reason = $Reason }
} elseif ($Action -eq 'disable') { $rpcAction = 'configure'; $payload = @{ mode = 'disabled' } }
if ($Action -eq 'enable-operational') {
  if ($ExpectedCommit -cnotmatch '^[a-f0-9]{40}$' -or !$Reason -or $Reason.Trim().Length -lt 10 -or $Reason.Length -gt 500) { throw 'Informe ExpectedCommit reconciliado e justificativa de 10 a 500 caracteres.' }
  Write-Output 'Ativação PRD: apenas transições posteriores a este momento. Histórico e pendências anteriores permanecerão excluídos.'
  $confirmation = Read-Host 'Digite exatamente ATIVAR TEAMS PRD para autorizar envios operacionais'
  if ($confirmation -cne 'ATIVAR TEAMS PRD') { throw 'Ativação não confirmada; nenhuma operação remota.' }
  $rpcAction = 'activate_operational'
  $payload = @{ confirm=$confirmation; reason=$Reason; expected_commit=$ExpectedCommit }
}
if ($Action -eq 'baseline') {
  if ((Read-Host 'Digite INICIALIZAR BASELINE PRD para confirmar baseline silenciosa') -cne 'INICIALIZAR BASELINE PRD') { throw 'Não confirmado' }
  $json = & node --import tsx (Join-Path $PSScriptRoot '../prd/baseline-payload.ts')
  if ($LASTEXITCODE -ne 0) { throw 'Baseline local rejeitada; nenhum acesso remoto iniciado' }
  $payload = $json | ConvertFrom-Json -AsHashtable
  $rpcAction = 'bootstrap'
}
$secureToken = Read-Host 'PAT administrativo Supabase PRD (entrada oculta)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $headers = @{ Authorization = 'Bearer ' + [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  $query = 'select jbs_notifications.execute($1,$2::jsonb) as result'
  if ($Action -eq 'disable') {
    # Administrative path independent of the Edge function. While disabled, claim
    # only sweeps expired leases; it cannot send or claim an event.
    $query = "begin; select jbs_notifications.execute('configure','{`"mode`":`"disabled`"}'::jsonb); select jbs_notifications.execute('claim'); commit;"
    $body = @{ query = $query } | ConvertTo-Json -Depth 8
  } else { $body = @{ query = $query; parameters = @($rpcAction, ($payload | ConvertTo-Json -Compress)) } | ConvertTo-Json -Depth 8 }
  try {
    $result = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -TimeoutSec 30
    $directory = Join-Path $PSScriptRoot '..\..\.codex_work'
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    $result | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $directory 'teams-prd-admin-result.json') -Encoding UTF8
    Write-Output 'Operação administrativa concluída. Evidência sanitizada em .codex_work/teams-prd-admin-result.json.'
  } catch { throw 'Consulta administrativa PRD falhou. Nenhum header, token ou corpo remoto foi exibido; não faça replay sem verificar.' }
} finally {
  $headers = $null
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  $secureToken.Dispose()
}
