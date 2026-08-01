// Package localstack starts and stops the shared LocalStack compose stack
// used by aws-terraform labs. It does not touch the minikube cluster.
package localstack

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"mockctl/internal/dockerutil"
	"mockctl/internal/procutil"
)

const (
	// Endpoint is the LocalStack edge port on the host.
	Endpoint = "http://localhost:4566"
	healthURL = Endpoint + "/_localstack/health"
)

// Up starts LocalStack via deploy/localstack/docker-compose.yml and waits
// until the health endpoint responds.
func Up() error {
	if err := dockerutil.RequireDocker(); err != nil {
		return err
	}
	compose, err := findComposePath()
	if err != nil {
		return err
	}

	fmt.Println("LocalStack compose:", compose)
	if err := dockerCompose(compose, "up", "-d"); err != nil {
		return fmt.Errorf("docker compose up: %w", err)
	}

	fmt.Println("Waiting for LocalStack health on", Endpoint, "...")
	if err := WaitReady(2 * time.Minute); err != nil {
		return err
	}
	PrintSummary()
	return nil
}

// Down stops LocalStack containers (volumes preserved).
func Down() error {
	compose, err := findComposePath()
	if err != nil {
		return err
	}
	if err := dockerCompose(compose, "down"); err != nil {
		return fmt.Errorf("docker compose down: %w", err)
	}
	fmt.Println("Stopped LocalStack (volumes kept).")
	fmt.Println("Wipe data: docker compose -f", compose, "down -v")
	return nil
}

// Status prints whether LocalStack is reachable.
func Status() error {
	PrintStatus()
	return nil
}

// WaitReady polls the health endpoint until success or timeout.
func WaitReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	client := &http.Client{Timeout: 3 * time.Second}
	var last string
	for time.Now().Before(deadline) {
		ok, detail := healthOK(client)
		if ok {
			fmt.Println("LocalStack is healthy.")
			return nil
		}
		last = detail
		fmt.Printf("  LocalStack starting... (%s)\n", trimOneLine(last))
		time.Sleep(3 * time.Second)
	}
	return fmt.Errorf("LocalStack not ready after %v — last: %s\nCheck: curl -s %s", timeout, last, healthURL)
}

func healthOK(client *http.Client) (bool, string) {
	resp, err := client.Get(healthURL)
	if err != nil {
		return false, err.Error()
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Sprintf("HTTP %d", resp.StatusCode)
	}
	// Prefer JSON with service map; any 200 with body is enough to proceed.
	var payload map[string]any
	if err := json.Unmarshal(body, &payload); err != nil {
		return true, "ok"
	}
	if services, ok := payload["services"].(map[string]any); ok && len(services) > 0 {
		return true, fmt.Sprintf("%d services", len(services))
	}
	return true, "ok"
}

// PrintSummary prints endpoint hints after a successful up.
func PrintSummary() {
	fmt.Println()
	fmt.Println("LocalStack ready:", Endpoint)
	fmt.Println("Health:          ", healthURL)
	fmt.Println("Terraform:        tflocal init && tflocal apply   (pip install terraform-local)")
	fmt.Println("AWS CLI:          aws --endpoint-url="+Endpoint+" s3 ls")
	fmt.Println("Course:           courses-en/aws-terraform")
	fmt.Println("Stop:             mockctl localstack down")
}

// PrintStatus is safe to call from cluster.Status; never fails the caller.
func PrintStatus() {
	client := &http.Client{Timeout: 2 * time.Second}
	ok, detail := healthOK(client)
	fmt.Println()
	if ok {
		fmt.Println("LocalStack:", Endpoint, "(healthy,", detail+")")
		fmt.Println("Stop with: mockctl localstack down")
		return
	}
	fmt.Println("LocalStack: not running (start with: mockctl localstack up)")
	if detail != "" {
		fmt.Println("  last check:", trimOneLine(detail))
	}
}

func findComposePath() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	dir := wd
	for i := 0; i < 10; i++ {
		p := filepath.Join(dir, "deploy", "localstack", "docker-compose.yml")
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("deploy/localstack/docker-compose.yml not found — run mockctl from the mock-exams repository")
}

func dockerCompose(composeFile string, args ...string) error {
	if _, err := exec.LookPath("docker"); err != nil {
		return fmt.Errorf("docker not in PATH")
	}
	dcArgs := append([]string{"compose", "-f", composeFile}, args...)
	if err := procutil.RunStream("docker", dcArgs...); err == nil {
		return nil
	}
	legacy := append([]string{"-f", composeFile}, args...)
	return procutil.RunStream("docker-compose", legacy...)
}

func trimOneLine(s string) string {
	s = strings.TrimSpace(s)
	if idx := strings.IndexByte(s, '\n'); idx >= 0 {
		s = s[:idx]
	}
	if len(s) > 80 {
		return s[:77] + "..."
	}
	return s
}
