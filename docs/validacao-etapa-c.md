# Validação local — Etapa C

- Baseline: f398d948a0929034c063a608722ad88101c3ac37.
- 501 testes aprovados em 44 arquivos. Incluem o conjunto homologado adaptado às identidades PRD, bootstrap isolado, separação HML/PRD, configuração com API mock, falhas parciais e SQL Cron com extensões simuladas.
- Lint, typecheck aplicação e Edge, build Pages e validação do artefato: aprovados.
- Artefato offline: base /el-nino-jbs/, 27 arquivos, 6.420.715 bytes. Guardado em .local/NOT-FOR-PUBLICATION-*. Não é candidato a publicação.
- Builds negativos efetivos: configuração ausente, projeto HML e tentativa de publicar identidade fictícia foram rejeitados.
- Artefato inspecionado: sem interface do simulador e sem URL do Supabase HML. Não há dist nem public/data/status.json retidos na árvore publicável.
- PowerShell: análise sintática de todos os helpers aprovada. Nenhum helper administrativo executado contra serviço remoto.
- Dependências: npm ci executado sem mudanças no lockfile; auditoria de instalação reportou zero vulnerabilidades.
- Comparação SHA-256: 44 arquivos críticos exportados preservados, incluindo motor, coletor, conteúdo, assets, datasets, áudio, alerta e handler de Impacto. Diff e inventário anexos.
- Segurança: nenhum padrão de credencial real encontrado nos arquivos candidatos a versionamento. Testes incluem marcadores deliberadamente inválidos e configuração fictícia, sem capacidade de autenticação. Cache/logs/artefatos ignorados. Não foi acessado arquivo protegido de credenciais HML.
- HML: estado Git final igual ao inicial, sem alterações rastreadas e com os mesmos cinco caminhos não rastreados preexistentes.
- Limites: testes locais não substituem validação de extensões/permissões/autenticação no Supabase real nem CI/deploy futuro. Não houve validação remota ou mensagens.
- Aviso preservado: bundle principal maior que 500 kB. Não impede o build; otimização fora deste escopo.

Nenhum ambiente remoto foi modificado. Cron e notificações não foram ativados. Não foi criado outro Supabase nem Workflow Teams. Backup dedicado permanece fora do escopo, com risco documentado no runbook.
