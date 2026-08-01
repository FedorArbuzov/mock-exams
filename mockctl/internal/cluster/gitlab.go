package cluster

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"mockctl/internal/procutil"
)

const (
	gitLabContainerName       = "mock-gitlab"
	gitLabRunnerContainerName = "mock-gitlab-runner"
	gitLabHostPort            = "8929"
	gitLabURL                 = "http://localhost:" + gitLabHostPort
)

// StartGitLab brings up GitLab CE + runner via deploy/gitlab/docker-compose.yml.
// Containers keep their volumes between restarts (compose down without -v).
func StartGitLab() error {
	compose, err := findGitLabComposePath()
	if err != nil {
		return err
	}

	fmt.Println("GitLab compose:", compose)
	fmt.Println("RAM note: GitLab CE needs ~4–6 GB; 8+ GB recommended with minikube.")

	if err := dockerCompose(compose, "up", "-d"); err != nil {
		return fmt.Errorf("docker compose up: %w", err)
	}
	return nil
}

// StopGitLab stops GitLab containers (volumes preserved). Best-effort.
func StopGitLab() {
	compose, err := findGitLabComposePath()
	if err != nil {
		return
	}
	_, stderr, err := procutil.RunCapture(nil, "docker", "compose", "-f", compose, "down")
	if err == nil {
		fmt.Println("Stopped GitLab stack (volumes kept).")
		return
	}
	_, stderr2, err2 := procutil.RunCapture(nil, "docker-compose", "-f", compose, "down")
	if err2 == nil {
		fmt.Println("Stopped GitLab stack (volumes kept).")
		return
	}
	msg := strings.ToLower(stderr + stderr2)
	if strings.Contains(msg, "no such file") || strings.Contains(msg, "not found") {
		return
	}
	fmt.Fprintf(os.Stderr, "warning: stop GitLab: %v (%s)\n", err, strings.TrimSpace(stderr))
}

// WaitGitLabReady polls until core GitLab services report run: or timeout.
func WaitGitLabReady(timeout time.Duration) error {
	deadline := time.Now().Add(timeout)
	var last string
	for time.Now().Before(deadline) {
		if gitLabCoreRunning(&last) {
			return nil
		}
		fmt.Printf("  GitLab still starting... (%s)\n", trimOneLine(last))
		time.Sleep(15 * time.Second)
	}
	return fmt.Errorf("GitLab not ready after %v — check: docker exec %s gitlab-ctl status", timeout, gitLabContainerName)
}

func gitLabCoreRunning(last *string) bool {
	if !containerRunning(gitLabContainerName) {
		*last = "container not running"
		return false
	}
	stdout, stderr, err := procutil.RunCapture(nil, "docker", "exec", gitLabContainerName, "gitlab-ctl", "status")
	if err != nil {
		*last = strings.TrimSpace(stderr)
		return false
	}
	*last = stdout
	// puma + sidekiq are enough for UI and CI planning.
	return strings.Contains(stdout, "run: puma") && strings.Contains(stdout, "run: sidekiq")
}

// BootstrapRunner registers mock-gitlab-runner if config.toml has no [[runners]] yet.
func BootstrapRunner() error {
	if !containerRunning(gitLabRunnerContainerName) {
		return fmt.Errorf("runner container %q is not running", gitLabRunnerContainerName)
	}
	if runnerAlreadyRegistered() {
		fmt.Println("GitLab runner already registered — skipping bootstrap.")
		return nil
	}

	token, err := gitLabRegistrationToken()
	if err != nil {
		return err
	}
	if token == "" {
		return fmt.Errorf("empty registration token — enable allow_runner_registration_token in GitLab config")
	}

	args := []string{
		"exec", gitLabRunnerContainerName,
		"gitlab-runner", "register",
		"--non-interactive",
		"--url", "http://gitlab",
		"--token", token,
		"--executor", "docker",
		"--docker-image", "alpine:latest",
		"--description", "mockctl-local",
		"--tag-list", "docker,local",
		"--docker-network-mode", "host",
	}
	_, stderr, err := procutil.RunCapture(nil, "docker", args...)
	if err != nil {
		return fmt.Errorf("gitlab-runner register: %w (%s)", err, strings.TrimSpace(stderr))
	}
	fmt.Println("Registered GitLab runner with tags: docker, local")
	return nil
}

func runnerAlreadyRegistered() bool {
	stdout, _, err := procutil.RunCapture(nil, "docker", "exec", gitLabRunnerContainerName, "cat", "/etc/gitlab-runner/config.toml")
	if err != nil {
		return false
	}
	return strings.Contains(stdout, "[[runners]]") && strings.Contains(stdout, "http://gitlab")
}

func gitLabRegistrationToken() (string, error) {
	ruby := "puts Gitlab::CurrentSettings.current_application_settings.runners_registration_token"
	stdout, stderr, err := procutil.RunCapture(nil, "docker", "exec", gitLabContainerName, "gitlab-rails", "runner", ruby)
	if err != nil {
		return "", fmt.Errorf("read registration token: %w (%s)", err, strings.TrimSpace(stderr))
	}
	return strings.TrimSpace(stdout), nil
}

// PrintGitLabSummary prints URLs and first-login hints after a successful up.
func PrintGitLabSummary() {
	fmt.Println()
	fmt.Println("GitLab ready:", gitLabURL)
	fmt.Println("Login: root")
	fmt.Println("Initial password (if first boot):")
	fmt.Printf("  docker exec %s grep 'Password:' /etc/gitlab/initial_root_password\n", gitLabContainerName)
	fmt.Println("Runner: Settings → CI/CD → Runners — expect online with tags docker, local")
	fmt.Println("Courses: gitlab-basic → gitlab-intermediate (deploy to mockctl)")
}

// PrintGitLabStatus prints a short GitLab block for mockctl status.
func PrintGitLabStatus() {
	if !containerRunning(gitLabContainerName) {
		fmt.Println("\nGitLab: not running (start with: mockctl up --gitlab)")
		return
	}
	fmt.Println()
	fmt.Println("GitLab:", gitLabURL, "(container running)")
	if runnerAlreadyRegistered() {
		fmt.Println("Runner: registered (tags docker, local)")
	} else {
		fmt.Println("Runner: not registered — run: mockctl up --gitlab (or register manually)")
	}
}

func containerRunning(name string) bool {
	stdout, _, err := procutil.RunCapture(nil, "docker", "inspect", "-f", "{{.State.Running}}", name)
	if err != nil {
		return false
	}
	return strings.TrimSpace(stdout) == "true"
}

func findGitLabComposePath() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	dir := wd
	for i := 0; i < 10; i++ {
		p := filepath.Join(dir, "deploy", "gitlab", "docker-compose.yml")
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("deploy/gitlab/docker-compose.yml not found — run mockctl from the mock-exams repository")
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
	if err := procutil.RunStream("docker-compose", legacy...); err != nil {
		return err
	}
	return nil
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
