# JUFAP One — Plataforma de Inteligência Gerencial

O **JUFAP One** é a camada central de inteligência da JUFAP. Esta fundação transforma o protótipo visual em um sistema modular, preparado para receber as fórmulas oficiais do Power BI, as fontes do OneDrive/SharePoint e os demais domínios da empresa.

## Princípio do produto

> Simples na primeira camada, complexo sob demanda.

A jornada executiva é sempre:

**resultado → causa → impacto → unidade responsável → ação**

## O que esta entrega contém

- Aplicação web moderna em Next.js e TypeScript.
- API central em Fastify com contratos validados por Zod.
- Catálogo canônico de métricas do Realizado e Tendência.
- Perfis e escopos de acesso preparados para Microsoft Entra ID.
- Worker de ingestão com adaptador de OneDrive isolado e ainda desabilitado.
- Worker do JUFAP Brief.
- PostgreSQL e Redis para desenvolvimento local.
- Modelo inicial de dados, governança, auditoria e plano de ação.
- Documentação do mapeamento das 29 páginas do PBI.
- Ferramenta para inventariar projetos PBIP/TMDL.
- CI de build, testes e verificação de tipos.

## Estrutura

```text
jufap-one-system/
├── apps/
│   ├── web/                 One page executiva
│   └── api/                 API e regras de aplicação
├── packages/
│   ├── core/                Contratos, métricas, perfis e fontes
│   └── ui/                  Tokens do design system
├── workers/
│   ├── ingestion/           Ingestão e validação de fontes
│   └── notifications/       JUFAP Brief e alertas
├── database/                Migrações e dados iniciais
├── docs/                    Arquitetura e governança
├── tools/pbi-audit/         Inventário PBIP/TMDL
└── tests/                   Testes das regras centrais
```

## Requisitos

- Node.js 22.13 ou superior.
- npm 10 ou superior.
- Docker Desktop para PostgreSQL e Redis.
- PowerShell, Terminal ou Prompt de Comando.

## Inicialização local

```bash
cd jufap-one-system
copy .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run dev
```

No macOS/Linux, substitua `copy` por `cp`.

Serviços padrão:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Health: `http://localhost:4000/health`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Modos de dados

A primeira execução usa dados demonstrativos auditáveis:

```env
DATA_MODE=mock
ONEDRIVE_MODE=disabled
AUTH_MODE=mock
```

Na segunda etapa, serão preenchidos os identificadores do Microsoft Entra ID e os caminhos oficiais do OneDrive/SharePoint. O núcleo do sistema não precisará ser reescrito; apenas o adaptador de origem será ativado.

## Comandos

```bash
npm run dev          # executa web, API e workers em paralelo
npm run build        # build e verificação de todos os workspaces
npm run typecheck    # TypeScript estrito
npm test             # testes das métricas e permissões
npm run db:up        # inicia PostgreSQL e Redis
npm run db:down      # encerra a infraestrutura local
npm run db:migrate   # aplica o primeiro esquema
npm run pbi:audit -- <caminho-do-projeto-pbip>
```

## Estado das integrações

| Integração | Estado |
|---|---|
| Realizado e Tendência — estrutura visual | Inventariada |
| Registro canônico de métricas | Criado |
| Expressões DAX exatas | Preparado para importação do TMDL |
| OneDrive/SharePoint | Adaptador criado; credenciais e caminhos pendentes |
| Microsoft Entra ID | Camada de autorização criada; configuração pendente |
| Power BI incorporado | Contrato previsto; configuração pendente |
| JUFAP Brief | Gerador criado; canal de envio pendente |

## Segurança

Nunca grave senhas, client secrets, tokens, links de compartilhamento sensíveis ou dados pessoais no repositório. Use `.env`, cofre de segredos e permissões corporativas. O arquivo `.env.example` contém somente nomes de variáveis.
