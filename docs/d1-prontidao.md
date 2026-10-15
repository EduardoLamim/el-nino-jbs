# Etapa D1 — parecer para primeiro push

Baseline funcional f398d948a0929034c063a608722ad88101c3ac37; revisão inicial local fb06bbbf23e9da48dac9e9135c525979c000b43e.

## Parecer

GO para solicitar autorização do primeiro push do código preparado. Não equivale a GO para provisionamento, build publicável configurado ou ativação operacional.

## Revisão e correção local

O arquivo scripts/plans/__pycache__/import_plan.cpython-312.pyc não está versionado, nem há outros pyc/pyo/pyd no índice. __pycache__/ já estava ignorado. Acrescentados *.py[cod] e *.log ao .gitignore. O log local docs/debug.log foi preservado no disco e excluído da publicação. O runbook apresentou apenas diferença de normalização de finais de linha, sem diff de conteúdo; não foi reescrito.

Nenhum código de aplicação, motor, coletor, histerese, matriz, SQL ou função foi alterado nesta revisão.

## Evidência liveEnabled

Em drainOne, a condição !liveEnabled bloqueia especificamente claim.mode=synthetic_live. Modo operacional exige evento não sintético e autorização transacional sending antes do transporte. Testes com fetch mock confirmam: false bloqueia sintético; false permite evento operacional autorizado (202); falha de sending impede transporte; 429/503 preservam classificação de retry/incerteza. Os testes SQL em PGlite verificam disabled, ativação explícita, corte de histórico, deduplicação e exclusão de backlog. Nenhum POST real foi enviado.

66 testes em cinco arquivos atuais aprovados: teams-worker, teams-db, teams-operational-admin, prd-environment e prd-build-isolation. Uma execução inicial selecionou também cópias de baseline em .local, com expectativas HML incompatíveis; a seleção foi corrigida com --exclude .local/**. Não houve falha nos testes atuais PRD. Gates completos da Etapa C (501 testes/lint/typecheck/build) continuam válidos: só ignore/documentação mudaram.

## Build e identidade

Reexecutados builds negativos: identidade ausente, HML e fixture em REQUIRE_PUBLIC_CONFIG=true foram rejeitados. Workflow publicável exige essa flag; CI offline guarda artefato em quarentena e não publica. O simulador não aparece no artefato e não há URL Supabase HML como destino.

Limitação explícita: ainda não foi informado o identificador real do projeto PRD. O gate valida formato, exclusão HML/fixture e igualdade entre URL e PRD_SUPABASE_PROJECT_REF; não prova a existência/titularidade de um identificador arbitrário. Portanto não é possível atestar a correspondência com o projeto real nesta revisão. A configuração e a conferência administrativa desse ID são obrigatórias antes de gerar/publicar o artefato real. Não há necessidade de credenciais para autorizar apenas o primeiro push.

## Segurança e inventário

Os 201 arquivos previamente versionados foram inspecionados, incluindo arquivos novos da Etapa C, migrations e scripts administrativos. Nenhum padrão de token real, chave privada ou URL assinada de webhook encontrado. Relatório e manifesto D1 contêm apenas texto e hashes de arquivos públicos, revisados separadamente. docs/d1-inventario.json lista caminhos, tamanhos e SHA-256 dos 201 arquivos; os dois acréscimos desta revisão são esse manifesto e este relatório. Assets binários permanecem os homologados, sem novos assets.

Referências HML ativas não encontradas: ID HML é denylist; simulation-config.ts é auxiliar legado não importado por Vite/aplicação. Não há fallback operacional ao HML. Referências sintéticas em testes não são credenciais. Cache, logs, credenciais, status operacional e artefatos não estão no índice. Inspeção por padrões tem limites e não atesta titularidade corporativa de assets já públicos.

## Preservação e próximos passos

HML sem alterações rastreadas e com os mesmos cinco caminhos não rastreados preexistentes. Nenhuma operação remota, push, secret, migration, deploy, ativação ou envio nesta etapa. Histórico PRD permanece novo, sem remote.

Após autorização específica: criar/conferir exclusivamente EduardoLamim/el-nino-jbs e publicar a branch main. A configuração Supabase, Pages, Cron e Teams continua sujeita às autorizações posteriores do runbook. Backup dedicado permanece fora do escopo, com risco residual já documentado.
