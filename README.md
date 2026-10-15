# Monitoramento El Niño — JBS Terminais | PRD local

Preparação da Etapa C, sem provisionamento ou publicação. Exportação limpa de `f398d948a0929034c063a608722ad88101c3ac37`, com histórico Git novo e sem snapshot operacional HML.

Destino futuro: `EduardoLamim/el-nino-jbs`, https://eduardolamim.github.io/el-nino-jbs/.

Leia [o runbook](docs/prd-runbook.md) antes de qualquer execução administrativa. Supabase PRD e Workflow Teams PRD já existem; não criar substitutos. A identificação real e as credenciais ainda devem ser fornecidas por meio seguro.

## Validação local

Node 24, npm e Python 3 são necessários. No Windows, configure `PYTHON_EXECUTABLE` com um Python real quando o alias da Microsoft Store não atender.

```powershell
npm ci
npm run prd:verify
```

O verificador usa transporte simulado e configuração pública fictícia, desabilita o simulador, preserva snapshot existente e guarda o build em `.local/NOT-FOR-PUBLICATION-*`. Não publique esse artefato. Sem snapshot anterior, o arquivo temporário é removido ao concluir. Um `dist` preexistente causa interrupção para evitar sobrescrita.

Os scripts administrativos são preparações para uma etapa futura autorizada. Nenhum deles deve ser executado remotamente nesta Etapa C.
