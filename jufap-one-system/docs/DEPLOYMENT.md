# Ambientes e implantação

## Ambientes

| Ambiente | Finalidade | Dados |
|---|---|---|
| Desenvolvimento | Construção e testes locais | Simulados ou amostras anonimizadas |
| Homologação | Reconciliação e aceite da JUFAP | Cópia controlada das fontes oficiais |
| Produção | Uso corporativo | Fontes oficiais e segurança completa |

## Componentes implantáveis

- `apps/web`: interface Next.js.
- `apps/api`: API Fastify.
- `workers/ingestion`: carga incremental.
- `workers/metrics`: registro e reconciliação.
- `workers/notifications`: JUFAP Brief.
- PostgreSQL gerenciado.
- Redis ou serviço de fila equivalente quando os jobs recorrentes forem ativados.

## Verificações de saúde

- `/health/live`: processo está em execução.
- `/health/ready`: dependências essenciais estão disponíveis.

## Promoção

1. Merge aprovado na branch principal.
2. Build imutável.
3. Migrações em homologação.
4. Testes de contrato e reconciliação.
5. Aceite funcional.
6. Backup e plano de retorno.
7. Migração em produção.
8. Implantação gradual.
9. Validação pós-publicação.

## Variáveis

Cada ambiente deve possuir configuração própria. `DATA_MODE=mock`, `AUTH_MODE=mock` e integrações desabilitadas nunca devem ser usados como configuração final de produção.

## Observabilidade mínima

- logs estruturados com `requestId`;
- duração e status das cargas;
- erros por fonte;
- quantidade de linhas processadas;
- atraso de atualização;
- divergências de reconciliação;
- disponibilidade da API;
- tempo de resposta da página;
- falhas de envio do JUFAP Brief.

A escolha final do serviço de hospedagem será feita com a JUFAP antes da implantação. Esta entrega não publica nem altera o ambiente produtivo atual.
