# Realizado e Tendência — primeiro domínio do JUFAP One

## Inventário confirmado

O PBIX analisado possui 29 páginas e 442 componentes visuais. A reorganização aprovada é:

| Jornada JUFAP One | Páginas de origem |
|---|---|
| Pulso executivo | RT, Ranking, Destaques, Velocidade e YOY |
| Resultado | RT Serviços, Faturamento TIM, Fibra, Financeiro, Acessórios e Pitzi |
| Rede de lojas | Ranking, Destaques, Zerados e Diário |
| Composição | Mix de Planos, Dependentes, Portabilidade, DOJI e Conversão Pitzi |
| Ritmo | Diário, Velocidade, YOY Data, Dia da Semana e Mês |
| UP | UP G ou Z, Diário UP e Duplicata detalhada |
| Qualidade | Em identificação Datasys e vendedores não encontrados |
| Ação | Nova camada derivada dos ofensores |

## Páginas

1. RT
2. RT - Serviços
3. RT - Faturamento TIM
4. RT - FIBRA
5. RT - Financeiro
6. RT - Acessórios
7. RT - PITZI
8. Ranking
9. Destaques
10. Zerados
11. Diário
12. Mix de Planos
13. Dependentes
14. Portabilidade
15. Fat. TIM
16. UP G ou Z - Dados
17. Diário UP
18. Duplicata de UP G ou Z - Detalhado
19. Financeiro TIM
20. Velocidade
21. Em identificação Datasys
22. Sem vendedores encontrados - BU Móvel
23. Sem vendedores encontrados - BU Fibra
24. Sem vendedores encontrados - KPIs
25. DOJI
26. YOY - Data
27. YOY - Dia Semana
28. YOY - Mês
29. RT PITZI - Conversão

## Entidades observadas

- `00 - DATA`
- `BASE DATASYS`
- `BASE CUST`
- `BASE VENDAS`
- `AUXILIAR UNIFICADA PARA LOJAS`
- `Medidas Realizado e Tendência`

## Regras já identificadas na camada visual

- Exclusão de `ESCR` e `MATRIZ` em alguns contextos comerciais.
- Exclusão de pedidos classificados como `Troca` e `Devolução` em determinadas páginas.
- Uso de status Datasys como `ATIVADA`, `PENDENTE` e `SUSPENSO` em comparações específicas.
- Ano padrão 2026 em segmentações observadas.
- Medidas `REALIZADO` e `REALIZADO LY2` em comparação anual.

Essas regras não permanecerão escondidas em páginas. Elas serão registradas como política de indicador ou tratamento de origem.

## Critério de aceite do módulo produtivo

- DAX integral inventariado.
- Power Query integral documentado.
- Fontes localizadas e versionadas.
- Totais reconciliados em grupo, regional, coordenador, loja, vendedor e data.
- Indicadores com qualidade e atualização visíveis.
- Perfis de acesso testados.
- Links para detalhe do PBI preservados.
