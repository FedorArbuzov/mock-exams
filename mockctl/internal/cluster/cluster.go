// Package cluster manages the mockctl minikube profile: starting/stopping
// it, enabling addons, exporting kubeconfig, an optional edge load-balancer
// container, and tearing it down.
package cluster

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"mockctl/internal/dockerutil"
	"mockctl/internal/localstack"
	"mockctl/internal/procutil"
	"mockctl/internal/toolpath"
)

// DefaultProfile is the minikube profile name used when MOCKCTL_PROFILE
// isn't set.
const DefaultProfile = "mock-exams"

// UpOptions configures a cluster start.
type UpOptions struct {
	// Nodes is the number of minikube nodes (1 = single-node default).
	Nodes int
	// NoAddons skips metrics-server and ingress.
	NoAddons bool
	// LB starts a docker nginx container that publishes localhost:LBPort and
	// load-balances to an ingress-nginx controller NodePort on every node.
	// Does not install the controller — that must already exist (or be
	// installed by the user). Compatible with --no-addons.
	LB bool
	// LBPort is the host port for the edge LB (default 8080).
	LBPort string
	// GitLab starts GitLab CE + runner (deploy/gitlab compose) on
	// localhost:8929 and bootstraps a docker executor runner (tags docker,
	// local). Forces a single-node cluster.
	GitLab bool
}

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
// addons, optionally starts the edge LB, and writes output/kubeconfig.yaml.
func Up(opts UpOptions) error {
	if opts.Nodes < 1 {
		opts.Nodes = 1
	}
	if opts.GitLab && opts.Nodes > 1 {
		fmt.Fprintf(os.Stderr, "note: --gitlab uses a single-node cluster; ignoring --nodes %d\n", opts.Nodes)
		opts.Nodes = 1
	}

	if err := dockerutil.RequireDocker(); err != nil {
		return err
	}

	if opts.LB {
		lbPort := resolveLBPort(opts.LBPort)
		opts.LBPort = lbPort
		fmt.Printf("Checking edge LB port localhost:%s...\n", lbPort)
		if err := PreflightLBPort(lbPort); err != nil {
			return err
		}
	}

	if opts.GitLab {
		fmt.Println("Starting GitLab CE + runner (localhost:8929)...")
		if err := StartGitLab(); err != nil {
			return fmt.Errorf("start GitLab: %w", err)
		}
	}

	mk, err := toolpath.EnsureMinikube()
	if err != nil {
		return err
	}

	p := ProfileName()
	fmt.Printf("Starting minikube profile %q (driver=docker, nodes=%d)...\n", p, opts.Nodes)

	args := []string{"start", "-p", p, "--driver=docker"}
	if opts.Nodes > 1 {
		args = append(args, "--nodes", strconv.Itoa(opts.Nodes))
	}
	if err := procutil.RunStream(mk, args...); err != nil {
		return fmt.Errorf("minikube start: %w\nHint: changing node count usually needs a fresh profile — try: mockctl down && mockctl up --nodes %d%s",
			err, opts.Nodes, lbHint(opts.LB))
	}

	if !opts.NoAddons {
		for _, addon := range []string{"metrics-server", "ingress"} {
			fmt.Printf("\nEnabling addon: %s\n", addon)
			if err := procutil.RunStream(mk, "addons", "enable", addon, "-p", p); err != nil {
				fmt.Fprintf(os.Stderr, "warning: failed to enable %s: %v\n", addon, err)
			}
		}
	} else if opts.LB {
		fmt.Println("note: --no-addons set; not enabling metrics-server/ingress. Edge LB starts anyway (502 until you install an Ingress Controller).")
	}

	if err := writeKubeconfig(mk, p); err != nil {
		return err
	}

	if opts.LB {
		fmt.Printf("\nStarting edge load balancer (localhost:%s → ingress NodePort)...\n", opts.LBPort)
		if err := StartLB(opts.LBPort); err != nil {
			return fmt.Errorf("start LB: %w", err)
		}
	}

	if opts.GitLab {
		fmt.Println("\nWaiting for GitLab to become ready (first boot may take 5–15 min)...")
		if err := WaitGitLabReady(15 * time.Minute); err != nil {
			return err
		}
		if err := BootstrapRunner(); err != nil {
			fmt.Fprintf(os.Stderr, "warning: runner bootstrap failed: %v\n", err)
			fmt.Fprintf(os.Stderr, "Register manually — see deploy/gitlab/README.md\n")
		}
		PrintGitLabSummary()
	}

	return nil
}

func lbHint(lb bool) string {
	if lb {
		return " --lb"
	}
	return ""
}

// Down stops (soft=true) or deletes the minikube profile, and always
// removes the edge LB container if it exists.
func Down(soft bool) error {
	StopLB()
	StopGitLab()

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
	StopLB()
	StopGitLab()

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
	StopLB()
	StopGitLab()

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
		PrintLBStatus()
		PrintGitLabStatus()
		localstack.PrintStatus()
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
	if err == nil {
		if _, err := os.Stat(kcPath); err == nil {
			fmt.Println()
			if err := procutil.RunStream(kc, "--kubeconfig", kcPath, "get", "nodes"); err != nil {
				PrintLBStatus()
				PrintGitLabStatus()
				localstack.PrintStatus()
				return err
			}
		}
	}
	PrintLBStatus()
	PrintGitLabStatus()
	localstack.PrintStatus()
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
