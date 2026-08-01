package main

// db.go — работа с SQLite.
//
// database/sql — стандартный интерфейс к SQL в Go.
// Драйвер modernc.org/sqlite — чистый Go (без CGO), поэтому
// можно собрать linux-бинарник на Windows одной командой.

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite" // blank import: регистрирует драйвер "sqlite"
)

// Store держит открытое соединение с БД.
// В Go принято передавать зависимости явно (struct), а не через глобалы.
type Store struct {
	db *sql.DB
}

func openStore(dbPath string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, fmt.Errorf("mkdir data dir: %w", err)
	}

	// ?_pragma=busy_timeout помогает при редких параллельных записях.
	db, err := sql.Open("sqlite", dbPath+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)")
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	// Проверяем, что файл реально открылся (Open ленивый).
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}

	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		_ = db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

// migrate создаёт таблицы, если их ещё нет.
// Для учебного MVP достаточно одной функции; позже появятся версии миграций.
func (s *Store) migrate() error {
	const schema = `
CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  ref        TEXT NOT NULL DEFAULT '',
  path       TEXT NOT NULL DEFAULT '/',
  landing    TEXT NOT NULL DEFAULT '',
  referrer   TEXT NOT NULL DEFAULT '',
  language   TEXT NOT NULL DEFAULT '',
  timezone   TEXT NOT NULL DEFAULT '',
  screen     TEXT NOT NULL DEFAULT '',
  ip         TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visits_ref ON visits(ref);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at);

CREATE TABLE IF NOT EXISTS waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL UNIQUE,
  visitor_id TEXT NOT NULL DEFAULT '',
  session_id TEXT NOT NULL DEFAULT '',
  ref        TEXT NOT NULL DEFAULT '',
  placement  TEXT NOT NULL DEFAULT '',
  landing    TEXT NOT NULL DEFAULT '',
  referrer   TEXT NOT NULL DEFAULT '',
  language   TEXT NOT NULL DEFAULT '',
  timezone   TEXT NOT NULL DEFAULT '',
  screen     TEXT NOT NULL DEFAULT '',
  ip         TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_waitlist_ref ON waitlist(ref);
`
	_, err := s.db.Exec(schema)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
}

func (s *Store) insertVisit(v VisitRow) error {
	_, err := s.db.Exec(`
INSERT INTO visits (
  visitor_id, session_id, ref, path, landing, referrer,
  language, timezone, screen, ip, user_agent, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		v.VisitorID, v.SessionID, v.Ref, v.Path, v.Landing, v.Referrer,
		v.Language, v.Timezone, v.Screen, v.IP, v.UserAgent, v.CreatedAt,
	)
	return err
}

// insertWaitlist возвращает (created=true), если email новый.
// При конфликте UNIQUE просто считаем успехом (идемпотентность формы).
func (s *Store) insertWaitlist(w WaitlistRow) (bool, error) {
	res, err := s.db.Exec(`
INSERT OR IGNORE INTO waitlist (
  email, visitor_id, session_id, ref, placement, landing, referrer,
  language, timezone, screen, ip, user_agent, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		w.Email, w.VisitorID, w.SessionID, w.Ref, w.Placement, w.Landing, w.Referrer,
		w.Language, w.Timezone, w.Screen, w.IP, w.UserAgent, w.CreatedAt,
	)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

func (s *Store) stats() (Stats, error) {
	out := Stats{
		VisitsByRef:   map[string]int64{},
		WaitlistByRef: map[string]int64{},
	}

	if err := s.db.QueryRow(`SELECT COUNT(*) FROM visits`).Scan(&out.VisitsTotal); err != nil {
		return out, err
	}
	if err := s.db.QueryRow(`SELECT COUNT(DISTINCT visitor_id) FROM visits`).Scan(&out.VisitorsUnique); err != nil {
		return out, err
	}
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM waitlist`).Scan(&out.WaitlistTotal); err != nil {
		return out, err
	}

	if err := scanCounts(s.db, `SELECT COALESCE(NULLIF(ref,''), 'direct') AS r, COUNT(*) FROM visits GROUP BY r`, out.VisitsByRef); err != nil {
		return out, err
	}
	if err := scanCounts(s.db, `SELECT COALESCE(NULLIF(ref,''), 'direct') AS r, COUNT(*) FROM waitlist GROUP BY r`, out.WaitlistByRef); err != nil {
		return out, err
	}
	return out, nil
}

func scanCounts(db *sql.DB, query string, dest map[string]int64) error {
	rows, err := db.Query(query)
	if err != nil {
		return err
	}
	defer rows.Close() // закрыть курсор обязательно (иначе утечка соединений)

	for rows.Next() {
		var key string
		var n int64
		if err := rows.Scan(&key, &n); err != nil {
			return err
		}
		dest[key] = n
	}
	return rows.Err()
}

func nowUTC() string {
	return time.Now().UTC().Format(time.RFC3339)
}

func clip(s string, max int) string {
	s = strings.TrimSpace(s)
	if len(s) <= max {
		return s
	}
	return s[:max]
}
