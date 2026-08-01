# Lab 27: Zod + FastAPI :8090

```bash
# from the repository root
cd deploy/fastapi && docker compose up -d --build
curl http://localhost:8090/health
curl http://localhost:8090/api/v1/items

cd courses/typescript-basic/examples/lab-zod
npm install
npm run demo
npm run fixtures
```

Verify the schemas against the actual bench JSON (`title`, not `name` — see deploy/fastapi).
