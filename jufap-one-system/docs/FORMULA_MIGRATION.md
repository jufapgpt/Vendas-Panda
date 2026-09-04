# Migração e governança das fórmulas

## Objetivo

Transferir as medidas do Realizado e Tendência para um catálogo central sem alterar silenciosamente o resultado oficial.

## Fluxo de cada indicador

```text
DAX original
  ↓
Definição gerencial
  ↓
Dependências e filtros implícitos
  ↓
Fórmula candidata no JUFAP One
  ↓
Reconciliação por Grupo, Regional, Coordenador, Loja e Data
  ↓
Aprovação do responsável
  ↓
Indicador ativo
```

## Estados

- `draft`: definição inicial, ainda sem DAX validado.
- `extracted`: expressão original registrada.
- `reconciled`: resultado candidato comparado ao PBI.
- `approved`: responsável aceitou fórmula e escopo.
- `active`: disponível em produção.
- `deprecated`: mantido apenas para histórico.

## O que não será aceito

- reconstruir medida apenas pelo nome;
- copiar regra de cor como regra de negócio;
- manter exclusões escondidas em um visual;
- usar nomes de loja ou vendedor como chave definitiva;
- alterar a tendência sem registrar versão;
- publicar divergência sem explicação e responsável.

## Evidências mínimas

Cada medida ativa terá:

- nome no PBI;
- DAX original;
- fórmula canônica;
- tabelas e colunas dependentes;
- filtros e status considerados;
- exemplos de cálculo;
- totais reconciliados;
- tolerância;
- data de aprovação;
- responsável;
- versão.

## Ferramentas no repositório

- `tools/pbi-audit/scan_pbip.py`: inventário de páginas, visuais e medidas TMDL.
- `packages/core/src/metrics.ts`: registro canônico em código.
- `workers/metrics`: sincronização e reconciliação.
- `fact_reconciliation`: histórico das comparações.
- `dim_indicator`: versões e DAX oficial.
