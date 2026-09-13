package lab

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type labctlPayload struct {
	OK       bool     `json:"ok"`
	Passed   bool     `json:"passed"`
	Error    string   `json:"error"`
	Note     string   `json:"note"`
	Score    *int     `json:"score"`
	MaxScore *int     `json:"maxScore"`
	Results  []Result `json:"results"`
}

func (d *Definition) isLabctl() bool {
	return strings.EqualFold(d.Backend, "labctl")
}

func (d *Definition) labctlID() string {
	if d.LabID != "" {
		return d.LabID
	}
	id := d.ID
	if i := strings.LastIndex(id, "/"); i >= 0 && i+1 < len(id) {
		return id[i+1:]
	}
	return id
}

func runLabctl(action, labID string) (labctlPayload, error) {
	var payload labctlPayload
	python, err := labctlPython()
	if err != nil {
		return payload, err
	}
	root, err := findRepoRoot()
	if err != nil {
		return payload, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	cmd := exec.CommandContext(ctx, python, "-m", "labctl", action, "--lab", labID, "--json")
	cmd.Dir = root
	cmd.Env = os.Environ()
	out, err := cmd.CombinedOutput()
	if err != nil {
		if payloadErr := json.Unmarshal(out, &payload); payloadErr == nil && payload.Error != "" {
			return payload, fmt.Errorf("%s", payload.Error)
		}
		msg := strings.TrimSpace(string(out))
		if msg == "" {
			msg = err.Error()
		}
		return payload, fmt.Errorf("labctl %s: %s", action, msg)
	}
	if err := json.Unmarshal(out, &payload); err != nil {
		return payload, fmt.Errorf("labctl %s: invalid json: %w\n%s", action, err, strings.TrimSpace(string(out)))
	}
	if !payload.OK && payload.Error != "" {
		return payload, fmt.Errorf("%s", payload.Error)
	}
	return payload, nil
}

func labctlPython() (string, error) {
	if p := os.Getenv("LABCTL_PYTHON"); p != "" {
		return p, nil
	}
	for _, name := range []string{"python3", "python"} {
		if path, err := exec.LookPath(name); err == nil {
			return path, nil
		}
	}
	return "", fmt.Errorf("python not found (install Python 3 and PyYAML, or set LABCTL_PYTHON)")
}

func findRepoRoot() (string, error) {
	if env := os.Getenv("LABCTL_ROOT"); env != "" {
		return env, nil
	}
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	dir := wd
	for {
		if info, err := os.Stat(filepath.Join(dir, "labctl", "__init__.py")); err == nil && !info.IsDir() {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", fmt.Errorf("cannot find repository root (no labctl/__init__.py). Run mockctl web from the mock-exams repo")
		}
		dir = parent
	}
}
