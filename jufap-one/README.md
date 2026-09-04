# JUFAP One — Executive Intelligence

Primeiro protótipo navegável do **JUFAP One**, criado a partir do relatório **Realizado e Tendência**.

## Abrir o protótipo

- Arquivo principal: `jufap-one/index.html`
- Pré-visualização direta: `https://raw.githack.com/jufapgpt/Vendas-Panda/jufap-one-prototype/jufap-one/index.html`

O protótipo é um arquivo HTML autônomo: não depende de bibliotecas externas, servidor ou instalação. Também pode ser baixado e aberto diretamente no navegador.

## O que já está implementado

- One page longa com menu lateral e navegação por âncoras.
- Cabeçalho com períodos: Hoje, Ontem, Amanhã, Mês e Personalizado.
- Filtros por regional, coordenador, loja e perfil de acesso.
- Quatro KPIs executivos na primeira dobra.
- Leitura automática do período: resultado, motor, risco e ação.
- Seletor dinâmico de indicador.
- Resultado, tendência, GAP, necessário por dia e evolução.
- Ranking de lojas que mais explicam o resultado.
- Classificação das lojas em Destaque, Recuperável, Atenção, Crítica e Dados incompletos.
- Dossiê lateral da loja.
- Composição comercial: mix, acessórios, Pitzi, dependentes e portabilidade.
- Ritmo, média móvel e comparações coerentes.
- Fluxo de UP G e UP Z.
- Central de qualidade de dados.
- Plano de ação ligado aos indicadores.
- JUFAP Brief em formato editorial para e-mail.
- Layout responsivo e versão para impressão/exportação.

## Documentação produzida

- [`01-auditoria-realizado-tendencia.md`](docs/01-auditoria-realizado-tendencia.md) — auditoria, riscos e decisões de migração.
- [`02-mapa-paginas.csv`](docs/02-mapa-paginas.csv) — destino das 29 páginas atuais.
- [`03-dicionario-indicadores.md`](docs/03-dicionario-indicadores.md) — medidas canônicas e critérios de reconciliação.
- [`04-modelo-semantico.md`](docs/04-modelo-semantico.md) — dimensões, fatos, relacionamentos e segurança.
- [`05-roadmap-implementacao.md`](docs/05-roadmap-implementacao.md) — fases, backlog e definição de pronto.
- [`06-contrato-integracao.md`](docs/06-contrato-integracao.md) — estrutura de dados e endpoints sugeridos.
- [`07-design-system-foco.md`](docs/07-design-system-foco.md) — sistema visual, atenção, acessibilidade e responsividade.

## Escopo do PBI analisado

- 29 páginas;
- 442 componentes visuais;
- 22 páginas comerciais;
- 3 páginas de UP G/UP Z;
- 4 páginas de divergências;
- 219 segmentadores;
- 54 cartões;
- 21 matrizes;
- 11 tabelas.

## Importante sobre os números

Esta versão é um **MVP visual e funcional**. Os números demonstrativos reproduzem o snapshot analisado do Realizado e Tendência e existem para validar navegação, hierarquia, leitura e experiência.

O protótipo não apresenta o snapshot como informação ao vivo. A versão produtiva dependerá da reconciliação das expressões DAX, consultas M, relacionamentos, status e fontes do modelo semântico oficial.

## Estrutura do produto

1. Visão Geral
2. Resultado
3. Lojas
4. Composição
5. Ritmo
6. UP
7. Qualidade
8. Plano de Ação
9. JUFAP Brief

## Princípio

> Simples na primeira camada, complexo sob demanda.

O JUFAP One conduz a diretoria por esta sequência:

**resultado → causa → impacto → unidade responsável → ação**

Os PBIs atuais permanecem como camada de detalhamento e auditoria, enquanto o JUFAP One se torna a camada superior de inteligência gerencial.
