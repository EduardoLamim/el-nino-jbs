# Promoção PRD — identidade neutra

Referência homologada: HML `a109a18b` + `f5b32809`. Base PRD inspecionada: `2bc36628c6855378bd67d1a6540a0a57dc014067`.

## Delta promovido

Remoção do logo e neutralização dos textos da interface, acessibilidade, título HTML, categorias dos planos e nome do pacote. Cores, temas, estrutura, navegação, áudio e responsividade preservados. Mapa PNG homologado SHA-256 `1abf53162582bc9aabb19bbeca90f74ba28eb10fb521b3e793b4c4225592a4aa`; JPEG anterior removido do artefato atual, sem reescrever histórico. Hierarquia inalterada.

Planos: somente categoria Impacto Operacional. Importador mantém compatibilidade com a categoria histórica, sem mudar instruções ou responsáveis. A regressão de integridade de TI mantém o hash original normalizando apenas essa categoria.

## Divergências preservadas

A base PRD possui somente o plano TI disponível, com responsáveis anteriores; o HML possui também Operações e responsáveis diferentes no TI. Não foram transportadas essas diferenças de conteúdo anteriores, pois esta promoção se limita à despersonalização. Scripts QA exclusivos do HML não foram copiados integralmente; a verificação visual foi adaptada ao subpath e à chave de tema PRD.

Nenhuma configuração, snapshot ou fixture operacional HML foi transportada. O simulador permanece excluído pelo build PRD. URLs e identificadores técnicos persistidos continuam legados por compatibilidade.

## Proteções verificadas

A correção `881acdfa` e `202611060001_teams_resume_provenance.sql` permanecem intactas. Comparados contra a base: reconciliador, proveniência, handler/index Teams, workflows, motor, coletor, configuração de ambiente, Vite e snapshot PRD. Nenhuma alteração em Supabase, secrets, webhook, filas, checkpoint ou modo administrativo. A coleta/publicação usa o fluxo existente, sem modificá-lo.

## Validações

87 testes focados aprovados; gate completo PRD: 542 testes, lint, typecheck frontend/Edge, build e validação Pages. Build adicional com variáveis públicas reais do PRD; sem endpoint HML no artefato. Verificação renderizada de 84 páginas (1920, 1440, 1366, 1280, 768, 390 e 320 px; temas claro/escuro), 14 capturas de cabeçalho, modal e zoom preservados.

## Renderer Teams — preparado separadamente, não publicado

Candidato e patch locais ignorados em `.local/renderer-prd/`. Base normalizada LF do handler: SHA-256 `9551642a438307ade27979a05ab1ea048071319089f0a3d05b76849a20d34901`.

Comparação explícita: título, textos de Impacto e frases institucionais em TextBlock tornam-se neutros. Estrutura/cor do cartão, data, event_key, conteúdo persistido e link `https://eduardolamim.github.io/el-nino-jbs/` não mudam. Todo o trecho de validação do webhook, worker e autenticação é idêntico. 28 comparações de renderização local aprovadas, sem chamadas de rede ou eventos remotos. O arquivo `supabase/functions/teams-notifications/handler.ts` desta promoção permanece igual ao PRD anterior.

Plano de publicação futura, dependente de autorização:

1. Conferir a versão efetivamente implantada da Edge e comparar novamente seu código com a base do patch. Consultar health/report em leitura, sem assumir ausência de entregas em execução/incertas.
2. Aplicar somente o patch textual ao handler PRD; atualizar expectativas dos testes de cartões e repetir testes de renderer, worker, idempotência e typecheck. Não copiar handler HML nem configurações HML.
3. Publicar exclusivamente `teams-notifications` no projeto `gqbqqconxrjcarvynwvl`, preservando verify_jwt, autenticação própria, secrets e URL. Nenhuma migration, drain, replay, baseline, ativação ou mudança de reconciliador.
4. Validar health e versão em leitura; acompanhar eventos legítimos posteriores, sem disparo sintético. O worker preserva payloads já congelados (`claim.payload ?? adaptiveCard(...)`): entregas congeladas podem manter texto anterior, sem reescrevê-las ou reenviá-las.
5. Se houver erro, interromper e inspecionar. Rollback somente do código da Edge para a versão anterior, sem alterar dados, leases, tentativas ou checkpoint; entregas incertas não são repetidas automaticamente.

Esta rodada não consultou nem modificou estado administrativo remoto Teams. O plano não promete ausência de eventos naturais durante a publicação do painel.
