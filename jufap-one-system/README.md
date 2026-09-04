# JUFAP One — Plataforma de Inteligência Gerencial

O **JUFAP One** é a fundação do sistema central de inteligência do Grupo JUFAP. A primeira implementação reorganiza o relatório **Realizado e Tendência** em uma experiência executiva e prepara o núcleo técnico para receber as fontes oficiais do OneDrive/SharePoint na etapa seguinte.

> **Simples na primeira camada, complexo sob demanda.**

A jornada gerencial do produto é sempre:

**resultado → causa → impacto → unidade responsável → ação**

## Estado desta entrega

Esta branch contém uma aplicação real e executável, mas ainda opera em `DATA_MODE=mock`. As conexões do OneDrive, as credenciais corporativas e os caminhos das bases permanecem desabilitados até a etapa 2.

| Componente | Estado |
|---|---|
| One page executiva | Implementada em Next.js |
| API central | Implementada em Fastify |
| Contratos e validação | Implementados com TypeScript e Zod |
| PostgreSQL | Esquema inicial, staging, qualidade, métricas e ações |
| Ingestão local | Implementada para homologação |
| OneDrive/SharePoint | Adaptador Microsoft Graph implementado e desabilitado |
| Catálogo de fontes | Modelo e arquivo de configuração preparados |
| Registro de métricas | Criado; DAX original ainda precisa ser importado e reconciliado |
| Reconciliação | Worker e tabela de auditoria implementados |
| JUFAP Brief | Gerador e saída por console/webhook implementados |
| Autenticação | Modo simulado; estrutura preparada para Entra ID |
| CI | Build, tipos, testes e validação do scanner PBIP |
| Publicação produtiva | Ainda não realizada |

## Estrutura

```text
jufap-one-system/
├── apps/
│   ├── web/                  Interface JUFAP One
│   └── api/                  API, autorização e consultas
├── packages/
│   ├── core/                 Contratos, métricas, perfis e fontes
│   └── ui/                   Tokens do design system
├── workers/
│   ├── ingestion/            OneDrive/local → staging
│   ├── metrics/              Registro e reconciliação de métricas
│   └── notifications/        JUFAP Brief e webhooks
├── database/
│   ├── migrations/           Modelo transacional e analítico inicial
│   └── seeds/                Cadastros mínimos de desenvolvimento
├── config/                   Catálogo de fontes da etapa 2
├── docs/                     Arquitetura, fórmulas e operação
├── tools/pbi-audit/          Inventário PBIP/PBIR/TMDL
├── tests/                    Testes das regras centrais
└── openapi.yaml              Contrato HTTP inicial
```

## Requisitos locais

- Node.js 22.13 ou superior.
- npm 10 ou superior.
- Docker Desktop para PostgreSQL e Redis.
- Python 3.10 ou superior somente para o scanner PBIP/TMDL.

## Primeira execução

No Windows:

```powershell
cd jufap-one-system
Copy-Item .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

No macOS/Linux, use `cp .env.example .env`.

Serviços padrão:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Liveness: `http://localhost:4000/health/live`
- Readiness: `http://localhost:4000/health/ready`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Comandos

```bash
npm run dev             # web, API e workers em paralelo
npm run typecheck       # TypeScript estrito em todos os workspaces
npm run build           # builds de produção
npm test                # regras de métricas, contratos e reconciliação
npm run check           # tipos + build + testes
npm run db:up           # inicia PostgreSQL e Redis
npm run db:down         # encerra a infraestrutura local
npm run db:migrate      # aplica todas as migrações disponíveis
npm run db:seed         # inclui cadastros mínimos de desenvolvimento
npm run pbi:audit -- <pasta-pbip>
```

## Modos seguros por padrão

```env
DATA_MODE=mock
AUTH_MODE=mock
INGESTION_MODE=disabled
METRICS_MODE=disabled
BRIEF_MODE=disabled
```

Nenhuma integração externa é acionada sem configuração explícita. O catálogo `config/sources.stage2.example.json` também começa com todas as fontes desabilitadas.

## Realizado e Tendência

O primeiro módulo foi organizado em:

1. Visão geral.
2. Resultado e tendência.
3. Rede de lojas.
4. Composição comercial.
5. Ritmo e histórico.
6. UP G e UP Z.
7. Qualidade dos dados.
8. Plano de ação.
9. JUFAP Brief.

As 29 páginas atuais do Power BI permanecem como referência de auditoria e detalhamento. O JUFAP One centraliza os números gerenciais e cria uma única jornada de decisão.

## Fórmulas

O registro canônico já separa:

- código estável do indicador;
- definição gerencial;
- unidade e direção;
- fórmula canônica pretendida;
- dependências;
- medida e DAX originais;
- ciclo de aprovação.

Os campos `originalPowerBiMeasure` e `originalDax` permanecem nulos até a extração do projeto PBIP/TMDL ou outra exportação confiável do modelo. Nenhum cálculo original será inventado.

## Etapa 2

Na próxima etapa serão preenchidos:

- tenant e aplicativo corporativo do Microsoft Entra;
- `driveId` do OneDrive/SharePoint;
- pasta raiz e caminhos das fontes;
- abas/tabelas utilizadas;
- granularidade, chaves e datas de cada base;
- responsáveis e periodicidade;
- amostras para reconciliação com o Power BI.

O checklist detalhado está em `docs/STAGE_2_HANDOFF.md`.

## Segurança

Nunca grave senhas, tokens, chaves, links de compartilhamento sensíveis ou dados pessoais no Git. Use variáveis de ambiente e um cofre de segredos. O arquivo `.env.example` contém somente nomes de configurações e valores locais não sensíveis.
