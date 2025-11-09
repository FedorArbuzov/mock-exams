package scenario

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

var (
	clientOnce sync.Once
	clientset  kubernetes.Interface
	clientErr  error
)

func getClientset() (kubernetes.Interface, error) {
	clientOnce.Do(func() {
		cfg, err := loadConfig()
		if err != nil {
			clientErr = err
			return
		}
		cs, err := kubernetes.NewForConfig(cfg)
		if err != nil {
			clientErr = fmt.Errorf("create kubernetes client: %w", err)
			return
		}
		clientset = cs
	})
	return clientset, clientErr
}

func loadConfig() (*rest.Config, error) {
	// Try in-cluster config first.
	if cfg, err := rest.InClusterConfig(); err == nil {
		return ensureReachableHost(cfg)
	}

	if cfg, err := loadConfigFromOutput(); err == nil {
		return ensureReachableHost(cfg)
	}

	kubeconfig := os.Getenv("KUBECONFIG")
	if kubeconfig == "" {
		home := homedir.HomeDir()
		if home == "" {
			return nil, fmt.Errorf("KUBECONFIG not set and home directory not found")
		}
		kubeconfig = filepath.Join(home, ".kube", "config")
	}

	cfg, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("load kubeconfig: %w", err)
	}
	return ensureReachableHost(cfg)
}

func loadConfigFromOutput() (*rest.Config, error) {
	wd, err := os.Getwd()
	if err != nil {
		return nil, fmt.Errorf("determine working directory: %w", err)
	}

	dir := wd
	for {
		candidate := filepath.Join(dir, "output", "kubeconfig.yaml")
		info, statErr := os.Stat(candidate)
		if statErr == nil && !info.IsDir() {
			cfg, cfgErr := clientcmd.BuildConfigFromFlags("", candidate)
			if cfgErr != nil {
				return nil, fmt.Errorf("load kubeconfig from %s: %w", candidate, cfgErr)
			}
			return cfg, nil
		}
		if statErr != nil && !errors.Is(statErr, os.ErrNotExist) {
			return nil, fmt.Errorf("check kubeconfig at %s: %w", candidate, statErr)
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return nil, fmt.Errorf("kubeconfig not found in output directory")
}

func ensureReachableHost(cfg *rest.Config) (*rest.Config, error) {
	if cfg == nil {
		return nil, errors.New("nil kubeconfig")
	}

	if override := strings.TrimSpace(os.Getenv("K8S_API_ENDPOINT")); override != "" {
		if !strings.HasPrefix(override, "http://") && !strings.HasPrefix(override, "https://") {
			override = "https://" + override
		}
		cfg.Host = override
		return cfg, nil
	}

	u, err := url.Parse(cfg.Host)
	if err != nil {
		return nil, fmt.Errorf("parse kubeconfig host %q: %w", cfg.Host, err)
	}

	host := u.Hostname()
	if host == "127.0.0.1" || host == "localhost" || strings.HasPrefix(host, "0.0.0.0") {
		port := u.Port()
		if port == "" {
			port = "6443"
		}
		u.Host = net.JoinHostPort("k3s-server", port)
		cfg.Host = u.String()
		if cfg.TLSClientConfig.ServerName == "" {
			cfg.TLSClientConfig.ServerName = "localhost"
		}
	}

	return cfg, nil
}

func ensureNamespace(ctx context.Context, client kubernetes.Interface, name string) error {
	_, err := client.CoreV1().Namespaces().Get(ctx, name, metav1.GetOptions{})
	if apierrors.IsNotFound(err) {
		_, createErr := client.CoreV1().Namespaces().Create(
			ctx,
			&corev1.Namespace{
				ObjectMeta: metav1.ObjectMeta{Name: name},
			},
			metav1.CreateOptions{},
		)
		return createErr
	}
	return err
}

func deleteNamespace(ctx context.Context, client kubernetes.Interface, name string) error {
	err := client.CoreV1().Namespaces().Delete(ctx, name, metav1.DeleteOptions{})
	if apierrors.IsNotFound(err) {
		return nil
	}
	return err
}

func deletePod(ctx context.Context, client kubernetes.Interface, namespace, name string) error {
	err := client.CoreV1().Pods(namespace).Delete(ctx, name, metav1.DeleteOptions{})
	if apierrors.IsNotFound(err) {
		return nil
	}
	return err
}

func deleteReplicaSet(ctx context.Context, client kubernetes.Interface, namespace, name string) error {
	propagation := metav1.DeletePropagationForeground
	err := client.AppsV1().ReplicaSets(namespace).Delete(ctx, name, metav1.DeleteOptions{
		PropagationPolicy: &propagation,
	})
	if apierrors.IsNotFound(err) {
		return nil
	}
	return err
}

func deleteDeployment(ctx context.Context, client kubernetes.Interface, namespace, name string) error {
	propagation := metav1.DeletePropagationForeground
	grace := int64(0)
	err := client.AppsV1().Deployments(namespace).Delete(ctx, name, metav1.DeleteOptions{
		PropagationPolicy:  &propagation,
		GracePeriodSeconds: &grace,
	})
	if apierrors.IsNotFound(err) {
		return nil
	}
	return err
}

