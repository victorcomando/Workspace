# Workspace

Plataforma para gestão pessoal de rotina de trabalho, calendário, notas e fechamento salarial mensal.

## Stack

- Monorepo com `pnpm` + `turbo`
- `apps/api`: NestJS + Prisma
- `apps/web`: React + Vite + CoreUI

## Funcionalidades

- Cadastro e login de usuários
- Sessão única por usuário (novo login invalida sessão anterior)
- Calendário com registro e edição de dias trabalhados
- Configuração de salário por local e tipo (`fixo` ou `diária`)
- Resumo salarial mensal
- Bloco de notas por usuário

## Preview

### Login

![Login](https://i.imgur.com/wXpywM1.png)

### Sessão invalidada

![Sessão invalidada](https://i.imgur.com/QGBf7xm.png)

### Dashboard (tema escuro)

![Dashboard escuro](https://i.imgur.com/thBAPlK.png)

### Calendário

![Calendário](https://i.imgur.com/B4wq4hM.png)

### Bloco de notas

![Bloco de notas](https://i.imgur.com/2JzVi6c.png)

### Mobile

![Dashboard mobile](https://i.imgur.com/UNVS1he.png)

## Estrutura

```text
apps/
  api/   # backend e regras de negócio
  web/   # frontend
packages/
  ...    # pacotes compartilhados do monorepo
```

## Pré-requisitos

- Node.js 20+
- pnpm 8+

## Instalação

```bash
pnpm install
```

## Execução em desenvolvimento

```bash
pnpm --filter api start:dev
pnpm --filter web dev
```

- API: `http://localhost:5000`
- Web: `http://localhost:5001`

## Execução (build/produção)

```bash
pnpm install
pnpm start
```

Observação: em release oficial, o artefato já inclui `dist` da API e Web.

## Variáveis de ambiente

- API: configure `DATABASE_URL` em `apps/api/.env`
- Exemplo com SQLite:

```env
DATABASE_URL="file:./prisma/dev.db"
```

Mais detalhes de banco e provider no README da API: `apps/api/README.md`.

## Qualidade e validação

```bash
pnpm lint
pnpm build
pnpm --filter api test
```

## Scripts úteis

```bash
pnpm dev       # roda tarefas de desenvolvimento do monorepo
pnpm lint      # lint em todos os projetos
pnpm build     # build em todos os projetos
pnpm format    # formata arquivos ts/tsx/md
```

## Status

Base funcional estável para uso real e evolução contínua.
