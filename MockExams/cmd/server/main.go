package main

import (
	"fmt"
	"log"
	"net/http"

	"mockexams/internal/api"
)

func main() {
	mux := http.NewServeMux()

	// Пример эндпоинта /ping
	mux.HandleFunc("/ping", api.PingHandler)
	// Пример эндпоинта /exam
	mux.HandleFunc("/exam", api.ExamHandler)
	// Список сценариев
	mux.HandleFunc("/scenarios", api.ScenariosHandler)
	// Управление сценарием (start/check/reset)
	mux.HandleFunc("/scenarios/", api.ScenarioActionHandler)

	fmt.Println("🚀 MockExams backend started on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
