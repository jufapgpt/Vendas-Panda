# Etapa 2 — Material necessário para conectar o OneDrive

## 1. Acesso corporativo

Fornecer por canal seguro, nunca pelo Git:

- Tenant ID do Microsoft Entra.
- Client ID do aplicativo autorizado.
- Segredo ou certificado do aplicativo.
- Drive ID do OneDrive ou biblioteca do SharePoint.
- Confirmação do escopo de leitura concedido.

## 2. Pasta raiz

Informar:

- link web da pasta raiz;
- site do SharePoint, quando aplicável;
- biblioteca de documentos;
- caminho relativo dentro da biblioteca;
- indicação de pastas oficiais, temporárias e de backup.

## 3. Uma ficha por fonte

| Campo | Exemplo |
|---|---|
| Código | `BASE_DATASYS` |
| Nome | Base Datasys |
| Domínio | Comercial |
| Operação | TIM |
| Caminho | `/BI/Realizado e Tendencia/Datasys` |
| Padrão de arquivo | `*.xlsx` |
| Aba/tabela | `Base` |
| Granularidade | Uma ativação por linha |
| Chave | Pedido + linha |
| Datas | Venda, ativação e carga |
| Frequência | Intradiária |
| Responsável | Área e pessoa |
| Histórico | Desde 2024 |
| Sensibilidade | Restrita |

## 4. Amostras

Para cada fonte, disponibilizar:

- um arquivo atual;
- um arquivo histórico;
- um exemplo com divergência conhecida;
- um exemplo de exclusão ou correção;
- o total esperado no Power BI para pelo menos Grupo, Regional e Loja.

## 5. Regras de negócio

Confirmar explicitamente:

- status incluídos e excluídos;
- tratamento de troca, devolução e cancelamento;
- data usada por indicador;
- lojas participantes;
- regra de dias úteis;
- meta e rateio;
- lógica de tendência;
- duplicidades;
- vínculo de vendedor;
- fechamento de competência;
- tolerância aceita na reconciliação.

## 6. Processo de ativação

1. Duplicar `config/sources.stage2.example.json`.
2. Preencher os caminhos e metadados.
3. Manter `enabled=false` até validar a fonte.
4. Rodar a ingestão em ambiente de homologação.
5. Conferir staging e qualidade.
6. Materializar métricas candidatas.
7. Reconciliar com o PBI atual.
8. Aprovar o indicador.
9. Ativar a fonte e o indicador para o JUFAP One.

## Regra de segurança

Credenciais deverão ser configuradas em um cofre de segredos ou nas configurações protegidas do ambiente. Não devem ser enviadas em planilhas, arquivos JSON ou commits.
