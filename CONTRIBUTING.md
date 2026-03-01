# Contribuindo

## Fluxo recomendado

1. Crie uma branch de trabalho a partir de `main`.
2. Faça mudanças pequenas e coesas.
3. Rode validações antes de concluir.
4. Use mensagens de commit no padrão Conventional Commits.

## Validações mínimas

```bash
pnpm lint
pnpm build
pnpm --filter api test
```

## Padrão de commits

Exemplos:

- `feat(api): add monthly report endpoint`
- `fix(web): prevent invalid date submission`
- `refactor(api): simplify salary calculation service`
- `docs: update setup instructions`

## Boas práticas

- Evite commits com mudanças não relacionadas.
- Mantenha os READMEs atualizados quando alterar comportamento.
- Prefira nomes descritivos para branches e commits.
