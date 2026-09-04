# Roadmap de Implementação — JUFAP One

## Objetivo

Evoluir o protótipo visual para uma aplicação corporativa conectada ao modelo semântico oficial, preservando os PBIs atuais como camada de detalhe.

## Fase 0 — Protótipo de experiência

**Status:** construído.

Entregas:

- one page navegável;
- menu lateral por âncoras;
- filtros de período, regional, coordenador e loja;
- perfis de acesso simulados;
- quatro KPIs executivos;
- narrativa do período;
- seletor de indicador;
- visão de lojas;
- composição comercial;
- ritmo e comparação;
- UP;
- qualidade;
- plano de ação;
- JUFAP Brief;
- responsividade e impressão.

Critério de aceite:

- a diretoria compreende o estado do grupo sem abrir outra página;
- o usuário identifica motor, risco e prioridade em até 30 segundos;
- o aprofundamento acontece sem perder o contexto do filtro.

## Fase 1 — Auditoria e reconciliação do modelo

Entregas:

- extração integral do DAX;
- catálogo de tabelas, colunas e medidas;
- extração das consultas M;
- diagrama de relacionamentos;
- inventário de RLS;
- comparação das medidas repetidas;
- reconciliação de grupo, regional e loja;
- identificação de filtros locais escondidos;
- aprovação do dicionário oficial.

Critérios de aceite:

- cada KPI do JUFAP One possui uma medida oficial;
- totais conciliam com o PBI atual e com a fonte operacional;
- diferenças são explicadas e documentadas;
- nenhum número demonstrativo permanece na versão integrada.

## Fase 2 — Fundação de dados

Entregas:

- `dData` oficial;
- `dLoja` oficial;
- `dPessoa` com vigência;
- `dIndicador`;
- padronização de status;
- chaves de origem;
- monitoramento de atualização;
- fila de rejeições;
- regras de deduplicação.

Critérios de aceite:

- todas as fontes reconhecem o mesmo `LojaID`;
- vendedores são vinculados por identificador estável;
- o mesmo filtro produz o mesmo escopo em todos os módulos;
- Auto Date/Time não interfere nas medidas oficiais.

## Fase 3 — Integração do Realizado e Tendência

Entregas:

- conexão dos KPIs executivos;
- Resultado e Tendência por indicador;
- ranking e classificação de lojas;
- dossiê da loja;
- ritmo e histórico;
- composição comercial;
- UP;
- central de qualidade;
- links contextuais para o PBI de origem.

Critérios de aceite:

- filtros globais alteram todos os componentes compatíveis;
- os números exibem fonte e horário;
- a diretoria consegue descer do grupo até a loja;
- a página identifica situações com dados incompletos.

## Fase 4 — Inteligência acionável

Entregas:

- motor de alertas;
- impacto em valor/quantidade;
- potencial recuperável;
- plano de ação;
- responsável e prazo;
- comentários e evidências;
- medição de resultado após ação.

Critérios de aceite:

- todo alerta crítico possui causa, impacto e responsável;
- ações permanecem vinculadas ao indicador de origem;
- a diretoria acompanha pendências por regional e prazo;
- alertas sem evidência não aparecem como causa confirmada.

## Fase 5 — JUFAP Brief

Entregas:

- resumo diário;
- resumo mensal;
- versão por perfil;
- e-mail com assunto orientado à conclusão;
- histórico de briefs;
- link com filtro contextual.

Critérios de aceite:

- o brief usa exatamente as mesmas medidas da página;
- regional e gerente recebem apenas seu escopo;
- a mensagem contém resultado, motor, pressão e ação;
- o usuário acessa o detalhe com um clique.

## Fase 6 — Expansão para outros PBIs

Ordem sugerida:

1. Fluxo e Conversão;
2. Financeiras;
3. Estoque TIM/WOS;
4. Dados Omie/DRE;
5. RH e Controle de Ponto;
6. Comissões e Caju;
7. Rebate;
8. Motorola, Jovi, Panda e Outlet;
9. Demais módulos de Controladoria.

A cada domínio, responder:

- qual pergunta executiva ele resolve;
- qual medida deve ir à primeira camada;
- com quais fatos já integrados ele se relaciona;
- qual impacto financeiro/operacional pode ser calculado;
- qual detalhe continuará no PBI de origem.

## Backlog funcional inicial

| ID | Entrega | Prioridade |
|---|---|---|
| ONE-001 | Autenticação corporativa | Crítica |
| ONE-002 | RLS/escopo por perfil | Crítica |
| ONE-003 | Filtros globais persistentes | Crítica |
| ONE-004 | Catálogo de medidas | Crítica |
| ONE-005 | Status de atualização por fonte | Alta |
| ONE-006 | Pulso executivo | Alta |
| ONE-007 | Narrativa auditável | Alta |
| ONE-008 | Dossiê da loja | Alta |
| ONE-009 | Qualidade dos dados | Alta |
| ONE-010 | Plano de ação | Alta |
| ONE-011 | JUFAP Brief | Média |
| ONE-012 | Exportação PDF/Excel | Média |
| ONE-013 | Favoritos e filtros salvos | Média |
| ONE-014 | Mobile executivo | Média |
| ONE-015 | Telemetria de uso | Média |

## Definição de pronto

Um componente só é considerado pronto quando:

1. possui pergunta gerencial explícita;
2. usa medida oficial;
3. respeita o perfil de acesso;
4. exibe fonte e atualização;
5. funciona em grupo, regional e loja;
6. possui estado vazio, erro e carregamento;
7. atende contraste e navegação por teclado;
8. foi comparado com a fonte;
9. está documentado;
10. possui responsável de negócio e técnico.
