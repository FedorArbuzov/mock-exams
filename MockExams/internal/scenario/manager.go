package scenario

import (
	"context"
	"errors"
	"sync"
)

// CheckResult describes the outcome of a single validation step.
type CheckResult struct {
	Name    string `json:"name"`
	Passed  bool   `json:"passed"`
	Message string `json:"message"`
}

// Scenario describes the contract every exam scenario must fulfil.
type Scenario struct {
	ID          string
	Title       string
	Description string
	SetupFunc   func(ctx context.Context) error
	CheckFunc   func(ctx context.Context) ([]CheckResult, error)
	ResetFunc   func(ctx context.Context) error
}

// ScenarioMeta contains public metadata exposed over the API.
type ScenarioMeta struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

// Manager keeps track of registered scenarios and provides helpers
// for orchestration via the API layer.
type Manager struct {
	mu        sync.RWMutex
	scenarios map[string]*Scenario
}

// ErrScenarioNotFound indicates that a requested scenario is absent in the registry.
var ErrScenarioNotFound = errors.New("scenario not found")

// NewManager constructs a manager with built-in scenarios.
func NewManager() *Manager {
	m := &Manager{
		scenarios: make(map[string]*Scenario),
	}
	registerDefaultScenarios(m)
	return m
}

// Register adds a scenario to the manager registry.
func (m *Manager) Register(s *Scenario) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.scenarios[s.ID] = s
}

// List returns available scenario metadata.
func (m *Manager) List() []ScenarioMeta {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]ScenarioMeta, 0, len(m.scenarios))
	for _, s := range m.scenarios {
		result = append(result, ScenarioMeta{
			ID:          s.ID,
			Title:       s.Title,
			Description: s.Description,
		})
	}
	return result
}

// Start runs the setup step for a scenario.
func (m *Manager) Start(ctx context.Context, id string) error {
	s, err := m.getScenario(id)
	if err != nil {
		return err
	}
	if s.SetupFunc == nil {
		return nil
	}
	return s.SetupFunc(ctx)
}

// Check runs the validation step and returns all check results.
func (m *Manager) Check(ctx context.Context, id string) ([]CheckResult, error) {
	s, err := m.getScenario(id)
	if err != nil {
		return nil, err
	}
	if s.CheckFunc == nil {
		return []CheckResult{}, nil
	}
	return s.CheckFunc(ctx)
}

// Reset reverts any changes introduced for the scenario.
func (m *Manager) Reset(ctx context.Context, id string) error {
	s, err := m.getScenario(id)
	if err != nil {
		return err
	}
	if s.ResetFunc == nil {
		return nil
	}
	return s.ResetFunc(ctx)
}

func (m *Manager) getScenario(id string) (*Scenario, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	s, ok := m.scenarios[id]
	if !ok {
		return nil, ErrScenarioNotFound
	}
	return s, nil
}

