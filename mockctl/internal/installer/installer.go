// Package installer installs and uninstalls minikube and kubectl using
// whichever mechanism fits the current OS: winget on Windows, Homebrew on
// macOS, direct binary downloads into ~/.local/bin on Linux.
package installer

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"mockctl/internal/procutil"
	"mockctl/internal/toolpath"
)

// Install installs minikube and kubectl for the current OS.
func Install() error {
	switch runtime.GOOS {
	case "windows":
		return installWindows()
	case "darwin":
		return installMac()
	default:
		return installLinux()
	}
}

// Uninstall removes minikube and kubectl using whichever mechanism installed
// them for the current OS. Best-effort: failures are printed, not returned,
// so a missing tool doesn't abort the rest of `mockctl uninstall`.
func Uninstall() {
	switch runtime.GOOS {
	case "windows":
		uninstallWindows()
	case "darwin":
		uninstallMac()
	default:
		uninstallLinux()
	}
}

func installWindows() error {
	if _, err := exec.LookPath("winget"); err != nil {
		fmt.Println("winget not found.")
		fmt.Println("Install App Installer from Microsoft Store:")
		fmt.Println("  https://apps.microsoft.com/detail/9nblggh4nns1")
		fmt.Println("Or download minikube/kubectl manually:")
		fmt.Println("  https://minikube.sigs.k8s.io/docs/start/")
		fmt.Println("  https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/")
		return errors.New("winget not available")
	}
	fmt.Println("Installing minikube and kubectl via winget...")
	if err := procutil.RunStream("winget", "install", "-e", "--id", "Kubernetes.minikube",
		"--accept-package-agreements", "--accept-source-agreements"); err != nil {
		return fmt.Errorf("winget install minikube: %w", err)
	}
	if err := procutil.RunStream("winget", "install", "-e", "--id", "Kubernetes.kubectl",
		"--accept-package-agreements", "--accept-source-agreements"); err != nil {
		return fmt.Errorf("winget install kubectl: %w", err)
	}
	fmt.Println()
	fmt.Println("Installed.")
	fmt.Println("If 'minikube' is still not found in this terminal, open a NEW terminal and run: mockctl up")
	return nil
}

func installMac() error {
	if _, err := exec.LookPath("brew"); err != nil {
		fmt.Println("Homebrew (brew) not found.")
		fmt.Println("Install from: https://brew.sh")
		fmt.Println("Or install minikube/kubectl manually:")
		fmt.Println("  https://minikube.sigs.k8s.io/docs/start/")
		fmt.Println("  https://kubernetes.io/docs/tasks/tools/install-kubectl-macos/")
		return errors.New("brew not available")
	}
	fmt.Println("Installing minikube and kubectl via Homebrew...")
	return procutil.RunStream("brew", "install", "minikube", "kubernetes-cli")
}

func installLinux() error {
	arch := linuxDownloadArch()
	if arch == "" {
		return fmt.Errorf("unsupported Linux architecture: %s", runtime.GOARCH)
	}

	installDir := LinuxInstallDir()
	if err := os.MkdirAll(installDir, 0o755); err != nil {
		return fmt.Errorf("create %s: %w", installDir, err)
	}
	fmt.Println("Install directory:", installDir)

	mkURL := fmt.Sprintf("https://storage.googleapis.com/minikube/releases/latest/minikube-linux-%s", arch)
	mkPath := filepath.Join(installDir, "minikube")
	fmt.Println()
	fmt.Println("Downloading minikube:", mkURL)
	if err := downloadAndInstall(mkURL, mkPath); err != nil {
		return fmt.Errorf("install minikube: %w", err)
	}

	kVer, err := fetchKubectlStableVersion()
	if err != nil {
		return fmt.Errorf("resolve kubectl version: %w", err)
	}
	kURL := fmt.Sprintf("https://dl.k8s.io/release/%s/bin/linux/%s/kubectl", kVer, arch)
	kPath := filepath.Join(installDir, "kubectl")
	fmt.Println()
	fmt.Printf("Downloading kubectl %s: %s\n", kVer, kURL)
	if err := downloadAndInstall(kURL, kPath); err != nil {
		return fmt.Errorf("install kubectl: %w", err)
	}

	fmt.Println()
	fmt.Println("Installed:")
	fmt.Println("  ", mkPath)
	fmt.Println("  ", kPath)

	if !toolpath.IsDirOnPath(installDir) {
		fmt.Println()
		fmt.Println("WARNING:", installDir, "is not in your PATH.")
		fmt.Println("Add it to your shell profile, then open a NEW terminal:")
		fmt.Printf("  echo 'export PATH=\"%s:$PATH\"' >> ~/.bashrc\n", installDir)
		fmt.Println("  # or for zsh:")
		fmt.Printf("  echo 'export PATH=\"%s:$PATH\"' >> ~/.zshrc\n", installDir)
	} else {
		fmt.Println()
		fmt.Println("Next: mockctl up")
	}
	return nil
}

// LinuxInstallDir returns the directory mockctl installs (and looks for)
// minikube/kubectl in on Linux, honoring $MOCKCTL_INSTALL_DIR.
func LinuxInstallDir() string {
	if d := os.Getenv("MOCKCTL_INSTALL_DIR"); d != "" {
		return d
	}
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		return "/usr/local/bin"
	}
	return filepath.Join(home, ".local", "bin")
}

func linuxDownloadArch() string {
	switch runtime.GOARCH {
	case "amd64":
		return "amd64"
	case "arm64":
		return "arm64"
	case "arm":
		return "arm"
	default:
		return ""
	}
}

func downloadAndInstall(url, dest string) error {
	client := &http.Client{Timeout: 10 * time.Minute}
	resp, err := client.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %s for %s", resp.Status, url)
	}

	tmp, err := os.CreateTemp(filepath.Dir(dest), ".mockctl-dl-*")
	if err != nil {
		return err
	}
	tmpPath := tmp.Name()
	cleanup := func() { _ = os.Remove(tmpPath) }

	if _, err := io.Copy(tmp, resp.Body); err != nil {
		tmp.Close()
		cleanup()
		return err
	}
	if err := tmp.Close(); err != nil {
		cleanup()
		return err
	}
	if err := os.Chmod(tmpPath, 0o755); err != nil {
		cleanup()
		return err
	}
	if err := os.Rename(tmpPath, dest); err != nil {
		cleanup()
		return err
	}
	return nil
}

func fetchKubectlStableVersion() (string, error) {
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get("https://dl.k8s.io/release/stable.txt")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %s for stable.txt", resp.Status)
	}
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	v := strings.TrimSpace(string(b))
	if v == "" {
		return "", errors.New("empty version string")
	}
	return v, nil
}

func uninstallWindows() {
	if _, err := exec.LookPath("winget"); err != nil {
		fmt.Fprintln(os.Stderr, "winget not found; remove minikube and kubectl manually")
		return
	}
	for _, id := range []string{"Kubernetes.minikube", "Kubernetes.kubectl"} {
		fmt.Printf("\nwinget uninstall %s\n", id)
		_ = procutil.RunStream("winget", "uninstall", "-e", "--id", id,
			"--accept-source-agreements")
	}
}

func uninstallMac() {
	if _, err := exec.LookPath("brew"); err != nil {
		fmt.Fprintln(os.Stderr, "brew not found; remove minikube and kubectl manually")
		return
	}
	fmt.Println("\nbrew uninstall minikube kubernetes-cli")
	_ = procutil.RunStream("brew", "uninstall", "minikube", "kubernetes-cli")
}

func uninstallLinux() {
	dir := LinuxInstallDir()
	for _, name := range []string{"minikube", "kubectl"} {
		p := filepath.Join(dir, name)
		if _, err := os.Stat(p); err == nil {
			if err := os.Remove(p); err != nil {
				fmt.Fprintf(os.Stderr, "warning: failed to remove %s: %v\n", p, err)
			} else {
				fmt.Println("Removed:", p)
			}
		}
	}
}
