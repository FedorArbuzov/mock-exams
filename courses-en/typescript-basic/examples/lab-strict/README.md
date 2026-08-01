# Lab 24: strict mode

A half-migrated Task Tracker. Task: enable `"strict": true` and `noUncheckedIndexedAccess`, and fix all `tsc` errors.

## Commands

```bash
npm install
npm run check    # before strict: 0 errors
# enable strict in tsconfig.json
npm run check    # fix down to 0
npm run build
node dist/cli.js add "Buy milk" --tags home
node dist/cli.js list
```

Record in this README the number of errors before/after enabling strict.
