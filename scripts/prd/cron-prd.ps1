param([Parameter(Mandatory=$true)][string]$ProjectRef,[ValidateSet('report','enable','disable')][string]$Action='report')
$ErrorActionPreference='Stop'
if($ProjectRef -cnotmatch '^[a-z]{20}$' -or $ProjectRef -in @('ufeahglxwygvlugfsopi','pppppppppppppppppppp')){throw 'Projeto PRD real obrigatório'}
$query="select jobname,schedule,active from cron.job where jobname='monitoramento-prd-10min'"
if($Action -ne 'report'){
 $confirm=if($Action -eq 'enable'){'ATIVAR CRON PRD'}else{'DESATIVAR CRON PRD'}
 if((Read-Host "Digite $confirm para confirmar ação previamente autorizada") -cne $confirm){throw 'Não confirmado'}
 if($Action -eq 'enable'){
  $sql=Get-Content (Join-Path $PSScriptRoot '../automation/activate-prd-cron.sql') -Raw
  $query=$sql.Replace('begin;',"begin; select set_config('jbs.confirmation','ATIVAR CRON PRD',true);")
 }else{$query="select cron.alter_job(jobid,active:=false) from cron.job where jobname='monitoramento-prd-10min'"}
}
$secure=Read-Host 'PAT Supabase PRD (oculto)' -AsSecureString
$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try{
 $headers=@{Authorization='Bearer '+[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)}
 $body=@{query=$query}|ConvertTo-Json
 try{ $r=Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" -Method Post -Headers $headers -ContentType 'application/json' -Body $body -TimeoutSec 30; $r|ConvertTo-Json -Depth 6 }
 catch{throw 'Operação sem confirmação. Inspecionar por leitura antes de repetir; nenhum erro remoto ou segredo exibido.'}
}finally{$headers=$null;[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer);$secure.Dispose()}
