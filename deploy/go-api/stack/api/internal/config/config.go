package config

import (
	"log/slog"
	"os"
	"strings"
)

type Config struct {
	HTTPAddr    string
	DatabaseURL string
	JWTSecret   string
	LogLevel    slog.Level
}

func Load() Config {
	level := slog.LevelInfo
	switch strings.ToLower(os.Getenv("LOG_LEVEL")) {
	case "debug":
		level = slog.LevelDebug
	case "warn":
		level = slog.LevelWarn
	case "error":
		level = slog.LevelError
	}

	addr := os.Getenv("HTTP_ADDR")
	if addr == "" {
		addr = ":8080"
	}
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://course:course@localhost:5432/course?sslmode=disable"
	}
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret"
	}

	return Config{
		HTTPAddr:    addr,
		DatabaseURL: dbURL,
		JWTSecret:   secret,
		LogLevel:    level,
	}
}
