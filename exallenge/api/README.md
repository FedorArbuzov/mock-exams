# Exallenge Go API — краткий учебный README
#
# Структура:
#   main.go      — старт HTTP-сервера, env
#   handlers.go  — маршруты и бизнес-логика запросов
#   db.go        — SQLite (modernc, без CGO)
#   models.go    — структуры JSON/БД
#
# Локальный запуск:
#   go run .
#   curl -X POST http://127.0.0.1:8080/api/visit -H "Content-Type: application/json" -d "{\"visitorId\":\"v1\",\"sessionId\":\"s1\",\"ref\":\"yt\",\"path\":\"/\"}"
#
# Сборка под Linux с Windows:
#   set GOOS=linux
#   set GOARCH=amd64
#   set CGO_ENABLED=0
#   go build -o exallenge-api .
#
# Эндпоинты:
#   GET  /api/health
#   POST /api/visit
#   POST /api/waitlist
#   GET  /api/stats   (Authorization: Bearer $STATS_TOKEN)
