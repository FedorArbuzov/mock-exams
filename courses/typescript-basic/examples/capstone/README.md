# Capstone: Typed Shop CLI + Task Tracker

См. [33-capstone.md](../../33-capstone.md).

## Старт

```bash
npm install
npm run typecheck
npm run start -- task add "Buy milk" --tags home
npm run start -- shop health   # нужен deploy/fastapi :8090
```

## Структура (заполните по заданию)

- `src/schemas/` — Zod для Task и Item
- `src/domain/` — TaskStore, errors
- `src/api/` — shop-client
- `src/commands/` — task, shop
- `src/cli.ts` — router
