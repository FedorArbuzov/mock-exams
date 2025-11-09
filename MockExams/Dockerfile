# Этап сборки
FROM golang:1.23 AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
# Обновляем список зависимостей (подтянет client-go и др.)
RUN go mod tidy

# Сборка бинарника без символов отладки (уменьшает размер и защищает код)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o mockexams ./cmd/server

# Финальный минимальный образ
FROM scratch
COPY --from=builder /app/mockexams /mockexams

EXPOSE 8080
ENTRYPOINT ["/mockexams"]
