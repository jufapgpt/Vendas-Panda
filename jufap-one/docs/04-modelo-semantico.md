# Modelo Semântico-Alvo — JUFAP One

## 1. Princípio

O JUFAP One não consumirá dezenas de planilhas e modelos isolados diretamente na interface. Todas as áreas deverão compartilhar dimensões conformadas e um catálogo único de medidas.

```text
Fontes operacionais
      ↓
Camada de ingestão e qualidade
      ↓
Modelo semântico corporativo
      ↓
JUFAP One + PBIs detalhados + JUFAP Brief
```

## 2. Dimensões conformadas

### `dData`

- DataID;
- Data;
- Dia;
- Dia da semana;
- Número do dia da semana;
- Semana;
- Mês;
- Número do mês;
- Trimestre;
- Ano;
- Competência;
- Dia útil;
- Feriado;
- Operação aberta;
- Dia comparável;
- Mesmo dia do ano anterior;
- Dias úteis decorridos;
- Dias úteis restantes.

### `dLoja`

- LojaID;
- Código de origem por sistema;
- Nome oficial;
- Nome curto;
- EmpresaID;
- CNPJ;
- Marca/operação;
- RegionalID;
- CoordenadorID;
- Estado;
- Cidade;
- Shopping/endereço;
- Data de abertura;
- Data de encerramento;
- Ativa;
- Loja comercial;
- Participa de meta;
- Participa de ranking;
- Vigência inicial;
- Vigência final.

### `dPessoa`

- PessoaID;
- Matrícula;
- CPF controlado/hash;
- Nome oficial;
- CargoID;
- LojaID;
- GestorID;
- Data de admissão;
- Data de desligamento;
- Ativo;
- Vigência de lotação.

### `dIndicador`

- IndicadorID;
- Nome oficial;
- Grupo;
- Unidade;
- Formato;
- Melhor quando maior/menor;
- Limite positivo;
- Limite de atenção;
- Limite crítico;
- Proprietário de negócio;
- Responsável técnico;
- Frequência;
- Versão da regra.

### `dPlanoServico`

- PlanoServicoID;
- Nome;
- Família;
- Categoria;
- Tipo;
- Faixa de valor;
- Elegível para portabilidade;
- Elegível para dependente;
- Elegível para proteção;
- Vigência.

### `dProduto`

- ProdutoID;
- SKU;
- EAN;
- Descrição oficial;
- Família;
- Categoria;
- Fabricante;
- Modelo;
- Memória;
- Elegível Pitzi;
- Elegível acessório;
- Vigência.

### `dFonte`

- FonteID;
- Sistema;
- Entidade;
- Proprietário;
- Frequência esperada;
- Horário limite;
- Criticidade;
- Última carga;
- Status da carga.

### `dStatus`

- StatusID;
- Domínio;
- Código de origem;
- Status canônico;
- Válido para realizado;
- Válido para tendência;
- Pendente;
- Cancelado;
- Ordem do estágio.

## 3. Fatos

### `fVendaServico`

**Grão:** uma linha de venda/ativação/item.

Campos mínimos:

- VendaItemID;
- PedidoID;
- DataVendaID;
- DataAtivacaoID;
- LojaID;
- PessoaID;
- PlanoServicoID;
- ProdutoID;
- StatusID;
- Quantidade;
- ValorBruto;
- Desconto;
- ValorLiquido;
- Origem;
- FonteID;
- DataHoraCarga;
- StatusQualidade.

### `fMetaIndicador`

**Grão:** uma meta por data/competência, loja e indicador.

- MetaID;
- DataID;
- LojaID;
- IndicadorID;
- ValorMeta;
- Cenário;
- Vigência;
- FonteID.

### `fAtivacaoDatasys`

**Grão:** um registro operacional Datasys.

- RegistroDatasysID;
- PedidoID;
- Linha/contrato;
- DataID;
- LojaID;
- PessoaID;
- StatusID;
- Valor;
- DataHoraRecebimento;
- DataHoraAtualizacao;
- StatusQualidade.

### `fUP`

**Grão:** um registro UP G ou UP Z.

- UPID;
- ChaveNegocio;
- TipoUP;
- DataID;
- LojaID;
- PessoaID;
- StatusID;
- Duplicado;
- RegistroOriginalID;
- ConsideradoResultado;
- ValorImpacto;
- FonteID.

### `fPortabilidade`

**Grão:** uma solicitação de portabilidade.

- PortabilidadeID;
- DataSolicitacaoID;
- DataAtivacaoID;
- LojaID;
- PessoaID;
- PlanoServicoID;
- StatusID;
- DiasAteAtivacao;
- MotivoPerda;
- FonteID.

### `fPitzi`

**Grão:** uma oportunidade/oferta de proteção por aparelho elegível.

- OportunidadePitziID;
- VendaItemID;
- DataID;
- LojaID;
- PessoaID;
- ProdutoID;
- Elegível;
- Ofertado;
- Vendido;
- Valor;
- MotivoNaoVenda;
- FonteID.

### `fQualidadeDados`

**Grão:** uma ocorrência de divergência.

- DivergenciaID;
- DataAberturaID;
- DataSolucaoID;
- FonteID;
- TipoDivergencia;
- RegistroOrigemID;
- LojaID;
- PessoaID;
- IndicadorID;
- Severidade;
- ValorImpacto;
- QuantidadeImpacto;
- ResponsavelID;
- Prazo;
- Status;
- Evidencia;
- Solucao.

### `fPlanoAcao`

**Grão:** uma ação gerencial.

- AcaoID;
- AlertaID;
- DataAberturaID;
- DataConclusaoID;
- LojaID;
- RegionalID;
- IndicadorID;
- Prioridade;
- Diagnostico;
- ImpactoEsperado;
- ResponsavelID;
- Prazo;
- Status;
- ResultadoDepois;
- Comentario.

## 4. Relacionamentos

Padrão:

- dimensão `1 → *` fato;
- direção de filtro preferencialmente única;
- fatos não se relacionam diretamente entre si;
- tabelas ponte apenas quando houver muitos-para-muitos real e documentado;
- datas alternativas usam relações inativas e medidas explícitas;
- histórico de loja/coordenador/pessoa respeita vigência.

Exemplo:

```text
dData ─┬─ fVendaServico
       ├─ fMetaIndicador
       ├─ fAtivacaoDatasys
       ├─ fUP
       ├─ fPortabilidade
       ├─ fPitzi
       ├─ fQualidadeDados
       └─ fPlanoAcao

dLoja ─┬─ mesmos fatos

dPessoa┬─ fatos com responsabilidade individual

dIndicador ─ fMetaIndicador / fQualidadeDados / fPlanoAcao
```

## 5. Regra temporal

O modelo deverá distinguir:

- data da venda;
- data da ativação;
- data de faturamento;
- data de competência;
- data de carga;
- data de solução da divergência.

Nenhuma medida de tempo deverá depender implicitamente de uma LocalDateTable automática.

## 6. Qualidade e lineage

Todo fato terá:

- fonte;
- data e hora da carga;
- chave de origem;
- status de qualidade;
- regra de deduplicação;
- registro de rejeição;
- data de correção.

Toda medida terá:

- versão;
- expressão;
- proprietário;
- fonte principal;
- dependências;
- páginas consumidoras.

## 7. Segurança

Tabela de escopo:

| E-mail | Perfil | TipoEscopo | EscopoID | Vigência inicial | Vigência final |
|---|---|---|---|---|---|
| diretor@... | Diretoria | Grupo | JUFAP | data | data |
| regional@... | Regional | Regional | TSP | data | data |
| coordenador@... | Coordenador | Pessoa | ID | data | data |
| gerente@... | Gerente | Loja | LojaID | data | data |

A segurança será aplicada no modelo/backend. O frontend poderá adaptar a experiência, mas não será a barreira de proteção.

## 8. Contrato para expansão

Os próximos PBIs serão conectados às mesmas dimensões:

- Financeiras;
- Rebate;
- Omie;
- Estoque/WOS;
- RH;
- Controle de ponto;
- Comissões/Caju;
- Fluxo e Conversão;
- MChat;
- Controladoria.

Essa decisão permite que os números “conversem” sem reconstruir a arquitetura a cada novo relatório.