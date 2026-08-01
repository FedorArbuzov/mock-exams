package main

// handlers.go — HTTP-обработчики.
//
// Сигнатура http.HandlerFunc:
//   func(w http.ResponseWriter, r *http.Request)
// w — куда пишем ответ, r — входящий запрос.
// Server держит Store и токен для /api/stats.

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"net/mail"
	"strings"
)

type Server struct {
	store      *Store
	statsToken string
}

func (s *Server) routes() http.Handler {
	mux := http.NewServeMux()
	// В Go 1.22+ можно писать "METHOD /path"
	mux.HandleFunc("GET /api/health", s.handleHealth)
	mux.HandleFunc("POST /api/visit", s.handleVisit)
	mux.HandleFunc("POST /api/waitlist", s.handleWaitlist)
	mux.HandleFunc("GET /api/stats", s.handleStats)

	// Обёртки: CORS (браузер с того же домена и так ок, но полезно для отладки)
	// + лимит размера тела + логирование.
	return withCORS(withMaxBody(1<<20, mux)) // 1 MiB
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"ok": "true"})
}

func (s *Server) handleVisit(w http.ResponseWriter, r *http.Request) {
	var in VisitIn
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeErr(w, http.StatusBadRequest, "Invalid JSON body.")
		return
	}

	visitorID := clip(in.VisitorID, 64)
	sessionID := clip(in.SessionID, 64)
	if visitorID == "" || sessionID == "" {
		writeErr(w, http.StatusBadRequest, "visitorId and sessionId are required.")
		return
	}

	row := VisitRow{
		VisitorID: visitorID,
		SessionID: sessionID,
		Ref:       normalizeRef(in.Ref),
		Path:      clip(in.Path, 256),
		Landing:   clip(in.Landing, 512),
		Referrer:  clip(in.Referrer, 512),
		Language:  clip(in.Language, 64),
		Timezone:  clip(in.Timezone, 64),
		Screen:    clip(in.Screen, 32),
		IP:        clientIP(r),
		UserAgent: clip(r.UserAgent(), 512),
		CreatedAt: nowUTC(),
	}
	if row.Path == "" {
		row.Path = "/"
	}

	if err := s.store.insertVisit(row); err != nil {
		log.Printf("insert visit: %v", err)
		writeErr(w, http.StatusInternalServerError, "Could not save visit.")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true})
}

func (s *Server) handleWaitlist(w http.ResponseWriter, r *http.Request) {
	var in WaitlistIn
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeErr(w, http.StatusBadRequest, "Invalid JSON body.")
		return
	}

	email, ok := normalizeEmail(in.Email)
	if !ok {
		writeErr(w, http.StatusBadRequest, "Enter a valid email address.")
		return
	}

	row := WaitlistRow{
		Email:     email,
		VisitorID: clip(in.VisitorID, 64),
		SessionID: clip(in.SessionID, 64),
		Ref:       normalizeRef(in.Ref),
		Placement: clip(in.Placement, 64),
		Landing:   clip(in.Landing, 512),
		Referrer:  clip(in.Referrer, 512),
		Language:  clip(in.Language, 64),
		Timezone:  clip(in.Timezone, 64),
		Screen:    clip(in.Screen, 32),
		IP:        clientIP(r),
		UserAgent: clip(r.UserAgent(), 512),
		CreatedAt: nowUTC(),
	}
	if row.Placement == "" {
		row.Placement = "unknown"
	}

	_, err := s.store.insertWaitlist(row)
	if err != nil {
		log.Printf("insert waitlist: %v", err)
		writeErr(w, http.StatusInternalServerError, "Could not save email.")
		return
	}

	// Даже если email уже был — отвечаем успехом (не палим факт дубля).
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"message": "Thanks — check your inbox. We'll send access instructions soon.",
	})
}

func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	auth := r.Header.Get("Authorization")
	want := "Bearer " + s.statsToken
	if s.statsToken == "" || auth != want {
		writeErr(w, http.StatusUnauthorized, "Unauthorized.")
		return
	}
	st, err := s.store.stats()
	if err != nil {
		log.Printf("stats: %v", err)
		writeErr(w, http.StatusInternalServerError, "Could not load stats.")
		return
	}
	writeJSON(w, http.StatusOK, st)
}

func normalizeEmail(raw string) (string, bool) {
	raw = strings.TrimSpace(strings.ToLower(raw))
	if raw == "" || len(raw) > 254 {
		return "", false
	}
	addr, err := mail.ParseAddress(raw)
	if err != nil {
		return "", false
	}
	// ParseAddress допускает "Name <email>"; нам нужен только адрес.
	if strings.ContainsAny(addr.Address, " \t") {
		return "", false
	}
	return addr.Address, true
}

func normalizeRef(raw string) string {
	raw = strings.ToLower(clip(raw, 32))
	// Разрешаем короткий алфавит: yt, ig, direct, ...
	var b strings.Builder
	for _, r := range raw {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// clientIP берёт IP с учётом nginx (X-Real-IP / X-Forwarded-For).
func clientIP(r *http.Request) string {
	if x := strings.TrimSpace(r.Header.Get("X-Real-IP")); x != "" {
		return clip(x, 64)
	}
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Берём первый IP в цепочке: client, proxy1, proxy2
		parts := strings.Split(xff, ",")
		return clip(strings.TrimSpace(parts[0]), 64)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return clip(r.RemoteAddr, 64)
	}
	return host
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		// Разрешаем свой домен и локальную отладку.
		switch origin {
		case "https://exallenge.tech", "https://www.exallenge.tech",
			"http://localhost:3000", "http://127.0.0.1:3000":
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func withMaxBody(n int64, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.Body = http.MaxBytesReader(w, r.Body, n)
		next.ServeHTTP(w, r)
	})
}
