# Qualidade e confiabilidade dos dados

## Objetivo

Todo número exibido pelo JUFAP One deve informar não apenas o valor, mas também sua atualidade e confiabilidade.

## Estados

| Estado | Significado |
|---|---|
| Consolidado | Carga concluída, reconciliação aprovada e sem pendência material |
| Parcial | Período ainda aberto ou fonte incompleta |
| Processando | Carga em andamento |
| Atenção | Há pendências, mas o número ainda pode ser utilizado com ressalva |
| Não confiável | Divergência material ou falha de fonte impede uso gerencial |

## Indicadores mínimos

- última atualização por fonte;
- quantidade recebida, válida e rejeitada;
- registros sem loja ou vendedor;
- duplicidades;
- arquivos não processados;
- impacto financeiro associado;
- tempo de tratamento;
- responsável.

## Pontuação inicial

```text
registros válidos ÷ registros recebidos
```

A pontuação será ampliada por domínio para considerar atualidade, reconciliação, completude e materialidade. Ela nunca substitui a explicação do problema.

## Regras operacionais

- A falha de um arquivo gera uma ocorrência de qualidade.
- O cursor delta só avança quando todos os arquivos daquela rodada são processados sem erro.
- Arquivos sem alteração são ignorados por ETag, data e tamanho.
- O staging conserva o conteúdo original e a versão normalizada.
- Linhas rejeitadas conservam a lista de erros.
- A correção não apaga o histórico da ocorrência.
- Um número não confiável não deve ser apresentado como consolidado.

## Categorias iniciais

- Em identificação Datasys.
- Vendedor não encontrado — BU Móvel.
- Vendedor não encontrado — BU Fibra.
- KPI sem vendedor.
- UP duplicado.
- Mudança inesperada de estrutura de fonte.
