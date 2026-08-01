package main

// main.go — точка входа.
//
// package main + func main() = исполняемая программа.
// Собираем так (с Windows на Linux VPS):
//   set GOOS=linux
//   set GOARCH=amd64
//   go build -o exallenge-api .
//
// Переменные окружения:
//   ADDR        — куда слушать (по умолчанию :8080)
//   DB_PATH     — путь к sqlite файлу
//   STATS_TOKEN — секрет для GET /api/stats (Authorization: Bearer ...)

import (
	"log"
	"net/http"
	"os"
	"time"
)

func main() {
	addr := envOr("ADDR", ":8080")
	dbPath := envOr("DB_PATH", "./data/exallenge.db")
	statsToken := os.Getenv("STATS_TOKEN")
	if statsToken == "" {
		log.Println("warning: STATS_TOKEN is empty — /api/stats will always return 401")
	}

	store, err := openStore(dbPath)
	if err != nil {
		log.Fatalf("store: %v", err)
	}
	defer store.Close()

	srv := &Server{store: store, statsToken: statsToken}

	httpServer := &http.Server{
		Addr:              addr,
		Handler:           srv.routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("exallenge api listening on %s (db=%s)", addr, dbPath)
	if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("listen: %v", err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
