# Segurança e acesso

## Princípios

1. Identidade corporativa como fonte de autenticação.
2. Autorização validada no servidor, nunca apenas escondendo componentes da tela.
3. Menor privilégio por função e escopo organizacional.
4. Segredos fora do repositório.
5. Dados pessoais minimizados e mascarados nas visões gerenciais.
6. Auditoria de alterações, aprovações e acessos sensíveis.

## Autenticação

A fundação oferece dois modos:

- `AUTH_MODE=mock`: somente desenvolvimento e homologação técnica.
- `AUTH_MODE=entra`: cabeçalhos de identidade validados pelo ambiente corporativo.

Antes de produção, a autenticação deverá ser integrada diretamente ao Microsoft Entra ID e endurecida de acordo com o ambiente escolhido.

## Autorização

Os perfis previstos são Diretoria, Diretor de área, Regional, Coordenador, Gerente, Controladoria, Financeiro, RH, Compras, Consulta e Serviço técnico.

Cada usuário recebe permissões funcionais e um ou mais escopos: grupo, empresa, regional, coordenação ou loja. O escopo descendente real será resolvido pela dimensão organizacional com vigência.

## Segredos

Não devem entrar no Git senhas, segredos de aplicativo, certificados, tokens do Power BI, links pré-autenticados, chaves de API, arquivos `.env`, credenciais de banco ou planilhas com dados pessoais desnecessários.

Use o cofre de segredos do ambiente e prefira certificado ou identidade gerenciada quando a infraestrutura permitir.

## Dados pessoais

- CPF e telefone não serão exibidos no painel executivo.
- Identificadores sensíveis devem ser armazenados de forma controlada e acessados somente por perfis autorizados.
- O dossiê da loja deve mostrar agregados por padrão.
- Exportações devem respeitar o mesmo escopo do usuário.
- Logs não devem registrar conteúdo de planilhas nem credenciais.

## Auditoria

A tabela `audit_event` registra mudanças críticas. Antes da produção, devem ser auditados no mínimo alteração de plano de ação, aprovação de fórmula, ativação de fonte, mudança de perfil, reprocessamento, reabertura de competência e exportação restrita.
