# Arquitetura do JUFAP One

## Objetivo

Criar uma fonte única de inteligência gerencial, sem reproduzir a fragmentação atual dos PBIs. O sistema deverá combinar dados comerciais, financeiros, estoque, pessoas, qualidade e planos de ação usando dimensões e métricas oficiais.

## Camadas

```text
OneDrive / SharePoint / APIs
            ↓
Ingestão incremental e validação
            ↓
Raw → Staging → Modelo canônico
            ↓
Registro de métricas e regras
            ↓
API JUFAP One
            ↓
Web · PBI detalhado · Brief · Alertas
```

## Decisões

1. **API-first:** a interface não contém fórmulas de negócio.
2. **Fonte única de métricas:** um indicador possui código, conceito, fórmula, fonte, granularidade, responsável e validade.
3. **OneDrive como origem, não como banco:** os arquivos são lidos de forma incremental e registrados por hash, versão e horário.
4. **Modelagem dimensional:** datas, lojas, pessoas, produtos, indicadores e fontes são dimensões compartilhadas.
5. **Segurança por escopo:** perfis recebem grupo, empresa, regional, coordenação ou loja.
6. **Qualidade visível:** todo resultado relevante informa atualização, completude e pendências.
7. **Detalhe progressivo:** o JUFAP One explica; o PBI e as telas técnicas auditam.
8. **Ambientes separados:** desenvolvimento, homologação e produção.

## Serviços

### Web

One page executiva, responsiva e orientada por decisão. Possui filtros globais, leitura do período, dossiê de loja, qualidade e ações.

### API

Valida contratos, aplica autorização, consulta métricas e expõe endpoints para overview, lojas, qualidade, fontes, UP e planos de ação.

### Worker de ingestão

Lista alterações, baixa somente arquivos novos ou modificados, calcula checksum, valida esquema, registra a execução e publica dados tratados.

### Worker de notificações

Gera o JUFAP Brief e alertas usando exatamente os mesmos contratos e métricas da API.

## Evolução planejada

- Etapa 1: fundação e Realizado e Tendência em modo demonstrativo.
- Etapa 2: conexão OneDrive/SharePoint e catálogo real de fontes.
- Etapa 3: reconciliação do modelo com DAX/TMDL e publicação do módulo vivo.
- Etapa 4: Entra ID, RLS/escopos, alertas e plano de ação produtivo.
- Etapa 5: incorporação dos demais PBIs e domínios.
