# Capstone: Typed Shop CLI + Task Tracker

See [33-capstone.md](../../33-capstone.md).

## Start

```bash
npm install
npm run typecheck
npm run start -- task add "Buy milk" --tags home
npm run start -- shop health   # requires deploy/fastapi :8090
```

## Structure (fill it in per the task)

- `src/schemas/` — Zod for Task and Item
- `src/domain/` — TaskStore, errors
- `src/api/` — shop-client
- `src/commands/` — task, shop
- `src/cli.ts` — router
