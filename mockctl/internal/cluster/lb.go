package cluster

import (
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"mockctl/internal/procutil"
	"mockctl/internal/toolpath"
)

// LBContainerName is the docker container that publishes the edge LB.
const LBContainerName = "mockctl-lb"

// DefaultLBPort is the host port bound to the LB container's port 80.
const DefaultLBPort = "8080"

// StopLB removes the edge LB container if it exists. Best-effort; never fails
// the caller — a missing container is fine.
func StopLB() {
	_, stderr, err := procutil.RunCapture(nil, "docker", "rm", "-f", LBContainerName)
	if err != nil {
		msg := strings.ToLower(stderr + err.Error())
		if strings.Contains(msg, "no such container") ||
			strings.Contains(msg, "no such object") ||
			strings.Contains(msg, "executable file not found") {
			return
		}
		fmt.Fprintf(os.Stderr, "warning: remove LB container: %v (%s)\n", err, strings.TrimSpace(stderr))
		return
	}
	fmt.Println("Removed edge LB container:", LBContainerName)
}

// PreflightLBPort validates the LB host port and ensures it is free before
// minikube starts. Removes a stale mockctl-lb container if it still holds
// the port.
func PreflightLBPort(hostPort string) error {
	hostPort = resolveLBPort(hostPort)
	if err := validateLBPort(hostPort); err != nil {
		return err
	}
	StopLB()
	return checkHostPortFree(hostPort)
}

func resolveLBPort(port string) string {
	if port == "" {
		return DefaultLBPort
	}
	return port
}

// IngressControllerNodePort is the fixed NodePort the edge LB proxies to on
// every node. Install the Ingress Controller Service with this nodePort (port
// 80 → 32080) so the LB works without reconfiguration.
const IngressControllerNodePort = "32080"

// StartLB builds an nginx upstream of every node's InternalIP +
// IngressControllerNodePort and runs a docker container on the minikube profile
// network publishing localhost:<hostPort>.
func StartLB(hostPort string) error {
	hostPort = resolveLBPort(hostPort)

	StopLB()

	kc, err := toolpath.Find("kubectl")
	if err != nil {
		return err
	}
	kubeconfig := kubeconfigPath()
	if kubeconfig == "" {
		return fmt.Errorf("output/kubeconfig.yaml not found — run mockctl up first")
	}

	nodePort := IngressControllerNodePort
	fmt.Printf("LB upstream NodePort: %s (install Ingress Controller Service :80 → nodePort %s)\n", nodePort, nodePort)
	tryPatchIngressControllerNodePort(kc, kubeconfig, nodePort)

	ips, err := nodeInternalIPs(kc, kubeconfig)
	if err != nil {
		return err
	}
	if len(ips) == 0 {
		return fmt.Errorf("no node InternalIPs found")
	}

	network, err := dockerNetworkForProfile(ProfileName())
	if err != nil {
		return err
	}

	confPath, err := writeLBNginxConf(ips, nodePort)
	if err != nil {
		return err
	}

	// Mount the host config into the container. On Windows Docker Desktop
	// accepts absolute Windows paths for -v.
	absConf, err := filepath.Abs(confPath)
	if err != nil {
		return err
	}

	fmt.Printf("LB upstreams: %s (NodePort %s) on network %q\n", strings.Join(ips, ", "), nodePort, network)
	if err := checkHostPortFree(hostPort); err != nil {
		return fmt.Errorf("LB port became unavailable while the cluster was starting: %w", err)
	}
	_, stderr, err := procutil.RunCapture(nil, "docker", "run", "-d",
		"--name", LBContainerName,
		"--restart", "unless-stopped",
		"--network", network,
		"-p", hostPort+":80",
		"-v", absConf+":/etc/nginx/nginx.conf:ro",
		"nginx:1.27-alpine",
	)
	if err != nil {
		return fmt.Errorf("docker run %s: %v: %s", LBContainerName, err, strings.TrimSpace(stderr))
	}

	if err := verifyLBPortPublished(hostPort); err != nil {
		StopLB()
		return err
	}

	fmt.Println()
	fmt.Println("Edge LB ready: http://localhost:" + hostPort + "/")
	fmt.Println("  (proxies to nodeIP:" + nodePort + " — HTTP 502 until Ingress Controller listens there)")
	return nil
}

func validateLBPort(port string) error {
	n, err := strconv.Atoi(port)
	if err != nil || n < 1 || n > 65535 {
		return fmt.Errorf("invalid LB port %q (want 1-65535)", port)
	}
	return nil
}

func checkHostPortFree(port string) error {
	for _, addr := range []string{"127.0.0.1:" + port, "0.0.0.0:" + port} {
		ln, err := net.Listen("tcp", addr)
		if err != nil {
			return fmt.Errorf("host port %s is already in use on %s (%v)\n"+
				"Hint: another app may own :%s (e.g. Cursor, Kafka UI, nginx lab). "+
				"Free the port or run: mockctl up --lb --lb-port 18080",
				port, strings.Split(addr, ":")[0], err, port)
		}
		ln.Close()
	}
	return nil
}

func verifyLBPortPublished(hostPort string) error {
	stdout, stderr, err := procutil.RunCapture(nil, "docker", "port", LBContainerName, "80")
	if err != nil {
		return fmt.Errorf("verify LB port publish: %v: %s", err, strings.TrimSpace(stderr))
	}
	mapping := strings.TrimSpace(stdout)
	if mapping == "" || !strings.Contains(mapping, ":"+hostPort) {
		return fmt.Errorf("LB container started but host port %s was not published (docker port: %q)\n"+
			"Hint: port %s is likely taken — try: mockctl up --lb --lb-port 18080",
			hostPort, mapping, hostPort)
	}
	return nil
}

// PrintLBStatus reports whether the edge LB container is running and its port.
func PrintLBStatus() {
	stdout, _, err := procutil.RunCapture(nil, "docker", "inspect",
		"-f", "{{.State.Running}} {{range $p, $conf := .NetworkSettings.Ports}}{{if $conf}}{{(index $conf 0).HostPort}}{{end}}{{end}}",
		LBContainerName,
	)
	if err != nil {
		fmt.Println("\nEdge LB: not running")
		return
	}
	fields := strings.Fields(stdout)
	if len(fields) < 1 || fields[0] != "true" {
		fmt.Println("\nEdge LB: container exists but not running")
		return
	}
	port := DefaultLBPort
	if len(fields) >= 2 && fields[1] != "" {
		port = fields[1]
	} else {
		fmt.Printf("\nEdge LB: running but host port not published (wanted http://localhost:%s/)\n", DefaultLBPort)
		fmt.Println("  Hint: port conflict — recreate with: mockctl down && mockctl up --lb --lb-port 18080")
		return
	}
	fmt.Printf("\nEdge LB: http://localhost:%s/ (container %s)\n", port, LBContainerName)
}

func kubeconfigPath() string {
	out, err := OutputDir()
	if err != nil {
		return ""
	}
	p := filepath.Join(out, "kubeconfig.yaml")
	if _, err := os.Stat(p); err != nil {
		return ""
	}
	return p
}

func kubectl(kc, kubeconfig string, args ...string) (string, string, error) {
	full := append([]string{"--kubeconfig", kubeconfig}, args...)
	return procutil.RunCapture(nil, kc, full...)
}

// tryPatchIngressControllerNodePort sets ingress-nginx-controller :80 nodePort when
// the Service already exists (e.g. after minikube addons enable ingress).
func tryPatchIngressControllerNodePort(kc, kubeconfig, want string) {
	_, stderr, err := kubectl(kc, kubeconfig,
		"get", "svc", "-n", "ingress-nginx", "ingress-nginx-controller",
	)
	if err != nil {
		return
	}
	_ = stderr
	patch := fmt.Sprintf(`[{"op":"replace","path":"/spec/ports/0/nodePort","value":%s}]`, want)
	_, patchErr, err := kubectl(kc, kubeconfig,
		"patch", "svc", "-n", "ingress-nginx", "ingress-nginx-controller",
		"--type=json", "-p", patch,
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "note: could not patch ingress NodePort to %s: %v %s\n", want, err, strings.TrimSpace(patchErr))
	}
}

func nodeInternalIPs(kc, kubeconfig string) ([]string, error) {
	stdout, stderr, err := kubectl(kc, kubeconfig,
		"get", "nodes",
		"-o", `jsonpath={range .items[*]}{.status.addresses[?(@.type=="InternalIP")].address}{"\n"}{end}`,
	)
	if err != nil {
		return nil, fmt.Errorf("get nodes: %v: %s", err, strings.TrimSpace(stderr))
	}
	var ips []string
	for _, line := range strings.Split(stdout, "\n") {
		ip := strings.TrimSpace(line)
		if ip != "" {
			ips = append(ips, ip)
		}
	}
	return ips, nil
}

// dockerNetworkForProfile finds the docker network attached to the profile's
// control-plane container (named like the profile for docker driver).
func dockerNetworkForProfile(profile string) (string, error) {
	stdout, stderr, err := procutil.RunCapture(nil, "docker", "inspect",
		"-f", "{{range $k, $_ := .NetworkSettings.Networks}}{{println $k}}{{end}}",
		profile,
	)
	if err != nil {
		return "", fmt.Errorf("docker inspect %s: %v: %s (is the profile using --driver=docker?)",
			profile, err, strings.TrimSpace(stderr))
	}
	var net string
	for _, line := range strings.Split(stdout, "\n") {
		line = strings.TrimSpace(line)
		if line != "" {
			net = line
			break
		}
	}
	if net == "" {
		return "", fmt.Errorf("no docker network on container %q", profile)
	}
	return net, nil
}

func writeLBNginxConf(ips []string, nodePort string) (string, error) {
	out, err := OutputDir()
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(out, 0o755); err != nil {
		return "", err
	}

	var b strings.Builder
	b.WriteString("worker_processes 1;\n")
	b.WriteString("events { worker_connections 1024; }\n")
	b.WriteString("http {\n")
	b.WriteString("  upstream ingress_nodes {\n")
	for _, ip := range ips {
		fmt.Fprintf(&b, "    server %s:%s max_fails=3 fail_timeout=10s;\n", ip, nodePort)
	}
	b.WriteString("  }\n")
	b.WriteString("  server {\n")
	b.WriteString("    listen 80;\n")
	b.WriteString("    location / {\n")
	b.WriteString("      proxy_http_version 1.1;\n")
	b.WriteString("      proxy_set_header Host $host;\n")
	b.WriteString("      proxy_set_header X-Real-IP $remote_addr;\n")
	b.WriteString("      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n")
	b.WriteString("      proxy_set_header X-Forwarded-Proto $scheme;\n")
	b.WriteString("      proxy_pass http://ingress_nodes;\n")
	b.WriteString("    }\n")
	b.WriteString("  }\n")
	b.WriteString("}\n")

	path := filepath.Join(out, "lb-nginx.conf")
	if err := os.WriteFile(path, []byte(b.String()), 0o644); err != nil {
		return "", err
	}
	return path, nil
}
