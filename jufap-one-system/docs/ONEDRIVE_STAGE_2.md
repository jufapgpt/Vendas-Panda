# Etapa 2 — conexão com OneDrive e SharePoint

## Informações que serão recebidas

Para cada pasta ou arquivo de origem:

- Link web corporativo.
- Site e biblioteca.
- Caminho relativo dentro da biblioteca.
- Nome da aba, tabela ou intervalo consumido.
- Frequência de atualização.
- Responsável pelo processo.
- PBI consumidor.
- Histórico disponível.
- Indicação de pasta oficial, backup ou arquivo temporário.

## Configuração técnica

Serão preenchidas as variáveis:

```env
ONEDRIVE_MODE=graph
ONEDRIVE_TENANT_HOST=
ONEDRIVE_SITE_ID=
ONEDRIVE_DRIVE_ID=
ONEDRIVE_ROOT_PATH=
ONEDRIVE_CLIENT_ID=
ONEDRIVE_CLIENT_SECRET=
```

Segredos serão armazenados no ambiente de execução, nunca no código.

## Processo de integração

1. Validar permissão de leitura do aplicativo.
2. Identificar `siteId`, `driveId` e caminho raiz.
3. Criar o catálogo oficial de fontes.
4. Executar uma carga completa controlada.
5. Gravar hashes, versões e horários.
6. Ativar leitura incremental por cursor/delta.
7. Validar esquema e regras de qualidade.
8. Reconciliar com o PBI atual.
9. Homologar antes de publicar.

## Manifesto de fonte

Cada origem terá, no mínimo:

```json
{
  "code": "BASE_DATASYS",
  "domain": "commercial",
  "operation": "TIM",
  "driveId": "pending",
  "path": "pending",
  "filePattern": "*.xlsx",
  "tableOrSheet": "pending",
  "grain": "one activation per row",
  "keyFields": ["pending"],
  "dateField": "pending",
  "frequency": "intraday",
  "owner": "pending",
  "sensitivity": "internal"
}
```

## Validações mínimas

- Arquivo encontrado e legível.
- Cabeçalhos esperados presentes.
- Tipos de data, número e identificador válidos.
- Chave sem duplicidade indevida.
- Loja e vendedor relacionados ao cadastro mestre.
- Datas dentro da competência esperada.
- Linhas rejeitadas registradas com motivo.
- Totais reconciliados com a fonte e o PBI.
