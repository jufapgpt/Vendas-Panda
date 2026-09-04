# Estado de implementação — Fundação

## Concluído

### Produto

- Navegação lateral por âncoras.
- Filtros de período, regional e loja.
- Pulso executivo com quatro KPIs.
- Narrativa de resultado, motor, risco e ação.
- Seletor de indicador.
- Meta, realizado, tendência, GAP e necessário por dia.
- Ranking e classificação de lojas.
- Dossiê lateral de loja.
- Composição comercial.
- Ritmo e comparáveis.
- UP G/Z.
- Qualidade dos dados.
- Plano de ação.
- JUFAP Brief.
- Responsividade e impressão.

### Plataforma

- Monorepo com workspaces.
- Web Next.js e TypeScript.
- API Fastify.
- Contratos Zod compartilhados.
- Banco PostgreSQL.
- Registro versionado de métricas.
- Staging genérico para fontes tabulares.
- Rastreamento de arquivos e cursor delta.
- Registro de execuções, falhas e qualidade.
- Reconciliação numérica com tolerâncias.
- Adaptadores local e Microsoft Graph.
- Worker de notificações.
- Testes e CI.

## Bloqueado até a etapa 2

- Caminhos oficiais das bases.
- Identificadores do OneDrive/SharePoint.
- Permissões do aplicativo corporativo.
- Chaves de relacionamento entre as fontes.
- Transformações específicas de cada base.
- Medidas DAX originais completas.
- Valores oficiais por filtro.
- RLS corporativo real.
- Destinatários e canal do JUFAP Brief.
- Ambiente de hospedagem e domínio oficial.

## Não publicado

A fundação está versionada e pronta para homologação técnica. Ela ainda não está implantada em servidor ou domínio de produção e não substitui o Power BI atual.
