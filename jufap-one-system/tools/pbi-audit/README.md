# Inventário PBIP/TMDL

A ferramenta `scan_pbip.py` percorre uma pasta salva como Projeto do Power BI e gera um JSON com:

- páginas e ordem;
- quantidade e tipos de visuais;
- entidades, colunas e medidas referenciadas pelos visuais;
- arquivos TMDL;
- medidas DAX encontradas no modelo semântico;
- possíveis fontes e expressões de Power Query presentes no projeto.

Uso:

```bash
npm run pbi:audit -- "C:/caminho/Realizado e Tendência"
```

O resultado é salvo em `pbi-inventory.json` dentro da pasta informada. O script não altera o projeto.
