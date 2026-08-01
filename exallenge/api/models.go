package main

// models.go — структуры данных.
//
// В Go нет классов. Данные описывают через struct (структуру),
// а поведение — через функции (иногда с receiver: методами).
// Теги `json:"..."` говорят encoding/json, как маппить поля в JSON.

// VisitIn — то, что присылает браузер в POST /api/visit.
// Поля с маленькой буквы в JSON (visitorId), в Go — с большой (VisitorID),
// потому что экспортируемые (публичные) идентификаторы начинаются с заглавной.
type VisitIn struct {
	VisitorID  string `json:"visitorId"`
	SessionID  string `json:"sessionId"`
	Ref        string `json:"ref"`
	Path       string `json:"path"`
	Landing    string `json:"landing"`
	Referrer   string `json:"referrer"`
	Language   string `json:"language"`
	Timezone   string `json:"timezone"`
	Screen     string `json:"screen"`
}

// WaitlistIn — тело POST /api/waitlist.
type WaitlistIn struct {
	Email      string `json:"email"`
	VisitorID  string `json:"visitorId"`
	SessionID  string `json:"sessionId"`
	Ref        string `json:"ref"`
	Placement  string `json:"placement"` // раньше называли source: hero / founder / ...
	Landing    string `json:"landing"`
	Referrer   string `json:"referrer"`
	Language   string `json:"language"`
	Timezone   string `json:"timezone"`
	Screen     string `json:"screen"`
}

// VisitRow / WaitlistRow — то, что лежит в БД (плюс серверные поля).
type VisitRow struct {
	ID        int64  `json:"id"`
	VisitorID string `json:"visitorId"`
	SessionID string `json:"sessionId"`
	Ref       string `json:"ref"`
	Path      string `json:"path"`
	Landing   string `json:"landing"`
	Referrer  string `json:"referrer"`
	Language  string `json:"language"`
	Timezone  string `json:"timezone"`
	Screen    string `json:"screen"`
	IP        string `json:"ip"`
	UserAgent string `json:"userAgent"`
	CreatedAt string `json:"createdAt"`
}

type WaitlistRow struct {
	ID        int64  `json:"id"`
	Email     string `json:"email"`
	VisitorID string `json:"visitorId"`
	SessionID string `json:"sessionId"`
	Ref       string `json:"ref"`
	Placement string `json:"placement"`
	Landing   string `json:"landing"`
	Referrer  string `json:"referrer"`
	Language  string `json:"language"`
	Timezone  string `json:"timezone"`
	Screen    string `json:"screen"`
	IP        string `json:"ip"`
	UserAgent string `json:"userAgent"`
	CreatedAt string `json:"createdAt"`
}

// Stats — сводка для GET /api/stats.
type Stats struct {
	VisitsTotal     int64            `json:"visitsTotal"`
	VisitorsUnique  int64            `json:"visitorsUnique"`
	WaitlistTotal   int64            `json:"waitlistTotal"`
	VisitsByRef     map[string]int64 `json:"visitsByRef"`
	WaitlistByRef   map[string]int64 `json:"waitlistByRef"`
}
