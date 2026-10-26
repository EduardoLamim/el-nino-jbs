# Promoção integral do HML homologado — 26/10/2026

## Rastreabilidade

Baseline funcional comum: f398d948a0929034c063a608722ad88101c3ac37. A comparação completa de arquivos e a decisão por caminho estão em promocao-hml-prd-20261026-inventario.json.

A diferença funcional posterior ao baseline consiste nos commits HML 2be79e07 e d7bb2420, reaplicados integralmente ao PRD. Snapshots automáticos não compõem a promoção. A autorização do responsável nesta rodada confirma a homologação desse conjunto.

## Promovido

- Central de Planos: botões agrupados, consulta do mapa, contatos e hierarquia.
- Manutenção aprovada dos textos de Atenção, Alerta, Emergência e Impacto no plano geral; áreas aprovadas. Plano TI integral preservado.
- Mapa de Decisões: nome e posição do acesso; imagem, modal e zoom preservados.
- Contatos: sete externos e CCCOM, telefones/tempos aprovados, sem rotas nem cálculo de trânsito.
- Hierarquia de Acionamento: estrutura homologada, ainda sem responsáveis cadastrados. Não representa cadastro completo nem são inventados responsáveis.
- Ajuste adicional autorizado em ambos os ambientes: Tempo de deslocamento até o terminal.

## Preservado ou não promovido

- Credenciais, refs Supabase, URLs, GitHub Actions, isolamento de armazenamento/build, simulador exclusivo HML e controles restritivos PRD permanecem específicos de cada ambiente.
- Motor, histerese, coletores, fontes, contratos, datasets territoriais, assets do mapa e plano TI não receberam mudanças funcionais posteriores ao baseline no HML.
- Não há migration nem Edge Function nova no conjunto homologado HML. Diferenças entre versões dessas áreas decorrem da adaptação PRD e não devem ser revertidas por cópia HML.
- Evidências históricas de homologação, screenshots, helpers e documentação exclusiva HML não substituem o runbook PRD.
- Nenhum snapshot operacional, fixture de build ou informação de credenciais é importado do HML. Artefatos offline ficam segregados e não são publicados.

## Retomada Teams PRD (autorização adicional)

Migration 202610260001_teams_resume instala somente função privada administrativa, sem alterar filas durante sua instalação. Não modifica Edge Functions, Cron, motor, Impacto ou credenciais.

A função resume_operational exige modo operacional, checkpoint exato e marco anterior exato; bloqueia settings e cursor na mesma ordem do reconciliador. Recusa leased, sending, uncertain, retry e dead. Encerra pending/blocked anteriores ao piso, registra auditoria por entrega, preserva eventos/tentativas/payloads e estabelece corte/piso atomicamente. Repetição com o marco anterior falha. Nenhum envio é executado pela operação. Eventos antigos reconciliados depois continuam inelegíveis pelo corte temporal já homologado.

scripts/teams/resume-prd.ps1 usa PAT por entrada oculta e transporte compatível PS5.1/7. Confere HML disabled por leitura, report PRD, exige RETOMAR TEAMS PRD, instala e registra apenas a nova migration se ausente, relê checkpoint sem adotá-lo silenciosamente, executa uma tentativa e registra evidência sanitizada local. Divergência interrompe antes da retomada; falha ou resultado incerto nunca causa repetição automática. Em caso de erro, consultar report antes de decidir recuperação. Não rodar novamente às cegas.

O script exige acesso administrativo aos dois projetos para confirmar HML; nunca envia escrita ao HML. A instalação e a retomada só serão consideradas concluídas mediante evidência remota. O fluxo Power Automate foi reativado pelo responsável; sua desativação anterior é hipótese informada para o HTTP 400, não causa tecnicamente demonstrada pelo relatório sanitizado.

## Validação

Testes PostgreSQL embarcado: encerramento de 51 entregas, preservação dos eventos/tentativas/cursor, auditoria individual, rollback integral em falha de auditoria, recusa de checkpoint/marco divergente e estados inseguros, privilégio público negado, processamento futuro sem histórico.
Testes PowerShell mock: cancelamento antes da escrita, checkpoint alterado, resultado incerto sem retry, sucesso, ausência de escrita HML e de impressão da credencial fictícia.
`nResultado local: 526/526 testes aprovados; lint, typecheck frontend/Edge, build Pages offline e validação de 27 arquivos aprovados. Artefato offline segregado e não publicável. HML: 6 testes focados, typecheck e lint aprovados.
