# Dicionário de Indicadores — Realizado e Tendência

Este documento define a camada semântica desejada para o JUFAP One. O campo **Status** diferencia o que foi confirmado na estrutura do PBIX do que ainda depende da reconciliação da expressão DAX exata.

## 1. Medidas estruturais

| Indicador | Unidade | Direção | Definição canônica | Status |
|---|---|---|---|---|
| Meta | moeda/quantidade | depende | objetivo oficial no contexto selecionado | Conceito confirmado; expressão a validar |
| Realizado | moeda/quantidade | maior | resultado válido acumulado | Medida `REALIZADO` observada; expressão a extrair |
| Realizado LY | moeda/quantidade | comparável | realizado no período comparável anterior | `REALIZADO LY2` observado; expressão a extrair |
| % Realizado | percentual | maior | Realizado ÷ Meta | Conceito observado; expressão a validar |
| Tendência | moeda/quantidade | maior | projeção de fechamento pelo calendário e ritmo oficial | Conceito observado; expressão a validar |
| % Tendência | percentual | maior | Tendência ÷ Meta | Conceito observado; expressão a validar |
| GAP Atual | moeda/quantidade | maior | Realizado − Meta acumulada até a data | Proposto para padronização |
| GAP Projetado | moeda/quantidade | maior | Tendência − Meta total | Conceito observado; sinal a validar |
| Média Diária | moeda/quantidade | maior | Realizado ÷ dias elegíveis decorridos | Conceito observado; denominador a validar |
| Necessário por Dia | moeda/quantidade | menor | saldo para a meta ÷ dias elegíveis restantes | Proposto para padronização |
| Velocidade 7D | moeda/quantidade | maior | média dos sete dias comparáveis mais recentes | Proposto para padronização |
| Variação LY | percentual | maior | (Realizado − Realizado LY) ÷ Realizado LY | Proposto para padronização |
| Dias Zerados | quantidade | menor | dias elegíveis sem produção válida | Conceito confirmado; regra de elegibilidade a validar |
| Potencial Recuperável | moeda/quantidade | maior | parte do GAP ainda recuperável pela capacidade e dias restantes | Novo indicador JUFAP One |
| Confiabilidade | percentual | maior | registros válidos ÷ registros recebidos | Novo indicador JUFAP One |
| Impacto da Pendência | moeda/quantidade | menor | resultado ligado a registros não validados | Novo indicador JUFAP One |

## 2. Fórmulas canônicas propostas

```DAX
% Realizado =
DIVIDE([Realizado], [Meta])
```

```DAX
% Tendência =
DIVIDE([Tendência], [Meta])
```

```DAX
GAP Atual =
[Realizado] - [Meta Acumulada]
```

```DAX
GAP Projetado =
[Tendência] - [Meta]
```

```DAX
Necessário por Dia =
VAR Saldo = MAX(0, [Meta] - [Realizado])
RETURN
    DIVIDE(Saldo, [Dias Elegíveis Restantes])
```

```DAX
Variação LY =
DIVIDE(
    [Realizado] - [Realizado LY],
    [Realizado LY]
)
```

```DAX
Confiabilidade =
DIVIDE(
    [Registros Válidos],
    [Registros Recebidos]
)
```

Essas fórmulas são o **contrato semântico-alvo**. Antes de substituir qualquer medida atual, será necessário comparar resultado, filtros e expressão com o modelo oficial.

## 3. Indicadores comerciais

| Indicador | Unidade | Relações necessárias | Pergunta gerencial |
|---|---|---|---|
| Pós Total | quantidade | Pós Pago + Controle + regras de status | A produção total de planos sustenta a meta? |
| Pós Pago | quantidade | plano, loja, vendedor, data | Quais lojas e pessoas entregam o plano de maior valor? |
| Controle | quantidade | plano, loja, vendedor, data | Onde está o maior desvio dentro do Pós Total? |
| Fibra | quantidade/receita | venda, ativação, instalação e elegibilidade | Quanto foi vendido, ativado e remunerado? |
| Faturamento TIM | moeda | produto/serviço, loja, data, status | Qual é o resultado reconhecido e o GAP projetado? |
| Upgrade | quantidade/receita | tipo G/Z, validação, duplicidade | Quanto do UP recebido chegou ao resultado? |
| Pré-Pago | quantidade | ativação e status | Qual a contribuição do pré-pago? |
| Financeiro | moeda | venda, instituição, loja e status | Quanto a operação financeira agrega ao resultado? |
| Descontos | moeda | venda, vendedor, produto | Quanto do faturamento foi cedido em desconto? |
| % Descontos | percentual | desconto ÷ base definida | A política comercial está pressionando margem? |
| Acessórios | moeda | aparelho, item, venda e vendedor | Quanto de receita adicional foi capturada? |
| Attach Rate Acessórios | percentual | vendas com acessório ÷ aparelhos elegíveis | A loja agrega valor à venda principal? |
| Pitzi | moeda/quantidade | aparelho elegível, oferta e venda | A proteção está sendo oferecida e convertida? |
| Conversão Pitzi | percentual | Pitzi vendido ÷ base elegível | Qual a eficiência de proteção? |
| Quantidade Pitzi | quantidade | contrato e venda | Qual o volume produzido? |
| Port-in Solicitada | quantidade | solicitação, cliente, loja e data | Quantas oportunidades foram abertas? |
| Port-in Ativada | quantidade | ativação, status e data | Quantas solicitações chegaram à produção válida? |
| Conversão Portabilidade | percentual | ativadas ÷ solicitadas | Onde as solicitações estão se perdendo? |
| Dependentes | quantidade | titular, dependente, vendedor | A equipe está ampliando o valor do plano? |
| Mix de Planos | percentual | família de plano ÷ Pós Total | A composição sustenta faturamento e qualidade? |
| Películas | moeda/quantidade | aparelho, venda e vendedor | A agregação acompanha o volume de aparelhos? |
| DOJI | a validar | contrato, aparelho e status | Qual o papel da operação no resultado e risco? |

## 4. Indicadores de UP

| Indicador | Definição-alvo |
|---|---|
| UP Recebidos | todos os registros recebidos no período |
| UP Identificados | registros com loja e vendedor vinculados |
| UP Validados | registros que passaram nas regras de qualidade |
| UP Duplicados | registros com chave de negócio repetida |
| UP Considerados | registros válidos incorporados ao resultado |
| Taxa de Validação | UP Validados ÷ UP Recebidos |
| Taxa de Duplicidade | UP Duplicados ÷ UP Recebidos |
| Impacto UP Pendente | valor/quantidade que ainda pode alterar meta, ranking ou comissão |

## 5. Indicadores de qualidade

| Indicador | Definição-alvo | Impacto ligado |
|---|---|---|
| Em identificação Datasys | registro ainda sem vínculo final | realizado e tendência |
| Sem vendedor — BU Móvel | venda/ativação sem VendedorID válido | ranking e comissão |
| Sem vendedor — BU Fibra | venda/ativação sem VendedorID válido | meta e comissão |
| Sem vendedor — KPIs | KPI sem vínculo de pessoa | desempenho e pagamento |
| Idade da Pendência | data atual − data de entrada da divergência | prioridade |
| SLA de Tratamento | tempo entre abertura e solução | eficiência da controladoria |
| Pendências com Impacto | quantidade de pendências que mudam um indicador | confiança executiva |
| Valor em Risco de Dados | valor relacionado a registros não validados | resultado e fechamento |

## 6. Faixas de status

As faixas não devem ficar codificadas nos visuais. Serão armazenadas em `dIndicador`.

Exemplo inicial para indicadores em que maior é melhor:

| Status | Regra inicial |
|---|---|
| Acima | ≥ 100% |
| Atenção | 90% a 99,99% |
| Crítico | < 90% |

Exemplo inicial para qualidade:

| Status | Regra inicial |
|---|---|
| Confiável | ≥ 98% |
| Atenção | 95% a 97,99% |
| Crítico | < 95% |

A diretoria poderá aprovar limites diferentes por indicador.

## 7. Campos obrigatórios no catálogo

Cada indicador produtivo deverá registrar:

- nome oficial;
- descrição;
- expressão DAX;
- tabela de medidas;
- formato;
- unidade;
- melhor quando maior/menor;
- meta aplicável;
- data de referência;
- status incluídos;
- exclusões;
- granularidade;
- fonte;
- frequência de atualização;
- responsável do dado;
- proprietário de negócio;
- comparáveis permitidos;
- páginas e componentes consumidores;
- data da última alteração;
- versão.

## 8. Regra de reconciliação

Uma medida só poderá ser marcada como **oficial** quando:

1. a expressão DAX estiver extraída;
2. filtros implícitos e explícitos estiverem documentados;
3. o total for reconciliado com a fonte operacional;
4. o resultado for comparado em grupo, regional e loja;
5. os casos de troca, devolução, cancelamento e pendência forem testados;
6. a área proprietária aprovar a definição.
