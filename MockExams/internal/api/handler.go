package api

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"fmt"

	"mockexams/internal/scenario"
)

type response struct {
	Message string `json:"message"`
}

type listResponse struct {
	Scenarios []scenario.ScenarioMeta `json:"scenarios"`
}

type checkResponse struct {
	Passed  bool                     `json:"passed"`
	Results []scenario.CheckResult   `json:"results"`
	Message string                   `json:"message,omitempty"`
}

var scenarioManager = scenario.NewManager()

func PingHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, response{Message: "pong"})
}

func ExamHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, response{Message: "Welcome to MockExams API!!!!"})
}

// ScenariosHandler returns the list of available exercises.
func ScenariosHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	items := scenarioManager.List()
	writeJSON(w, http.StatusOK, listResponse{Scenarios: items})
}

// ScenarioActionHandler handles scenario lifecycle operations (start, check, reset).
func ScenarioActionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	fmt.Println("ScenarioActionHandler")
	fmt.Println(r.URL.Path)

	path := strings.TrimPrefix(r.URL.Path, "/scenarios/")
	parts := strings.Split(path, "/")
	if len(parts) != 2 {
		writeError(w, http.StatusBadRequest, "invalid scenario path")
		return
	}

	id := parts[0]
	action := parts[1]
	ctx := r.Context()

	switch action {
	case "start":
		handleScenarioStart(ctx, w, id)
	case "check":
		handleScenarioCheck(ctx, w, id)
	case "reset":
		handleScenarioReset(ctx, w, id)
	default:
		writeError(w, http.StatusNotFound, "unknown scenario action")
	}
}

func handleScenarioStart(ctx context.Context, w http.ResponseWriter, id string) {
	if err := scenarioManager.Start(ctx, id); err != nil {
		handleScenarioError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "scenario started"})
}

func handleScenarioCheck(ctx context.Context, w http.ResponseWriter, id string) {
	results, err := scenarioManager.Check(ctx, id)
	if err != nil {
		handleScenarioError(w, err)
		return
	}

	passed := true
	for _, res := range results {
		if !res.Passed {
			passed = false
			break
		}
	}

	writeJSON(w, http.StatusOK, checkResponse{
		Passed:  passed,
		Results: results,
	})
}

func handleScenarioReset(ctx context.Context, w http.ResponseWriter, id string) {
	if err := scenarioManager.Reset(ctx, id); err != nil {
		handleScenarioError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "scenario reset"})
}

func handleScenarioError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, scenario.ErrScenarioNotFound):
		writeError(w, http.StatusNotFound, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, err.Error())
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, response{Message: message})
}
