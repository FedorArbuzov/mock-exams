// Package cluster manages the mockctl minikube profile: starting/stopping
// it, enabling addons, exporting kubeconfig, and tearing it down.
package cluster

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"mockctl/internal/dockerutil"
	"mockctl/internal/procutil"
	"mockctl/internal/toolpath"
)

// DefaultProfile is the minikube profile name used when MOCKCTL_PROFILE
// isn't set.
const DefaultProfile = "mock-exams"

// ProfileName returns the minikube profile to operate on, honoring
// $MOCKCTL_PROFILE.
func ProfileName() string {
	if p := os.Getenv("MOCKCTL_PROFILE"); p != "" {
		return p
	}
	return DefaultProfile
}

// OutputDir returns ./output relative to the current working directory,
// where kubeconfig.yaml is written.
func OutputDir() (string, error) {
	wd, err := os.Getwd()
	if err != nil {
		return "", err
	}
	return filepath.Join(wd, "output"), nil
}

// Up starts the minikube profile on the docker driver, optionally enables
// the metrics-server/ingress addons, and writes out/kubeconfig.yaml.
func Up(noAddons bool) error {
	mk, err := toolpath.EnsureMinikube()
	if err != nil {
		return err
	}

	if err := dockerutil.RequireDocker(); err != nil {
		return err
	}

	p := ProfileName()
	fmt.Printf("Starting minikube profile %q (driver=docker)...\n", p)
	if err := procutil.RunStream(mk, "start", "-p", p, "--driver=docker"); err != nil {
		return fmt.Errorf("minikube start: %w", err)
	}

	if !noAddons {
		for _, addon := range []string{"metrics-server", "ingress"} {
			fmt.Printf("\nEnabling addon: %s\n", addon)
			if err := procutil.RunStream(mk, "addons", "enable", addon, "-p", p); err != nil {
				fmt.Fprintf(os.Stderr, "warning: failed to enable %s: %v\n", addon, err)
			}
		}
	}

	return writeKubeconfig(mk, p)
}

// Down stops (soft=true) or deletes the minikube profile.
func Down(soft bool) error {
	mk, err := toolpath.EnsureMinikube()
	if err != nil {
		return err
	}
	p := ProfileName()

	if soft {
		fmt.Printf("Stopping minikube profile %q (state preserved)...\n", p)
		if err := procutil.RunStream(mk, "stop", "-p", p); err != nil {
			return fmt.Errorf("minikube stop: %w", err)
		}
		fmt.Println("Stopped. Resume with: mockctl up")
		return nil
	}

	fmt.Printf("Deleting minikube profile %q...\n", p)
	return procutil.RunStream(mk, "delete", "-p", p)
}

// Clean deletes every minikube profile and clears ./output. With full=true
// it also wipes the ~/.minikube cache.
func Clean(full bool) error {
	if mk, err := toolpath.Find("minikube"); err == nil {
		fmt.Println("Deleting minikube cluster(s)...")
		_ = procutil.RunStream(mk, "delete", "--all")
	} else {
		fmt.Fprintln(os.Stderr, "minikube not found in PATH; skipping cluster delete")
	}

	if out, err := OutputDir(); err == nil {
		if entries, err := os.ReadDir(out); err == nil {
			for _, e := range entries {
				_ = os.RemoveAll(filepath.Join(out, e.Name()))
			}
			fmt.Println("Cleared:", out)
		}
	}

	if full {
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

// TeardownForUninstall deletes every minikube profile and removes
// ~/.minikube, ~/.kube and ./output. It's the cluster-side half of
// `mockctl uninstall` — the tool-removal half lives in the installer
// package (see installer.Uninstall).
func TeardownForUninstall() {
	if mk, err := toolpath.Find("minikube"); err == nil {
		fmt.Println("\nDeleting minikube cluster(s)...")
		_ = procutil.RunStream(mk, "delete", "--all")
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

	if out, err := OutputDir(); err == nil {
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
}

// Status runs `minikube status`, and if the cluster looks up, refreshes
// output/kubeconfig.yaml and runs `kubectl get nodes`.
func Status() error {
	mk, err := toolpath.EnsureMinikube()
	if err != nil {
		return err
	}
	p := ProfileName()

	statusErr := procutil.RunStream(mk, "status", "-p", p)
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
		out, _ := OutputDir()
		kcPath = filepath.Join(out, "kubeconfig.yaml")
	}

	kc, err := toolpath.Find("kubectl")
	if err != nil {
		return nil
	}
	if _, err := os.Stat(kcPath); err == nil {
		fmt.Println()
		return procutil.RunStream(kc, "--kubeconfig", kcPath, "get", "nodes")
	}
	return nil
}

// Kubeconfig re-exports output/kubeconfig.yaml from the running cluster.
// Useful when the file is stale (e.g. after a Docker restart that reassigned
// the API-server port) and you don't want to do a full `up` cycle.
func Kubeconfig() error {
	mk, err := toolpath.EnsureMinikube()
	if err != nil {
		return err
	}
	p := ProfileName()

	kcPath, err := refreshKubeconfig(mk, p)
	if err != nil {
		return err
	}
	fmt.Println("Kubeconfig refreshed:", kcPath)
	fmt.Printf("Check: kubectl --kubeconfig %q get nodes\n", kcPath)
	return nil
}

// refreshKubeconfig writes a flattened, minified kubeconfig for the given
// minikube profile to ./output/kubeconfig.yaml and returns its path.
// Silent: prints nothing on its own.
func refreshKubeconfig(minikube, profile string) (string, error) {
	out, err := OutputDir()
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

// writeKubeconfig is the chatty wrapper around refreshKubeconfig used by Up.
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
