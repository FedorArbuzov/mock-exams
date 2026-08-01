// Command mockctl controls the local minikube cluster used by the
// mock-exams courses and labs. It's a thin CLI layer: the actual work lives
// in the internal packages (cluster, installer, webui).
package main

import (
	"flag"
	"fmt"
	"os"
	"runtime"
	"strings"

	"mockctl/internal/cluster"
	"mockctl/internal/installer"
	"mockctl/internal/localstack"
	"mockctl/internal/webui"
)

const version = "0.2.0"

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
		err = installer.Install()
	case "up":
		err = runUp(args)
	case "down":
		err = runDown(args)
	case "clean":
		err = runClean(args)
	case "uninstall":
		err = runUninstall(args)
	case "kubeconfig":
		err = cluster.Kubeconfig()
	case "status":
		err = cluster.Status()
	case "localstack":
		err = runLocalstack(args)
	case "web":
		err = runWeb(args)
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
  up [--no-addons] [--nodes N] [--lb] [--lb-port P] [--gitlab]
                     Start cluster, enable addons, write output/kubeconfig.yaml
                     --nodes N   number of minikube nodes (default 1; final project uses 2)
                     --lb        edge nginx LB on localhost → Ingress Controller NodePort
                     --lb-port P host port for --lb (default 8080; use 18080 if :8080 is busy)
                                (does not install ingress; use with --no-addons for bare nodes)
                     --no-addons skip metrics-server/ingress addons (bare cluster)
                     --gitlab    GitLab CE + runner on localhost:8929 (single node);
                                auto-registers runner tags docker,local
  down [--soft]      Delete the minikube profile ([--soft] only stops it, keeps state)
                     Also stops edge LB and GitLab containers (volumes kept)
  clean [--full]     Delete cluster and clear ./output ([--full] also wipes ~/.minikube)
  uninstall          Remove cluster, caches, output/ and uninstall minikube+kubectl
                     Flags: [--yes] skip prompt, [--keep-tools] do not remove binaries
  kubeconfig         Re-export output/kubeconfig.yaml from a running cluster
  status             minikube status + refresh kubeconfig + kubectl get nodes
                     (+ GitLab / LocalStack blocks if those stacks are up)
  localstack <cmd>   AWS emulator for aws-terraform (no Kubernetes)
                     up      start deploy/localstack compose + wait for :4566
                     down    stop containers (volumes kept)
                     status  health check http://localhost:4566
  web [--port N]     Serve the courses-en/ directory as browsable HTML on localhost
                     Flags: [--courses-dir path] [--no-open]
  version            Print version
  help               Show this help

Environment:
  MOCKCTL_PROFILE    Override profile name (default: `+cluster.DefaultProfile+`)`)
}

func runLocalstack(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("usage: mockctl localstack <up|down|status>")
	}
	switch args[0] {
	case "up":
		return localstack.Up()
	case "down":
		return localstack.Down()
	case "status":
		return localstack.Status()
	case "help", "--help", "-h":
		fmt.Println(`mockctl localstack — LocalStack for aws-terraform (no minikube)

Usage:
  mockctl localstack up
  mockctl localstack down
  mockctl localstack status

Endpoint: http://localhost:4566
Compose:  deploy/localstack/docker-compose.yml`)
		return nil
	default:
		return fmt.Errorf("unknown localstack command %q (want up|down|status)", args[0])
	}
}

func runUp(args []string) error {
	fs := flag.NewFlagSet("up", flag.ExitOnError)
	noAddons := fs.Bool("no-addons", false, "skip enabling metrics-server and ingress")
	nodes := fs.Int("nodes", 1, "number of minikube nodes (default 1)")
	lb := fs.Bool("lb", false, "start edge LB on localhost (requires ingress)")
	lbPort := fs.String("lb-port", cluster.DefaultLBPort, "host port for --lb (default 8080)")
	gitlab := fs.Bool("gitlab", false, "start GitLab CE + runner on localhost:8929")
	if err := fs.Parse(args); err != nil {
		return err
	}
	return cluster.Up(cluster.UpOptions{
		Nodes:    *nodes,
		NoAddons: *noAddons,
		LB:       *lb,
		LBPort:   *lbPort,
		GitLab:   *gitlab,
	})
}

func runDown(args []string) error {
	fs := flag.NewFlagSet("down", flag.ExitOnError)
	soft := fs.Bool("soft", false, "stop the profile instead of deleting (next 'up' is much faster)")
	if err := fs.Parse(args); err != nil {
		return err
	}
	return cluster.Down(*soft)
}

func runClean(args []string) error {
	fs := flag.NewFlagSet("clean", flag.ExitOnError)
	full := fs.Bool("full", false, "also remove ~/.minikube cache")
	if err := fs.Parse(args); err != nil {
		return err
	}
	return cluster.Clean(*full)
}

func runUninstall(args []string) error {
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
	fmt.Println("  - stop GitLab containers (volumes kept)")
	if !*keepTools {
		switch runtime.GOOS {
		case "windows":
			fmt.Println("  - uninstall minikube and kubectl via winget")
		case "darwin":
			fmt.Println("  - uninstall minikube and kubectl via brew")
		default:
			fmt.Println("  - remove minikube and kubectl from", installer.LinuxInstallDir())
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

	cluster.TeardownForUninstall()

	if !*keepTools {
		installer.Uninstall()
	}

	fmt.Println()
	fmt.Println("Uninstall finished.")
	return nil
}

func runWeb(args []string) error {
	fs := flag.NewFlagSet("web", flag.ExitOnError)
	port := fs.Int("port", 8091, "port to listen on (bound to 127.0.0.1)")
	coursesDir := fs.String("courses-dir", "", "path to the courses directory (default: ./courses-en)")
	noOpen := fs.Bool("no-open", false, "do not open a browser automatically")
	if err := fs.Parse(args); err != nil {
		return err
	}

	opts := webui.Options{
		Port:        *port,
		CoursesDir:  *coursesDir,
		OpenBrowser: !*noOpen,
	}
	// Embedded builds (-tags embed) bundle their own courses copy; use it
	// unless the user explicitly pointed at a directory on disk.
	if *coursesDir == "" {
		if efs, name, ok := embeddedCourses(); ok {
			opts.FS = efs
			opts.FSName = name
		}
	}
	return webui.Serve(opts)
}
