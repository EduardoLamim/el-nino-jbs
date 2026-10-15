# Etapa C — runbook PRD, execução futura sujeita a autorização

## Estado entregue

Diretório independente: `C:\Users\eduardolamim-soy\Desktop\CODEX\Projetos\04. Monitoramento El Nino PRD`.
Baseline funcional: `f398d948a0929034c063a608722ad88101c3ac37`.
Nenhuma migration, secret, função, Cron, Teams, Pages ou repositório remoto foi alterado nesta preparação. Não houve coleta real, envio de mensagens ou consulta administrativa a HML/PRD. O acesso externo utilizado foi a instalação de dependências pelo npm.

O PRD não inclui status operacional HML, histórico de Impacto, eventos ou outbox. As fixtures são dados de teste; a fixture consolidada foi gerada usando transportes simulados. Os dois documentos GIS preservados são proveniência dos datasets estáticos. Assets corporativos públicos e Planos de Ação já homologados foram preservados, sem novos materiais privados.

## Adaptações

- Frontend/Vite: base `/el-nino-jbs/`, Supabase por identidade PRD, validação de URL/publishable, simulador desabilitado inclusive em desenvolvimento desta cópia, armazenamento separado. Nenhum segredo administrativo é injetado pelo build.
- Edge: validação do projeto real, credenciais com sufixo PRD, destino GitHub PRD e link do painel PRD. Autenticação própria preservada; `verify_jwt=false` não significa acesso sem credencial. Impacto continua verificando origem/apikey/PIN; dispatcher e Teams exigem credenciais dedicadas.
- SQL: schemas/identidades PRD, configuração privada do projeto, nenhuma agenda ativada. RLS/RPC/Realtime/leases/idempotência preservados. Teams inicia desabilitado; o caminho sintético externo está bloqueado.
- Actions: repositório PRD obrigatório, workflow operacional manual, reconciliação separada condicionada a `TEAMS_PRD_ENABLED`. CI produz somente artefato offline em quarentena, sem upload Pages.
- Scripts: bootstrap ambiental próprio sem estado anterior; configuração inicial com entrada oculta; provisionamento com confirmação e dry-run; baseline Teams silenciosa; ativação e desligamento administrativos independentes.

Inventário: `local-review.json`. Diff dos arquivos exportados alterados: `adaptacoes-baseline.diff`. Arquivos novos estão presentes integralmente na árvore local; removidos estão listados no inventário. `baseline-export.json` contém os hashes da exportação de origem. Referências HML remanescentes são denylist, testes offline e rótulos sintéticos legados; não são destinos ativos ou fallback PRD.

## Sequência futura — não executar sem autorização

Os comandos abaixo pressupõem PowerShell no diretório PRD. `$PrdRef` deve receber o identificador público REAL do projeto já criado, nunca o ID HML ou o placeholder dos testes. Segredos não devem aparecer em argumentos, histórico, chat, logs ou arquivos versionados.

### 1. Aprovar publicação e conferir projeto existente

Confirmar proprietário, região, disponibilidade e acesso administrativo do Supabase PRD existente. Conferir extensões Vault, pg_cron e pg_net, permissões e ausência de instalação conflitante. Confirmar Workflow Teams PRD existente, destino do canal, contrato attachments/content e sua política de autenticação. Não reutilizar tokens ou URL HML.

Após autorização para o primeiro push e preparação do repositório remoto previsto:

```powershell
git remote add origin https://github.com/EduardoLamim/el-nino-jbs.git
git push -u origin main
```

Não há remote configurado nesta entrega. Revisar CI e proteções da branch antes das mutações administrativas.

### 2. Vincular somente o checkout PRD e aplicar migrations

Autenticar a CLI pelo mecanismo seguro corporativo/terminal, sem registrar token. Validar versão e acesso ao projeto. Não copiar `.temp` ou perfil HML.

```powershell
supabase link --project-ref $PrdRef
.\scripts\prd\provision-prd.ps1 -ProjectRef $PrdRef -Stage migrations
.\scripts\prd\provision-prd.ps1 -ProjectRef $PrdRef -Stage migrations -Execute
```

O helper exige confirmação, vínculo local exato, dry-run e segunda confirmação antes do push SQL. São migrations para banco PRD novo. Após falha, consultar o histórico de migrations e o estado do banco; não reaplicar nem resetar automaticamente. SQL com pg_net/Vault/Cron exige validação real do provedor nesta etapa futura: o teste local utiliza stubs para essas extensões.

### 3. Configurar credenciais exclusivas já guardadas com segurança

Gerar e guardar previamente seis tokens distintos de 48 bytes aleatórios (96 caracteres hexadecimais): backend Impacto, três escopos DB Teams, wake e admin Teams. Definir PIN PRD, chave publishable PRD, segredo Cron (mínimo 32 caracteres aleatórios), token GitHub com acesso mínimo a Actions no repositório PRD e URL do Workflow PRD. Não usar o PIN nem tokens HML. O armazenamento seguro dos novos valores é pré-requisito; o helper não cria cópia de recuperação.

```powershell
.\scripts\prd\configure-prd.ps1 -ProjectRef $PrdRef
.\scripts\prd\configure-prd.ps1 -ProjectRef $PrdRef -Execute
```

Exige instalação vazia e desabilitada, confirmação e entradas ocultas. Primeiro configura hashes privados e Vault; depois secrets da Edge. Não repete automaticamente. Se a segunda etapa falhar, preservar todas as credenciais e inspecionar a instalação: a execução inicial ficará bloqueada pela configuração existente. Completar apenas a etapa comprovadamente faltante, após autorização; não recriar hashes, banco ou credenciais.

Configurar separadamente no GitHub PRD, pela interface segura ou entrada padrão sem eco, os valores públicos `PRD_SUPABASE_PROJECT_REF`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `PAGES_BASE_PATH=/el-nino-jbs/`; secret `TEAMS_WAKE_TOKEN_PRD`. Inicialmente `PAGES_DEPLOY_ENABLED=false` e `TEAMS_PRD_ENABLED=false`. Não colocar PAT, PIN, webhook ou tokens backend em variáveis VITE. Credenciais de dispatcher ficam somente no backend PRD.

### 4. Publicar as três funções, ainda sem agendamento/envios

```powershell
.\scripts\prd\provision-prd.ps1 -ProjectRef $PrdRef -Stage deploy
.\scripts\prd\provision-prd.ps1 -ProjectRef $PrdRef -Stage deploy -Execute
.\scripts\teams\admin-prd.ps1 -ProjectRef $PrdRef -Action report
```

Conferir autenticação, health e modo desabilitado por leitura. Não executar claim/drain/envio para testar. Não alterar funções HML. Se houver resultado incerto, inspecionar as versões e seus secrets, sem redeploy automático.

### 5. Inicializar estado ambiental próprio e publicar painel

Após autorização para a primeira coleta real:

```powershell
$env:APP_ENV='production'
$env:PRD_SUPABASE_PROJECT_REF=$PrdRef
$env:PRD_CONFIRM_BOOTSTRAP='COLETAR PRD'
npm run prd:bootstrap
npm run data:validate
```

Bootstrap recusa arquivo existente, coleta usando o motor homologado sem importar memória HML e não fabrica Normalidade para ausência de dados. Revisar resultado antes de commitar exclusivamente `public/data/status.json` com mensagem de inicialização e publicar esse commit autorizado. Remover a variável de confirmação da sessão após uso.

Configurar Pages para GitHub Actions e permitir apenas a branch autorizada. Executar o workflow operacional manualmente para produzir a primeira revisão automática confiável:

```powershell
gh workflow run deploy-pages.yml --repo EduardoLamim/el-nino-jbs --ref main -f publish=true
```

Conferir coleta, validações, commit automático, artefato e publicação. Não publicar artefatos `.local/NOT-FOR-PUBLICATION-*`. O bootstrap inicial manual não é, por si só, evidência de proveniência suficiente para a baseline Teams: aguardar o commit válido do workflow operacional.

### 6. Inicializar baseline Teams silenciosa e reconciliar

Atualizar o checkout para a revisão automática PRD, sem modificações locais, e conferir que contém o snapshot persistido correspondente:

```powershell
git pull --ff-only
.\scripts\teams\admin-prd.ps1 -ProjectRef $PrdRef -Action baseline
.\scripts\teams\admin-prd.ps1 -ProjectRef $PrdRef -Action report
```

O helper valida origin PRD, autoria/mensagem/escopo do commit automático, integridade do snapshot e usa bootstrap privado sem envio. Só então permitir `TEAMS_PRD_ENABLED=true` para reconciliação independente; isso não substitui autorização administrativa de envio. Confirmar baseline/cursor e estado disabled. Nunca importar eventos ou duas entregas pendentes do HML.

### 7. Ativar coleta automática somente após autorização específica

```powershell
.\scripts\prd\cron-prd.ps1 -ProjectRef $PrdRef -Action report
.\scripts\prd\cron-prd.ps1 -ProjectRef $PrdRef -Action enable
```

Mantém o agendamento da baseline homologada: minutos 02/12/22/32/42/52. Não adiciona GitHub schedule. Após aprovação da publicação automática, `PAGES_DEPLOY_ENABLED=true`. Validar ciclos reais completos Cron → Edge → dispatch → coleta → persistência → Pages; separar erro de fonte de erro de publicação. Não declarar frequência verificada apenas pela presença da agenda.

### 8. Ativar Teams operacional somente mediante autorização expressa

Identificar pelo relatório o commit completo reconciliado, confirmar inexistência de entrega em execução/incerta e corte de histórico:

```powershell
.\scripts\teams\admin-prd.ps1 -ProjectRef $PrdRef -Action enable-operational -ExpectedCommit <SHA_COMPLETO_RECONCILIADO> -Reason 'Ativação PRD expressamente autorizada pelo responsável'
.\scripts\teams\admin-prd.ps1 -ProjectRef $PrdRef -Action report
```

O placeholder deve ser substituído por um SHA real. A confirmação adicional é `ATIVAR TEAMS PRD`. O corte exclui histórico e pendências anteriores; habilita apenas eventos posteriores válidos. Não provocar transições reais nem campanhas sintéticas. Observar eventos legítimos e correlacionar auditoria sem expor webhook. HML permanece desabilitado.

## Desativação e recuperação

```powershell
.\scripts\teams\admin-prd.ps1 -ProjectRef $PrdRef -Action disable
.\scripts\teams\admin-prd.ps1 -ProjectRef $PrdRef -Action report
.\scripts\prd\cron-prd.ps1 -ProjectRef $PrdRef -Action disable
```

Desativar Teams não cancela uma requisição externa já iniciada; inspecionar entregas em execução/incertas, sem reenvio cego. Suspender a agenda somente se necessário e autorizado. Restaurar versão de código conhecida sem retroceder `status.json`, memória de histerese, cursores ou identidades de eventos. Não executar rollback destrutivo de migrations/outbox, nem copiar estado HML. Não há fallback automático para HML. Recuperação de resposta perdida requer leitura administrativa antes de repetir qualquer mutação.

## Pendências e riscos residuais

- Identificador e credenciais PRD ainda não fornecidos; recursos existentes não foram inspecionados remotamente nesta etapa.
- Scripts foram testados localmente e com mocks; permissões reais, extensões, deploy, autenticação corporativa e publicação serão conferidos na etapa autorizada.
- Backup dedicado foi excluído do escopo pelo solicitante. A recuperação após perda do banco depende das capacidades efetivamente contratadas/disponíveis no Supabase, não verificadas aqui. Este risco não bloqueia a preparação local.
- HML/PRD Pages compartilham origem GitHub, embora bases e chaves de armazenamento sejam distintas. Namespacing não é isolamento de segurança entre aplicações do mesmo origin; servidores validam seus próprios projetos/credenciais.
- A ausência de secrets foi verificada por padrões e revisão dos arquivos. Isso não substitui inventário corporativo ou classificação jurídica dos assets já públicos.
- O build mantém aviso de chunk maior que 500 kB; otimização não foi introduzida para não ampliar escopo.
- Não há garantia de entrega imediata Teams: latência e entrega incerta continuam tratadas conforme arquitetura homologada.

## Gates locais

Resultado final e inventário: `local-review.json` e `validacao-etapa-c.md`. Histórico Git novo, sem commits/branches/tags HML e sem remote. Logs/cache/artefatos permanecem ignorados em `.local`; não devem ser enviados ao GitHub.
