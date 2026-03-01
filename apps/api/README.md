# API - Workspace

Backend responsável por autenticação, regras de negócio e persistência dos dados do Workspace.

## Responsabilidades

- Registro e login de usuários.
- Controle de sessão única por usuário.
- Gestão de workdays (calendário de trabalho).
- Gestão de notas por usuário.
- Configuração e resumo salarial mensal.

## Regras Importantes

- Todas as rotas de negócio são protegidas por autenticação.
- O usuário só acessa os próprios dados.
- Novo login invalida sessões anteriores.

## Execução

```bash
pnpm install
pnpm --filter api start:dev
```

API padrão: `http://localhost:5000`

## Validação

```bash
pnpm --filter api lint
pnpm --filter api build
pnpm --filter api test
```

## Banco de Dados

- Banco SQLite via Prisma.
- Configuração principal por variável `DATABASE_URL`.

### Trocar para MySQL ou MariaDB

1. Ajuste o provider no Prisma em `apps/api/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Observação: para MariaDB no Prisma, o provider também é `mysql`.

2. Atualize a conexão no `apps/api/.env`:

```env
DATABASE_URL="mysql://usuario:senha@host:3306/workspace_db"
```

3. Regerar cliente e sincronizar schema:

```bash
pnpm --filter api prisma generate
pnpm --filter api prisma db push
```

4. Reinicie a API:

```bash
pnpm --filter api start:dev
```
