# Governança de métricas

## Regra central

Um indicador não pode ser definido dentro de um cartão, gráfico ou texto. A interface recebe um resultado calculado pela camada de métricas.

## Ficha obrigatória

- Código imutável.
- Nome gerencial.
- Domínio e operação.
- Conceito de negócio.
- Fórmula original e fórmula canônica.
- Tabelas e campos de origem.
- Granularidade.
- Campo de data.
- Status incluídos e exclusões.
- Unidade e formato.
- Responsável.
- Frequência de atualização.
- Limites de atenção e criticidade.
- Data inicial e final de validade.
- Dependências.
- Testes de reconciliação.

## Ciclo de mudança

1. Solicitação documentada.
2. Análise de impacto.
3. Nova versão da definição.
4. Testes automáticos.
5. Comparação com a versão vigente.
6. Homologação da área proprietária.
7. Publicação com data efetiva.
8. Registro de auditoria.

## Estados

- `draft`: em desenho.
- `extracted`: copiada do modelo atual.
- `reconciled`: validada contra o PBI.
- `approved`: aprovada pelo dono do indicador.
- `active`: oficial no JUFAP One.
- `deprecated`: mantida somente para histórico.

## Princípio de confiança

Todo KPI executivo deverá trazer:

- horário da última carga;
- percentual de qualidade;
- quantidade ou valor pendente;
- indicação de parcial ou fechado;
- link para o detalhe e a fonte de auditoria.
