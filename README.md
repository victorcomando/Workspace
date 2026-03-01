# Workspace

Aplicação web para gestão pessoal de rotina de trabalho, calendário, notas e fechamento salarial mensal.

## Visão Geral

O projeto nasceu para uso pessoal e evoluiu para um case de portfólio com foco em:

- organização de dias trabalhados;
- controle de observações por dia;
- configuração de salário por local de trabalho;
- resumo mensal com separação entre ganhos fixos e diários.

## Funcionalidades

- Autenticação com registro e login.
- Sessão única por usuário (novo login invalida sessão anterior).
- Calendário com cadastro e edição de trabalhos por dia.
- Relatórios salariais mensais.
- Configuração de salário por local e tipo (`fixo` ou `diária`).
- Bloco de notas integrado ao mesmo usuário.

## Experiência do Usuário

- Interface responsiva para celular, tablet e desktop.
- Navegação protegida por autenticação.
- Redirecionamento automático para login quando a sessão expira.
- Aviso em modal quando a sessão é invalidada por outro dispositivo.

## Estrutura do Projeto

- `apps/web`: frontend da aplicação.
- `apps/api`: backend e regras de negócio.
- `packages/*`: pacotes compartilhados do monorepo.

## Como Executar

```bash
pnpm install
pnpm --filter api start:dev
pnpm --filter web dev
```

Frontend padrão: `http://localhost:5001`  
API padrão: `http://localhost:5000`

## Qualidade

Comandos usados para validação local:

```bash
pnpm --filter api lint
pnpm --filter api build
pnpm --filter web lint
pnpm --filter web build
```

## Banco de Dados

- Configuração via `DATABASE_URL` no `apps/api/.env`.
- Instruções de troca de provider no `README` da API.

## Status

Projeto em evolução contínua, com base funcional estável para uso real e preparação para publicação como portfólio.
