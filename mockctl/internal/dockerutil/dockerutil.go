// Package dockerutil checks that a Docker daemon is reachable before
// mockctl tries to start a minikube cluster on top of it, with platform-
// aware hints when it isn't.
package dockerutil

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"os/exec"
	"runtime"
	"strings"
)

// RequireDocker is a soft check that the docker CLI is reachable and the
// daemon answers. Error messages are platform-aware so users get an
// actionable hint for Docker Desktop, plain Linux daemons, and WSL.
func RequireDocker() error {
	if _, err := exec.LookPath("docker"); err != nil {
		return fmt.Errorf("docker not found in PATH.\n%s", installHint())
	}
	cmd := exec.Command("docker", "info")
	var stderr bytes.Buffer
	cmd.Stdout = io.Discard
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		out := strings.ToLower(stderr.String())
		if strings.Contains(out, "permission denied") && strings.Contains(out, "docker.sock") {
			return fmt.Errorf("docker is reachable but your user can't talk to the daemon socket.\n%s", groupHint())
		}
		return fmt.Errorf("docker is installed but the daemon is not responding.\n%s", startHint())
	}
	return nil
}

func installHint() string {
	switch runtime.GOOS {
	case "windows", "darwin":
		return "Install and start Docker Desktop: https://www.docker.com/products/docker-desktop"
	default:
		if isWSL() {
			return "Install Docker Desktop on Windows and enable WSL Integration,\nor install docker inside WSL:\n  sudo apt update && sudo apt install -y docker.io"
		}
		return "Install docker, e.g. on Debian/Ubuntu:\n  sudo apt update && sudo apt install -y docker.io"
	}
}

func startHint() string {
	switch runtime.GOOS {
	case "windows", "darwin":
		return "Start Docker Desktop and try again."
	default:
		hint := "Start the Docker daemon:\n  sudo service docker start\n  # or, if your system uses systemd:\n  sudo systemctl start docker"
		if isWSL() {
			hint += "\nIf you rely on Docker Desktop on Windows: launch it and enable WSL Integration\n(Settings -> Resources -> WSL Integration)."
		}
		return hint
	}
}

func groupHint() string {
	hint := "Add yourself to the 'docker' group:\n  sudo usermod -aG docker \"$USER\""
	if isWSL() {
		hint += "\nThen, from PowerShell on Windows, run:\n  wsl --shutdown\nReopen WSL and try again."
	} else {
		hint += "\nThen log out and back in (or open a new login shell) and try again."
	}
	return hint
}

// isWSL returns true when the current process is running inside Windows
// Subsystem for Linux. Best-effort check via env var and /proc/version.
func isWSL() bool {
	if runtime.GOOS != "linux" {
		return false
	}
	if os.Getenv("WSL_DISTRO_NAME") != "" || os.Getenv("WSL_INTEROP") != "" {
		return true
	}
	b, err := os.ReadFile("/proc/version")
	if err != nil {
		return false
	}
	s := strings.ToLower(string(b))
	return strings.Contains(s, "microsoft") || strings.Contains(s, "wsl")
}
