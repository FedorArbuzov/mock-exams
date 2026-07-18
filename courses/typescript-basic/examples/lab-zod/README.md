# Lab 27: Zod + FastAPI :8090

```bash
# из корня репозитория
cd deploy/fastapi && docker compose up -d --build
curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items

cd courses/typescript-basic/examples/lab-zod
npm install
npm run demo
npm run fixtures
```

Сверьте схемы с фактическим JSON стенда (`title`, не `name` — см. deploy/fastapi).
