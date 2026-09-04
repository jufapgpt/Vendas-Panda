# Auditoria do PBI Realizado e Tendência

**Projeto:** JUFAP One — Executive Intelligence  
**Relatório de origem:** Realizado e Tendência  
**Versão da auditoria:** 0.1  
**Base visual analisada:** snapshot de 03/09/2026  

---

## 1. Resumo executivo

O arquivo **Realizado e Tendência** não é apenas um dashboard. Ele reúne três produtos analíticos em um único PBIX:

1. **Gestão comercial das Lojas TIM**;
2. **Operação de UP G e UP Z**;
3. **Tratamento de divergências e qualidade de dados**.

A camada de relatório contém:

- **29 páginas**;
- **442 componentes visuais**;
- **219 segmentadores/seletores**;
- **54 cartões**;
- **21 matrizes**;
- **11 tabelas**;
- **22 páginas comerciais**;
- **3 páginas de UP**;
- **4 páginas de divergências**.

O relatório possui grande profundidade operacional, mas a informação está organizada segundo a lógica de construção do Power BI. A diretoria precisa conhecer previamente a página, o indicador e o filtro corretos para encontrar uma resposta.

A função do **JUFAP One** será inverter essa lógica:

> **Pergunta gerencial → resposta → causa → impacto → unidade responsável → ação.**

Os PBIs atuais permanecerão como fonte de detalhe e auditoria. O JUFAP One será a camada superior de inteligência, priorização e navegação.

---

## 2. Inventário das páginas

| Ordem | Página atual | Domínio | Papel atual | Destino no JUFAP One |
|---:|---|---|---|---|
| 1 | RT | Comercial | Visão consolidada de metas e tendência | Pulso executivo + Resultado |
| 2 | RT - Serviços | Comercial | Serviços e composição | Resultado + Composição |
| 3 | RT - Faturamento TIM | Comercial | Meta, realizado e tendência TIM | Resultado |
| 4 | RT - FIBRA | Comercial | Desempenho de Fibra | Resultado + Composição |
| 5 | RT - Financeiro | Comercial | Produção financeira | Resultado |
| 6 | RT - Acessórios | Comercial | Meta e realizado de acessórios | Resultado + Composição |
| 7 | RT - PITZI | Comercial | Proteção Pitzi | Resultado + Composição |
| 8 | Ranking | Comercial | Ordenação de lojas/pessoas | Rede de lojas |
| 9 | Destaques | Comercial | Reconhecimento de performance | Rede de lojas |
| 10 | Zerados | Comercial | Dias e indicadores sem produção | Rede de lojas + Alertas |
| 11 | Diário | Comercial | Produção diária | Ritmo |
| 12 | Mix de Planos | Comercial | Composição de Pós e Controle | Composição |
| 13 | Dependentes | Comercial | Agregação de dependentes | Composição |
| 14 | Portabilidade | Comercial | Solicitações e ativações | Composição + Qualidade |
| 15 | Fat. TIM | Comercial | Faturamento detalhado | Resultado + Dossiê |
| 16 | UP G ou Z - Dados | UP | Base operacional de UP | UP |
| 17 | Diário UP | UP | Evolução diária de UP | UP + Ritmo |
| 18 | Duplicata de UP G ou Z - Detalhado | UP | Duplicidades | UP + Qualidade |
| 19 | Financeiro TIM | Comercial | Visão financeira TIM | Resultado + Dossiê |
| 20 | Velocidade | Comercial | Ritmo e necessidade diária | Pulso executivo + Ritmo |
| 21 | Em identificação Datasys | Divergências | Registros sem identificação concluída | Qualidade |
| 22 | Sem vendedores encontrados - BU Móvel | Divergências | Falha de vínculo de vendedor | Qualidade |
| 23 | Sem vendedores encontrados - BU Fibra | Divergências | Falha de vínculo de vendedor | Qualidade |
| 24 | Sem vendedores encontrados - KPIs | Divergências | Falha de vínculo de vendedor | Qualidade |
| 25 | DOJI | Comercial/Financeiro | Operação específica | Composição + Dossiê |
| 26 | YOY - Data | Histórico | Comparação anual por data | Ritmo e histórico |
| 27 | YOY - Dia Semana | Histórico | Comparação por dia comparável | Ritmo e histórico |
| 28 | YOY - Mês | Histórico | Comparação mensal | Ritmo e histórico |
| 29 | RT PITZI - Conversão | Comercial | Conversão de proteção | Composição |

### Decisão de arquitetura

As 29 páginas não serão reproduzidas como 29 seções. Serão consolidadas em oito jornadas:

1. Visão Geral;
2. Resultado;
3. Rede de Lojas;
4. Composição Comercial;
5. Ritmo e Histórico;
6. UP G e UP Z;
7. Qualidade dos Dados;
8. Plano de Ação.

---

## 3. Anatomia visual

| Tipo de componente | Quantidade |
|---|---:|
| Segmentadores e seletores | 219 |
| Cartões | 54 |
| Caixas de texto | 32 |
| Formas | 29 |
| Imagens | 29 |
| Matrizes | 21 |
| Tabelas | 11 |
| Gráficos de linha | 7 |
| Filtros de texto personalizados | 7 |
| Velocímetros | 6 |
| Gráficos de área | 6 |
| Barras agrupadas | 5 |
| Barras | 5 |
| Grupos de componentes | 9 |
| Gráfico combinado | 1 |
| Gráfico de colunas | 1 |

A média é de **15,2 componentes por página** e **7,6 segmentadores por página**.

### Consequências para a experiência atual

- muitos filtros repetidos;
- alto custo de navegação;
- páginas parecidas para indicadores diferentes;
- matrizes extensas aparecendo antes da conclusão;
- páginas técnicas concorrendo com páginas executivas;
- dificuldade de distinguir informação, alerta e decoração;
- comparação manual entre páginas;
- pouca explicação do impacto financeiro ou operacional.

### Diretriz do novo produto

> **Poucos elementos protagonistas; profundidade sob demanda.**

A primeira dobra terá no máximo quatro KPIs principais, uma leitura executiva e três prioridades. Matrizes e tabelas completas ficarão em dossiês, gavetas laterais ou no PBI de origem.

---

## 4. Visuais personalizados encontrados

O relatório utiliza cinco visuais externos:

- KPI Ticker;
- Laconic Card Free;
- Power KPI Matrix;
- Simple Waterfall;
- Text Filter.

### Tratamento proposto

| Visual atual | Tratamento no JUFAP One |
|---|---|
| KPI Ticker | Substituir por faixa de indicadores nativa da aplicação |
| Laconic Card | Substituir por cartão do design system JUFAP One |
| Power KPI Matrix | Manter somente na camada analítica ou reconstruir em tabela web |
| Simple Waterfall | Usar waterfall para explicar variações, quando houver reconciliação de causas |
| Text Filter | Substituir por busca global e filtros padronizados |

O objetivo é reduzir dependências, melhorar acessibilidade e manter o mesmo comportamento em todas as operações.

---

## 5. Entidades e campos confirmados na camada do relatório

A leitura da definição das páginas e visuais identificou, entre outras, as seguintes entidades:

- `00 - DATA`;
- `BASE DATASYS`;
- `BASE CUST`;
- `BASE VENDAS`;
- `AUXILIAR UNIFICADA PARA LOJAS`;
- `Medidas Realizado e Tendência`;
- tabelas locais automáticas de data (`LocalDateTable...`).

Campos e medidas observados incluem:

- `00 - DATA[Dia]`;
- `00 - DATA[Ano]`;
- `BASE DATASYS[Status Linha]`;
- `BASE CUST[REGIONAL]`;
- `BASE VENDAS[Tipo Pedido]`;
- `Medidas Realizado e Tendência[REALIZADO]`;
- `Medidas Realizado e Tendência[REALIZADO LY2]`.

Na página de comparação anual, `REALIZADO` e `REALIZADO LY2` aparecem como Ano Atual e Ano Anterior, organizados por dia.

---

## 6. Regras observadas nos filtros

Foram encontradas regras aplicadas diretamente em páginas ou visuais, entre elas:

- seleção padrão do ano 2026;
- inclusão de status Datasys como `ATIVADA`, `PENDENTE` e `SUSPENSO` em determinados contextos;
- exclusão de regionais/unidades como `ESCR`, `MATRIZ` e valores vazios;
- exclusão de tipos de pedido `Devolução` e `Troca` na visão de serviços;
- filtros diferentes conforme a página;
- página `Zerados` salva como página ativa do arquivo.

### Risco

Dois visuais com o mesmo título podem trabalhar com universos diferentes se seus filtros locais não forem equivalentes.

Exemplo de risco:

```text
Faturamento TIM da página RT
≠ Faturamento TIM da página Fat. TIM
≠ Faturamento TIM da página Diário
```

A diferença pode vir de:

- data usada;
- status incluídos;
- lojas elegíveis;
- devoluções e trocas;
- registros sem vendedor;
- pendências de ativação;
- origem de dados;
- horário de atualização.

### Decisão

Regras corporativas deixarão de ficar escondidas no visual. Serão centralizadas no modelo semântico e documentadas no dicionário de indicadores.

---

## 7. Riscos de modelo identificados

### 7.1 Mais de uma estrutura representando loja

A presença de `BASE CUST`, `AUXILIAR UNIFICADA PARA LOJAS` e filtros locais indica possível multiplicidade de cadastros organizacionais.

**Ação:** criar uma dimensão única `dLoja`, com identificador estável e histórico de vigência.

### 7.2 Tabelas automáticas de data coexistindo com `00 - DATA`

Isso pode causar medidas temporais inconsistentes e aumentar o tamanho do modelo.

**Ação:** usar somente uma dimensão calendário oficial, desabilitar Auto Date/Time e direcionar todas as relações temporais à dimensão correta.

### 7.3 Vínculo de vendedor baseado em nome

As páginas “Sem vendedores encontrados” indicam falhas de correspondência entre fontes.

**Ação:** usar `VendedorID`/matrícula/CPF controlado e tabela histórica de lotação.

### 7.4 Qualidade tratada como página técnica

A divergência hoje é consultada separadamente, sem mostrar seu efeito nos indicadores.

**Ação:** toda pendência deverá registrar indicador afetado, valor ou quantidade, loja, responsável, idade e prazo.

### 7.5 Mistura de executivo, analítico e operacional

A mesma navegação contém acompanhamento executivo, tabelas analíticas e filas de correção.

**Ação:** separar experiência por camada e perfil, sem separar os números.

---

## 8. Estrutura aprovada para o JUFAP One

### 8.1 Menu lateral

- Visão Geral;
- Resultado;
- Lojas;
- Composição;
- Ritmo;
- UP;
- Qualidade;
- Plano de Ação;
- JUFAP Brief.

Cada item poderá mostrar a quantidade de alertas ativos.

### 8.2 Barra superior

Períodos:

- Hoje;
- Ontem;
- Amanhã;
- Mês;
- Personalizado.

Filtros globais:

- Regional;
- Coordenador;
- Loja;
- Perfil;
- Mais filtros.

O escopo sempre ficará explícito, por exemplo:

> Diretoria · TSP · Todas as lojas · Setembro de 2026

### 8.3 Primeira dobra

Quatro KPIs protagonistas:

1. Faturamento TIM;
2. Pós Total;
3. Financeiro;
4. Lojas em atenção.

Abaixo deles:

- faixa compacta dos demais indicadores;
- leitura executiva;
- principal motor;
- maior risco;
- ação recomendada;
- prioridades do dia.

---

## 9. Regra de narrativa

Toda leitura automática seguirá esta sequência:

1. **Resultado:** o que aconteceu;
2. **Motor:** o que ajudou;
3. **Pressão:** o que prejudicou;
4. **Concentração:** onde está o maior impacto;
5. **Ação:** o que precisa ser feito.

Exemplo:

> Pós Pago, Acessórios e Pitzi sustentam o resultado. Controle e Faturamento TIM operam abaixo da meta e concentram a pressão. Cinco lojas explicam a maior parcela do GAP. A prioridade é atuar nas unidades recuperáveis e concluir as divergências que afetam ranking e tendência.

A narrativa nunca poderá inferir uma causa sem evidência. Quando a relação não estiver provada, o sistema usará expressões como “associado a”, “indício” ou “requer validação”.

---

## 10. Classificação das lojas

| Classe | Regra conceitual |
|---|---|
| Destaque | acima da meta e consistente |
| Recuperável | abaixo da meta, mas com ritmo/capacidade suficiente |
| Em atenção | abaixo da meta e desacelerando |
| Crítica | GAP elevado, recorrência de zerados ou problema estrutural |
| Dados incompletos | resultado comprometido por divergência relevante |

Cada loja terá um dossiê com:

- resultado;
- tendência;
- GAP;
- necessário por dia;
- composição;
- dias zerados;
- velocidade;
- comparação histórica;
- qualidade dos dados;
- ofensores;
- ações abertas;
- responsável.

---

## 11. Modelo semântico-alvo

### Dimensões

| Dimensão | Conteúdo mínimo |
|---|---|
| `dData` | data, dia, dia útil, semana, mês, trimestre, ano, feriado e comparáveis |
| `dLoja` | LojaID, nome, empresa, CNPJ, operação, regional, coordenador, status e vigência |
| `dVendedor` | VendedorID, matrícula/CPF controlado, nome, cargo, loja e vigência |
| `dIndicador` | IndicadorID, nome, grupo, unidade, direção, limites e responsável |
| `dPlanoServico` | plano, família, categoria, tipo e elegibilidade |
| `dStatus` | status operacional, status de qualidade e estágio |
| `dFonte` | sistema, atualização, proprietário e criticidade |
| `dEstrutura` | diretoria, regional, coordenação, gerência e loja |

### Fatos

| Fato | Granularidade |
|---|---|
| `fVendaServico` | uma venda/ativação/item |
| `fMetaIndicador` | uma meta por data, loja e indicador |
| `fFaturamentoTIM` | um lançamento de faturamento por operação |
| `fAtivacaoDatasys` | um registro Datasys e seu status |
| `fPitzi` | uma oferta ou venda de proteção |
| `fUP` | um registro de UP G ou UP Z |
| `fPortabilidade` | uma solicitação ou ativação |
| `fQualidadeDados` | uma divergência ou pendência |
| `fPlanoAcao` | uma ação ligada a indicador, loja e responsável |

### Chaves obrigatórias

- `DataID`;
- `LojaID`;
- `VendedorID`;
- `IndicadorID`;
- `PedidoID`;
- `FonteID`;
- `DataHoraCarga`;
- `StatusQualidade`.

---

## 12. Métricas canônicas

As expressões abaixo são definições-alvo. Elas precisam ser reconciliadas com o DAX oficial antes da integração produtiva.

| Métrica | Definição |
|---|---|
| Meta | objetivo oficial no contexto selecionado |
| Realizado | resultado válido acumulado |
| % Realizado | Realizado ÷ Meta |
| Tendência | projeção de fechamento pelo calendário e ritmo oficial |
| % Tendência | Tendência ÷ Meta |
| GAP Atual | Realizado − Meta acumulada até o dia |
| GAP Projetado | Tendência − Meta total |
| Necessário por Dia | saldo para a meta ÷ dias úteis restantes |
| Ritmo 7D | média dos sete dias comparáveis |
| Variação LY | variação contra o mesmo período do ano anterior |
| Dias Zerados | dias elegíveis sem resultado |
| Potencial Recuperável | parcela do GAP recuperável no período |
| Qualidade dos Dados | registros válidos ÷ registros totais |
| Impacto da Pendência | resultado associado a registros não validados |

Fórmulas conceituais:

```DAX
% Realizado = DIVIDE([Realizado], [Meta])

% Tendência = DIVIDE([Tendência], [Meta])

GAP Projetado = [Tendência] - [Meta]

Necessário por Dia =
DIVIDE(
    MAX(0, [Meta] - [Realizado]),
    [Dias Úteis Restantes]
)

Variação LY =
DIVIDE(
    [Realizado] - [Realizado LY],
    [Realizado LY]
)
```

Essas fórmulas não substituem silenciosamente as medidas existentes. O processo correto será comparar expressão, filtro e resultado de cada medida atual antes da migração.

---

## 13. Qualidade dos dados

Toda métrica executiva deverá mostrar:

- data e hora da atualização;
- fonte;
- percentual validado;
- quantidade pendente;
- impacto estimado;
- status: consolidado, parcial, em processamento ou crítico.

### Central de qualidade

Filas iniciais:

- Em identificação Datasys;
- Sem vendedor — BU Móvel;
- Sem vendedor — BU Fibra;
- Sem vendedor — KPIs;
- Duplicidades de UP;
- Status conflitantes;
- lojas sem correspondência;
- registros fora da janela esperada.

### Novo indicador

```text
Confiabilidade = registros válidos ÷ registros recebidos
```

A confiabilidade será exibida ao lado do número, não escondida em uma página técnica.

---

## 14. Plano de ação

Cada alerta deverá poder originar uma ação com:

- prioridade;
- problema;
- indicador de origem;
- loja/regional;
- impacto;
- responsável;
- prazo;
- status;
- evidência;
- comentário;
- resultado pós-ação.

O vermelho será reservado para situações críticas e acionáveis. Resultado baixo sem responsável, impacto ou ação não será tratado como alerta completo.

---

## 15. Perfis de acesso

| Perfil | Escopo |
|---|---|
| Diretoria | grupo completo |
| Diretor de área | indicadores autorizados de todo o grupo |
| Regional | sua regional e lojas |
| Coordenador | lojas sob sua responsabilidade |
| Gerente | sua loja |
| Controladoria | qualidade e dados autorizados |
| Consulta | visão executiva sem dados sensíveis |

A segurança deverá ser aplicada no modelo e/ou backend. Ocultar visual não é controle de acesso.

---

## 16. Sistema visual

### Paleta funcional

| Função | Direção |
|---|---|
| Navegação e identidade | navy JUFAP |
| Informação e seleção | azul |
| Resultado positivo | verde fechado |
| Atenção | âmbar |
| Crítico/acionável | vermelho controlado |
| Fundo | cinza muito claro |
| Cartões | branco |

### Regras de percepção

- no máximo quatro KPIs protagonistas por dobra;
- cor forte somente para exceção;
- cor nunca será o único sinal;
- títulos responderão perguntas;
- números terão meta e comparável;
- tabelas completas ficarão em aprofundamento;
- barras e posição serão preferidas para comparação;
- velocímetros serão substituídos por bullet charts ou barras de progresso;
- nenhuma página terá rolagem dentro de várias rolagens;
- textos de leitura terão resultado, causa e ação.

---

## 17. JUFAP Brief

A mesma camada semântica alimentará um resumo diário/mensal por perfil.

### Estrutura

- quatro números principais;
- leitura do período;
- principal motor;
- principal pressão;
- lojas que mais contribuíram;
- lojas em atenção;
- ações prioritárias;
- qualidade das fontes;
- link para abrir o JUFAP One.

O assunto deve carregar a conclusão, por exemplo:

> JUFAP Brief · Controle e Faturamento TIM concentram a oportunidade de recuperação

---

## 18. Estado da extração de fórmulas

### Já confirmado diretamente no PBIX

- páginas e ordem;
- visuais e tipos;
- campos projetados em parte dos visuais;
- filtros de página/visual;
- seleções padrão;
- entidades referenciadas;
- medidas `REALIZADO` e `REALIZADO LY2` usadas na comparação anual;
- regras locais citadas nesta auditoria.

### Ainda não confirmado como expressão exata

- corpo completo de todas as medidas DAX;
- colunas e tabelas calculadas;
- consultas M;
- relacionamentos e cardinalidades;
- papéis de RLS;
- perfil de linhas de todas as tabelas.

O PBIX guarda essa camada no `DataModel`, em formato tabular comprimido. A integração produtiva só será considerada concluída depois da extração e reconciliação dessas expressões. O protótipo visual não apresenta números demonstrativos como se fossem dados ao vivo.

---

## 19. Conclusão

O Realizado e Tendência é uma excelente base para iniciar o JUFAP One. Ele já reúne metas, realizado, projeção, composição comercial, ritmo, exceções, histórico, UP e qualidade.

Sua transformação não será uma simples troca de cores. O objetivo é transformar:

```text
29 páginas em que o usuário procura a resposta
```

em:

```text
uma jornada em que o sistema reúne as evidências e explica a resposta
```

A primeira versão navegável foi construída com essa arquitetura. A próxima fase técnica é substituir o snapshot demonstrativo pelo modelo semântico oficial e validar medida por medida.