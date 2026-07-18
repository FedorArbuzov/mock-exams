# Lab 24: strict mode

Полумигрированный Task Tracker. Задание: включить `"strict": true` и `noUncheckedIndexedAccess`, исправить все ошибки `tsc`.

## Команды

```bash
npm install
npm run check    # до strict: 0 ошибок
# включите strict в tsconfig.json
npm run check    # исправьте до 0
npm run build
node dist/cli.js add "Buy milk" --tags home
node dist/cli.js list
```

Запишите в этот README количество ошибок до/после включения strict.
