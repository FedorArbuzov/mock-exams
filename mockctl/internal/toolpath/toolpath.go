// Package toolpath locates the minikube/kubectl binaries: first on PATH,
// then in the usual per-OS install locations mockctl itself installs into.
package toolpath

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// Find looks for a binary in PATH; if not found, it falls back to common
// per-OS install locations (Program Files on Windows, Homebrew prefixes on
// macOS, ~/.local/bin and friends on Linux).
func Find(name string) (string, error) {
	if p, err := exec.LookPath(name); err == nil {
		return p, nil
	}
	for _, c := range FallbackPaths(name) {
		if info, err := os.Stat(c); err == nil && !info.IsDir() {
			return c, nil
		}
	}
	return "", fmt.Errorf("%s not found in PATH", name)
}

// FallbackPaths lists the places Find checks for name after PATH comes up
// empty, in priority order.
func FallbackPaths(name string) []string {
	exe := name
	switch runtime.GOOS {
	case "windows":
		if !strings.HasSuffix(strings.ToLower(name), ".exe") {
			exe = name + ".exe"
		}
		programFiles := os.Getenv("ProgramFiles")
		if programFiles == "" {
			programFiles = `C:\Program Files`
		}
		return []string{
			filepath.Join(programFiles, "Kubernetes", "Minikube", exe),
			filepath.Join(programFiles, "Kubernetes", exe),
		}
	case "darwin":
		return []string{
			filepath.Join("/opt/homebrew/bin", exe),
			filepath.Join("/usr/local/bin", exe),
		}
	default:
		paths := []string{
			filepath.Join("/usr/local/bin", exe),
			filepath.Join("/usr/bin", exe),
		}
		if home, err := os.UserHomeDir(); err == nil && home != "" {
			paths = append([]string{filepath.Join(home, ".local", "bin", exe)}, paths...)
		}
		return paths
	}
}

// IsDirOnPath reports whether dir is present (as an absolute path) in the
// current process's PATH.
func IsDirOnPath(dir string) bool {
	abs, err := filepath.Abs(dir)
	if err != nil {
		return false
	}
	for _, p := range filepath.SplitList(os.Getenv("PATH")) {
		if pa, err := filepath.Abs(p); err == nil && pa == abs {
			return true
		}
	}
	return false
}

// EnsureMinikube finds the minikube binary or returns an actionable error
// telling the user to run `mockctl install`.
func EnsureMinikube() (string, error) {
	p, err := Find("minikube")
	if err != nil {
		return "", fmt.Errorf("%w. Try: mockctl install (or open a NEW terminal if you just installed)", err)
	}
	return p, nil
}
