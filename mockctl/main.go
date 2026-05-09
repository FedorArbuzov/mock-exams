package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const (
	version        = "0.1.0"
	defaultProfile = "mock-exams"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	cmd := os.Args[1]
	args := os.Args[2:]

	var err error
	switch cmd {
	case "install":
		err = cmdInstall(args)
	case "up":
		err = cmdUp(args)
	case "down":
		err = cmdDown(args)
	case "clean":
		err = cmdClean(args)
	case "uninstall":
		err = cmdUninstall(args)
	case "kubeconfig":
		err = cmdKubeconfig(args)
	case "status":
		err = cmdStatus(args)
	case "version", "--version", "-v":
		fmt.Println("mockctl", version)
	case "help", "--help", "-h":
		usage()
	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s\n\n", cmd)
		usage()
		os.Exit(2)
	}

	if err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func usage() {
	fmt.Fprintln(os.Stderr, `mockctl — control local minikube for mock-exams

Usage:
  mockctl <command> [args]

Commands:
  install            Install minikube and kubectl (winget on Windows, brew on macOS)
  up [--no-addons]   Start cluster, enable addons, write output/kubeconfig.yaml
  down [--soft]      Delete the minikube profile ([--soft] only stops it, keeps state)
  clean [--full]     Delete cluster and clear ./output ([--full] also wipes ~/.minikube)
  uninstall          Remove cluster, caches, output/ and uninstall minikube+kubectl
                     Flags: [--yes] skip prompt, [--keep-tools] do not remove binaries
  kubeconfig         Re-export output/kubeconfig.yaml from a running cluster
  status             minikube status + refresh kubeconfig + kubectl get nodes
  version            Print version
  help               Show this help

Environment:
  MOCKCTL_PROFILE    Override profile name (default: ` + defaultProfile + `)`)
}

// ----------------- helpers -----------------

func profileName() string {
	if p := os.Getenv("MOCKCTL_PROFILE"); p != "" {
		return p
	}
	return defaultProfile
}

func outputDir() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	return filepath.Join(wd, "output"), nil
}

// runStream runs a command and pipes its stdout/stderr to ours.
func runStream(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	return cmd.Run()
}

// findTool looks for a binary in PATH; if not found, falls back to common
// install locations per OS.
func findTool(name string) (string, error) {
	if p, err := exec.LookPath(name); err == nil {
		return p, nil
	}
	for _, c := range fallbackPaths(name) {
		if info, err := os.Stat(c); err == nil && !info.IsDir() {
			return c, nil
		}
	}
	return "", fmt.Errorf("%s not found in PATH", name)
}

func fallbackPaths(name string) []string {
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

func ensureMinikube() (string, error) {
	p, err := findTool("minikube")
	if err != nil {
		return "", fmt.Errorf("%w. Try: mockctl install (or open a NEW terminal if you just installed)", err)
	}
	return p, nil
}

// ----------------- install -----------------

func cmdInstall(_ []string) error {
	switch runtime.GOOS {
	case "windows":
		return installWindows()
	case "darwin":
		return installMac()
	default:
		return installLinux()
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
	if err := runStream("winget", "install", "-e", "--id", "Kubernetes.minikube",
		"--accept-package-agreements", "--accept-source-agreements"); err != nil {
		return fmt.Errorf("winget install minikube: %w", err)
	}
	if err := runStream("winget", "install", "-e", "--id", "Kubernetes.kubectl",
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
	return runStream("brew", "install", "minikube", "kubernetes-cli")
}

func installLinux() error {
	arch := linuxDownloadArch()
	if arch == "" {
		return fmt.Errorf("unsupported Linux architecture: %s", runtime.GOARCH)
	}

	installDir := linuxInstallDir()
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

	if !isDirOnPath(installDir) {
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

func linuxInstallDir() string {
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

func isDirOnPath(dir string) bool {
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

// ----------------- up / down / clean / status -----------------

func cmdUp(args []string) error {
	fs := flag.NewFlagSet("up", flag.ExitOnError)
	noAddons := fs.Bool("no-addons", false, "skip enabling metrics-server and ingress")
	if err := fs.Parse(args); err != nil {
		return err
	}

	mk, err := ensureMinikube()
	if err != nil {
		return err
	}

	if err := requireDocker(); err != nil {
		return err
	}

	p := profileName()
	fmt.Printf("Starting minikube profile %q (driver=docker)...\n", p)
	if err := runStream(mk, "start", "-p", p, "--driver=docker"); err != nil {
		return fmt.Errorf("minikube start: %w", err)
	}

	if !*noAddons {
		for _, addon := range []string{"metrics-server", "ingress"} {
			fmt.Printf("\nEnabling addon: %s\n", addon)
			if err := runStream(mk, "addons", "enable", addon, "-p", p); err != nil {
				fmt.Fprintf(os.Stderr, "warning: failed to enable %s: %v\n", addon, err)
			}
		}
	}

	if err := writeKubeconfig(mk, p); err != nil {
		return err
	}
	return nil
}

func cmdDown(args []string) error {
	fs := flag.NewFlagSet("down", flag.ExitOnError)
	soft := fs.Bool("soft", false, "stop the profile instead of deleting (next 'up' is much faster)")
	if err := fs.Parse(args); err != nil {
		return err
	}

	mk, err := ensureMinikube()
	if err != nil {
		return err
	}
	p := profileName()

	if *soft {
		fmt.Printf("Stopping minikube profile %q (state preserved)...\n", p)
		if err := runStream(mk, "stop", "-p", p); err != nil {
			return fmt.Errorf("minikube stop: %w", err)
		}
		fmt.Println("Stopped. Resume with: mockctl up")
		return nil
	}

	fmt.Printf("Deleting minikube profile %q...\n", p)
	return runStream(mk, "delete", "-p", p)
}

func cmdClean(args []string) error {
	fs := flag.NewFlagSet("clean", flag.ExitOnError)
	full := fs.Bool("full", false, "also remove ~/.minikube cache")
	if err := fs.Parse(args); err != nil {
		return err
	}

	if mk, err := findTool("minikube"); err == nil {
		fmt.Println("Deleting minikube cluster(s)...")
		_ = runStream(mk, "delete", "--all")
	} else {
		fmt.Fprintln(os.Stderr, "minikube not found in PATH; skipping cluster delete")
	}

	if out, err := outputDir(); err == nil {
		if entries, err := os.ReadDir(out); err == nil {
			for _, e := range entries {
				_ = os.RemoveAll(filepath.Join(out, e.Name()))
			}
			fmt.Println("Cleared:", out)
		}
	}

	if *full {
		home, err := os.UserHomeDir()
		if err == nil {
			cache := filepath.Join(home, ".minikube")
			if _, err := os.Stat(cache); err == nil {
				if err := os.RemoveAll(cache); err == nil {
					fmt.Println("Removed minikube cache:", cache)
				} else {
					fmt.Fprintf(os.Stderr, "warning: failed to remove %s: %v\n", cache, err)
				}
			}
		}
	}

	fmt.Println("Done. Next: mockctl up")
	return nil
}

// ----------------- uninstall -----------------

func cmdUninstall(args []string) error {
	fs := flag.NewFlagSet("uninstall", flag.ExitOnError)
	yes := fs.Bool("yes", false, "skip confirmation prompt")
	keepTools := fs.Bool("keep-tools", false, "do not uninstall minikube/kubectl binaries")
	if err := fs.Parse(args); err != nil {
		return err
	}

	fmt.Println("This will:")
	fmt.Println("  - delete all minikube profiles")
	fmt.Println("  - remove ~/.minikube and ~/.kube")
	fmt.Println("  - clear ./output (except .gitkeep)")
	if !*keepTools {
		switch runtime.GOOS {
		case "windows":
			fmt.Println("  - uninstall minikube and kubectl via winget")
		case "darwin":
			fmt.Println("  - uninstall minikube and kubectl via brew")
		default:
			fmt.Println("  - remove minikube and kubectl from", linuxInstallDir())
		}
	}

	if !*yes {
		fmt.Print("\nContinue? [y/N] ")
		var ans string
		_, _ = fmt.Scanln(&ans)
		if !strings.EqualFold(ans, "y") && !strings.EqualFold(ans, "yes") {
			fmt.Println("Aborted.")
			return nil
		}
	}

	if mk, err := findTool("minikube"); err == nil {
		fmt.Println("\nDeleting minikube cluster(s)...")
		_ = runStream(mk, "delete", "--all")
	} else {
		fmt.Fprintln(os.Stderr, "minikube not found in PATH; skipping cluster delete")
	}

	if home, err := os.UserHomeDir(); err == nil && home != "" {
		for _, d := range []string{".minikube", ".kube"} {
			p := filepath.Join(home, d)
			if _, err := os.Stat(p); err == nil {
				if err := os.RemoveAll(p); err != nil {
					fmt.Fprintf(os.Stderr, "warning: failed to remove %s: %v\n", p, err)
				} else {
					fmt.Println("Removed:", p)
				}
			}
		}
	}

	if out, err := outputDir(); err == nil {
		if entries, err := os.ReadDir(out); err == nil {
			for _, e := range entries {
				if e.Name() == ".gitkeep" {
					continue
				}
				_ = os.RemoveAll(filepath.Join(out, e.Name()))
			}
			fmt.Println("Cleared:", out)
		}
	}

	if !*keepTools {
		switch runtime.GOOS {
		case "windows":
			uninstallWindows()
		case "darwin":
			uninstallMac()
		default:
			uninstallLinux()
		}
	}

	fmt.Println()
	fmt.Println("Uninstall finished.")
	return nil
}

func uninstallWindows() {
	if _, err := exec.LookPath("winget"); err != nil {
		fmt.Fprintln(os.Stderr, "winget not found; remove minikube and kubectl manually")
		return
	}
	for _, id := range []string{"Kubernetes.minikube", "Kubernetes.kubectl"} {
		fmt.Printf("\nwinget uninstall %s\n", id)
		_ = runStream("winget", "uninstall", "-e", "--id", id,
			"--accept-source-agreements")
	}
}

func uninstallMac() {
	if _, err := exec.LookPath("brew"); err != nil {
		fmt.Fprintln(os.Stderr, "brew not found; remove minikube and kubectl manually")
		return
	}
	fmt.Println("\nbrew uninstall minikube kubernetes-cli")
	_ = runStream("brew", "uninstall", "minikube", "kubernetes-cli")
}

func uninstallLinux() {
	dir := linuxInstallDir()
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

func cmdStatus(_ []string) error {
	mk, err := ensureMinikube()
	if err != nil {
		return err
	}
	p := profileName()

	statusErr := runStream(mk, "status", "-p", p)
	if statusErr != nil {
		fmt.Fprintln(os.Stderr, "(minikube status reported issues; skipping kubectl)")
		return nil
	}

	// Cluster is reportedly running. The API-server port can change after
	// stop/start (Docker assigns a new random host port), so refresh the
	// exported kubeconfig before talking to the cluster.
	kcPath, err := refreshKubeconfig(mk, p)
	if err != nil {
		fmt.Fprintln(os.Stderr, "warning: failed to refresh kubeconfig:", err)
		out, _ := outputDir()
		kcPath = filepath.Join(out, "kubeconfig.yaml")
	}

	kc, err := findTool("kubectl")
	if err != nil {
		return nil
	}
	if _, err := os.Stat(kcPath); err == nil {
		fmt.Println()
		return runStream(kc, "--kubeconfig", kcPath, "get", "nodes")
	}
	return nil
}

// cmdKubeconfig re-exports output/kubeconfig.yaml from the running cluster.
// Useful when the file is stale (e.g. after a Docker restart that reassigned
// the API-server port) and you don't want to do a full `up` cycle.
func cmdKubeconfig(_ []string) error {
	mk, err := ensureMinikube()
	if err != nil {
		return err
	}
	p := profileName()

	kcPath, err := refreshKubeconfig(mk, p)
	if err != nil {
		return err
	}
	fmt.Println("Kubeconfig refreshed:", kcPath)
	fmt.Printf("Check: kubectl --kubeconfig %q get nodes\n", kcPath)
	return nil
}

// ----------------- internal -----------------

// requireDocker is a soft check that docker CLI is reachable.
func requireDocker() error {
	if _, err := exec.LookPath("docker"); err != nil {
		return errors.New("docker not found in PATH. Install and start Docker Desktop")
	}
	cmd := exec.Command("docker", "info")
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard
	if err := cmd.Run(); err != nil {
		return errors.New("docker is installed but not running. Start Docker Desktop and try again")
	}
	return nil
}

// refreshKubeconfig writes a flattened, minified kubeconfig for the given
// minikube profile to ./output/kubeconfig.yaml and returns its path.
// Silent: prints nothing on its own.
func refreshKubeconfig(minikube, profile string) (string, error) {
	out, err := outputDir()
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(out, 0o755); err != nil {
		return "", err
	}
	kcPath := filepath.Join(out, "kubeconfig.yaml")

	cmd := exec.Command(minikube, "-p", profile, "kubectl", "--",
		"config", "view", "--flatten", "--minify")
	f, err := os.Create(kcPath)
	if err != nil {
		return "", fmt.Errorf("create %s: %w", kcPath, err)
	}
	defer f.Close()
	cmd.Stdout = f
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("export kubeconfig: %w", err)
	}
	return kcPath, nil
}

// writeKubeconfig is the chatty wrapper around refreshKubeconfig used by `up`.
func writeKubeconfig(minikube, profile string) error {
	kcPath, err := refreshKubeconfig(minikube, profile)
	if err != nil {
		return err
	}
	fmt.Println()
	fmt.Println("Kubeconfig written:", kcPath)
	fmt.Printf("Check: kubectl --kubeconfig %q get nodes\n", kcPath)
	fmt.Println("Stop (keep profile): mockctl down --soft # full delete: mockctl down")
	return nil
}
