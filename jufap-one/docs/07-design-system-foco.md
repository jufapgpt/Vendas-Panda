# Design System e Ciência do Foco — JUFAP One

## 1. Princípio central

> **Simples na primeira camada, complexo sob demanda.**

A página não deve mostrar tudo ao mesmo tempo. Ela deve conduzir o olhar na ordem certa:

1. estado geral;
2. exceção relevante;
3. explicação;
4. unidade responsável;
5. ação.

## 2. Hierarquia de atenção

### Nível 1 — 5 segundos

A pessoa deve responder:

- estamos bem ou mal?;
- qual é a tendência?;
- quanto está em risco?;
- onde agir primeiro?

Elementos permitidos:

- quatro KPIs principais;
- uma conclusão curta;
- uma prioridade crítica.

### Nível 2 — 30 segundos

A pessoa deve entender:

- principal motor positivo;
- maior pressão;
- lojas que explicam o desvio;
- possibilidade de recuperação;
- confiabilidade dos dados.

### Nível 3 — investigação

A pessoa acessa:

- evolução;
- ranking;
- composição;
- dossiê da loja;
- registros;
- evidências;
- ações.

## 3. Paleta funcional

```text
Navy JUFAP     #0B174F  navegação e identidade
Navy secund.   #122269  superfícies institucionais
Azul           #1473E6  seleção e informação
Azul claro     #5AA7FF  destaques secundários
Fundo          #F4F6FA  área geral
Cartão         #FFFFFF  conteúdo
Texto          #202B43  texto principal
Texto secund.  #6B7487  contexto
Linha          #E5E9F1  divisões
Verde          #0E7C66  positivo
Âmbar          #A65A08  atenção
Vermelho       #C33D4A  crítico e acionável
Roxo           #6557C9  comparável/histórico
```

Regra aproximada:

- 70% neutros;
- 20% identidade JUFAP;
- 10% sinalização.

## 4. Uso de cor

A cor mais percebida é aquela que contrasta com o conjunto. Portanto:

- vermelho não será usado como decoração;
- verde não será aplicado em todo número acima de zero;
- cada seção terá no máximo uma cor dominante de atenção;
- status também usarão texto e ícone;
- cores semelhantes não serão o único meio de diferenciar séries;
- fundos coloridos serão claros; texto colorido manterá contraste.

## 5. Tipografia

Prioridade:

1. Inter;
2. Segoe UI;
3. Arial/sans-serif.

Escala:

| Elemento | Tamanho sugerido |
|---|---:|
| KPI principal | 28–40 px |
| Título de página | 28–32 px |
| Título de seção | 20–26 px |
| Título de cartão | 14–16 px |
| Texto | 13–15 px |
| Legenda | 11–12 px |

Números usarão algarismos tabulares para alinhamento.

## 6. Cartões

- raio entre 12 e 16 px;
- sombra muito leve;
- borda sutil;
- espaçamento interno entre 18 e 24 px;
- título curto;
- um assunto principal por cartão;
- estado vazio explícito;
- fonte e atualização acessíveis.

## 7. Gráficos

### Usar

- barras horizontais para ranking;
- bullet chart para meta;
- linha para tendência e ritmo;
- waterfall para explicar variação;
- heatmap controlado para dias/lojas;
- sparklines em KPIs;
- matriz somente para investigação;
- small multiples quando a comparação exigir a mesma escala.

### Evitar

- muitos velocímetros;
- pizzas/roscas para comparações precisas;
- gráficos 3D;
- cores diferentes para cada loja sem função;
- duas escalas sem explicação;
- rótulos em todos os pontos;
- tabela enorme antes da conclusão;
- gráfico sem pergunta.

## 8. Títulos orientados à decisão

Evitar:

> Faturamento por loja

Preferir:

> Quais lojas mais explicam o GAP de Faturamento TIM?

Evitar:

> Evolução diária

Preferir:

> O ritmo atual é suficiente para atingir a meta?

Evitar:

> Portabilidade

Preferir:

> Onde as solicitações estão deixando de virar ativações?

## 9. Narrativa

Texto curto, com palavras-chave destacadas e no máximo um parágrafo principal.

Estrutura:

```text
Resultado → motor → pressão → concentração → ação
```

O texto nunca repetirá todos os números do gráfico. Ele explicará a relação entre eles.

## 10. Filtros

Filtros principais sempre visíveis:

- período;
- regional;
- coordenador;
- loja.

Filtros avançados em “Mais filtros”.

Regras:

- o escopo selecionado será escrito em linguagem natural;
- haverá botão Limpar filtros;
- seleções persistirão ao navegar por âncoras;
- o filtro de amanhã mostrará previsão, não realizado;
- comparáveis respeitarão dias úteis e dia da semana;
- filtro sem opção disponível deverá explicar o motivo.

## 11. Menu lateral

- fixo em desktop;
- recolhível;
- ícone + título;
- contador apenas para alertas reais;
- destaque automático da seção visível;
- versão móvel em gaveta;
- perfil e escopo na parte inferior.

## 12. Acessibilidade

- contraste mínimo de texto normal 4,5:1;
- componentes relevantes com contraste de pelo menos 3:1;
- foco de teclado visível;
- todos os controles com rótulo;
- texto alternativo para imagens;
- status não dependem apenas de cor;
- áreas clicáveis adequadas;
- respeitar redução de movimento;
- tabelas com cabeçalho semântico;
- impressão legível.

## 13. Densidade

A densidade varia por camada:

| Camada | Densidade |
|---|---|
| Executiva | baixa |
| Gerencial | média |
| Analítica | média-alta |
| Operacional | alta, com busca e paginação |

A one page pode ser longa, mas cada dobra deve possuir um foco dominante.

## 14. Microinterações

- mudança de filtro com transição discreta;
- drawer da loja sem perder o contexto;
- tooltips ricos para definições;
- estados de carregamento com esqueleto;
- alertas de fonte atrasada;
- confirmação para ações críticas;
- feedback após atualização ou exportação.

## 15. Responsividade

### Desktop amplo

- menu lateral aberto;
- quatro KPIs em linha;
- conteúdo em duas colunas quando fizer sentido.

### Notebook

- menu reduzido;
- filtros com rolagem horizontal;
- gráficos preservam escala.

### Mobile executivo

- foco em pulso, leitura e alertas;
- um KPI por linha;
- tabelas substituídas por cartões;
- dossiê em tela cheia;
- detalhes operacionais direcionam para desktop.

## 16. Regra de qualidade estética

A página deve parecer sofisticada porque possui:

- hierarquia;
- ritmo;
- consistência;
- espaço;
- contraste;
- clareza.

Não por excesso de efeitos, cores, sombras ou animações.