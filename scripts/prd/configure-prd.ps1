param([Parameter(Mandatory=$true)][string]$ProjectRef,[switch]$Execute)
$ErrorActionPreference='Stop'
if($ProjectRef -cnotmatch '^[a-z]{20}$' -or $ProjectRef -in @('ufeahglxwygvlugfsopi','pppppppppppppppppppp')){throw 'Projeto PRD real obrigatório'}
if(!$Execute){Write-Output 'Plano somente: configuração inicial PRD. Exige -Execute, confirmação e credenciais PRD previamente guardadas pelo administrador.';exit 0}
if((Read-Host 'Credenciais PRD já guardadas com segurança? Digite CONFIGURAR PRD para confirmar autorização') -cne 'CONFIGURAR PRD'){throw 'Não confirmado'}
function Hidden([string]$Name){
 $secure=Read-Host $Name -AsSecureString;$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
 try{return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer);$secure.Dispose()}
}
$payload=@{project=$ProjectRef;pat=(Hidden 'PAT Supabase PRD');secrets=@{}}
try{
 foreach($name in @('JBS_IMPACT_PIN','JBS_IMPACT_BACKEND_TOKEN','JBS_SUPABASE_PUBLISHABLE_KEY','MONITORAMENTO_CRON_SECRET_PRD','GITHUB_DISPATCH_TOKEN_PRD','TEAMS_DB_INGEST_TOKEN_PRD','TEAMS_DB_WORKER_TOKEN_PRD','TEAMS_DB_ADMIN_TOKEN_PRD','TEAMS_WAKE_TOKEN_PRD','TEAMS_ADMIN_TOKEN_PRD','TEAMS_WORKFLOW_URL_PRD')){$payload.secrets[$name]=Hidden $name}
 $payload | ConvertTo-Json -Compress -Depth 5 | & node --import tsx (Join-Path $PSScriptRoot 'configure.ts')
 if($LASTEXITCODE){throw 'Interrompido; inspecionar antes de repetir. Credenciais originais devem permanecer guardadas.'}
}finally{$payload=$null}
