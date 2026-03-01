# Web - Workspace

Frontend da aplicação Workspace, responsável pela experiência do usuário e fluxo de navegação.

## O que o usuário faz nesta interface

- Entrar ou registrar conta.
- Navegar entre dashboard, calendário, relatórios, notas e configurações.
- Registrar trabalhos por data no calendário.
- Configurar regras de salário por local de trabalho.
- Acompanhar resumo salarial mensal.

## Características da Interface

- Layout responsivo para celular, tablet e desktop.
- Rotas protegidas por autenticação.
- Redirecionamento automático para login quando necessário.
- Aviso visual quando a sessão é invalidada por login em outro dispositivo.

## Execução

```bash
pnpm install
pnpm --filter web dev
```

Aplicação padrão: `http://localhost:5001`

## Validação

```bash
pnpm --filter web lint
pnpm --filter web build
```
