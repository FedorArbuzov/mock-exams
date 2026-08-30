// Package lab implements the interactive lab lifecycle used by `mockctl web`:
// setup (prepare the cluster for a task), check (validate the student's work
// against a live cluster and return a verdict), and cleanup (remove the
// lab's resources — the cluster itself is left running).
//
// A lab is described declaratively by a sidecar JSON file next to the lesson
// markdown: e.g. courses-en/kuber-basic/07-lab-pods.md is paired with
// 07-lab-pods.lab.json. That keeps labs authorable as data, so new ones need
// no recompiled binary and are embedded alongside the course content.
//
// The engine talks to the cluster via kubectl, or to LocalStack via the AWS
// CLI (endpoint from MOCKCTL_AWS_ENDPOINT / Definition.awsEndpoint).
package lab

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"sync"

	"mockctl/internal/procutil"
	"mockctl/internal/toolpath"
)

// Op is a single setup/cleanup action against the cluster.
type Op struct {
	// Op is one of: "apply", "delete", "ensureNamespace", "deleteNamespace",
	// "awsDelete" (Backend aws: remove table/bucket/lambda by Kind+Name).
	Op string `json:"op"`
	// Kind/Name/Namespace target a resource for "delete".
	Kind      string `json:"kind,omitempty"`
	Name      string `json:"name,omitempty"`
	Namespace string `json:"namespace,omitempty"`
	// Manifest is an fs path (relative to the courses root) to a YAML file
	// applied with `kubectl apply -f -` for the "apply" op.
	Manifest string `json:"manifest,omitempty"`
}

// Check is a single declarative assertion about cluster or AWS (LocalStack) state.
type Check struct {
	// Type is one of: exists, running, image, replicas, ready, label, env,
	// hasKey (data key present, optional value), selector (spec.selector
	// key=value), endpoints (>= Value ready addresses), annotation
	// (metadata.annotations key=value).
	//
	// When Definition.Backend is "aws", Kind is one of: s3-bucket, s3-object,
	// dynamodb-table, lambda-function, iam-role; Name is the resource id; Key is the S3
	// object key for s3-object; Value is optional expected state (e.g. ACTIVE).
	Type      string `json:"type"`
	Kind      string `json:"kind"`
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
	// Key is the label/env-var name for the "label"/"env" checks.
	Key string `json:"key,omitempty"`
	// Value is the expected value (label/env/image) or count (replicas/ready).
	Value string `json:"value,omitempty"`
	// Desc is a human-readable label shown in the verdict.
	Desc string `json:"desc,omitempty"`
}

// Definition is the full declarative spec for one lab.
type Definition struct {
	ID      string  `json:"id"`
	Title   string  `json:"title"`
	// Backend is "kubernetes" (default) or "aws" (LocalStack via AWS CLI).
	Backend string `json:"backend,omitempty"`
	// AWSEndpoint overrides the default LocalStack URL (see awsEndpoint()).
	AWSEndpoint string `json:"awsEndpoint,omitempty"`
	// AWSRegion defaults to us-east-1.
	AWSRegion string `json:"awsRegion,omitempty"`
	Setup   []Op    `json:"setup"`
	Checks  []Check `json:"checks"`
	Cleanup []Op    `json:"cleanup"`
}

// Result is the outcome of a single check, mirrored 1:1 into the JSON API.
type Result struct {
	Name    string `json:"name"`
	Passed  bool   `json:"passed"`
	Message string `json:"message"`
}

// Engine loads lab definitions from an fs.FS (the same content source the
// webui serves) and runs them against the cluster.
type Engine struct {
	fsys fs.FS

	once        sync.Once
	kubeconfig  string
	awsOnce     sync.Once
	awsEndpoint string
}

// NewEngine builds an engine over the given content filesystem.
func NewEngine(fsys fs.FS) *Engine {
	return &Engine{fsys: fsys}
}

// defPath maps a lesson path ("kuber-basic/07-lab-pods.md" or the same
// without extension) to its sidecar definition path.
func defPath(lessonPath string) string {
	p := strings.TrimSuffix(lessonPath, ".md")
	return p + ".lab.json"
}

// HasLab reports whether the given lesson path has a lab definition.
func (e *Engine) HasLab(lessonPath string) bool {
	if !fs.ValidPath(defPath(lessonPath)) {
		return false
	}
	_, err := fs.Stat(e.fsys, defPath(lessonPath))
	return err == nil
}

// Load parses the lab definition paired with the given lesson path.
func (e *Engine) Load(lessonPath string) (*Definition, error) {
	p := defPath(lessonPath)
	if !fs.ValidPath(p) {
		return nil, fmt.Errorf("invalid lab path %q", lessonPath)
	}
	raw, err := fs.ReadFile(e.fsys, p)
	if err != nil {
		return nil, fmt.Errorf("no lab definition for %q: %w", lessonPath, err)
	}
	var def Definition
	if err := json.Unmarshal(raw, &def); err != nil {
		return nil, fmt.Errorf("parse %s: %w", p, err)
	}
	return &def, nil
}

// Start runs the lab's setup ops (create namespaces, clear or seed
// resources) so the student begins from a known state.
func (e *Engine) Start(def *Definition) error {
	for _, op := range def.Setup {
		if err := e.runOp(op); err != nil {
			return err
		}
	}
	return nil
}

// Cleanup runs the lab's cleanup ops. Only the lab's own resources are
// removed — the cluster keeps running for the next lab.
func (e *Engine) Cleanup(def *Definition) error {
	for _, op := range def.Cleanup {
		if err := e.runOp(op); err != nil {
			return err
		}
	}
	return nil
}

// Check evaluates every assertion and returns per-check results plus whether
// all of them passed.
func (e *Engine) Check(def *Definition) ([]Result, bool, error) {
	results := make([]Result, 0, len(def.Checks))
	allPassed := true
	for _, c := range def.Checks {
		var res Result
		var err error
		if strings.EqualFold(def.Backend, "aws") {
			res, err = e.evaluateAWS(def, c)
		} else {
			res, err = e.evaluate(c)
		}
		if err != nil {
			return nil, false, err
		}
		if !res.Passed {
			allPassed = false
		}
		results = append(results, res)
	}
	return results, allPassed, nil
}

func (e *Engine) runOp(op Op) error {
	switch op.Op {
	case "apply":
		data, err := fs.ReadFile(e.fsys, op.Manifest)
		if err != nil {
			return fmt.Errorf("read manifest %q: %w", op.Manifest, err)
		}
		_, stderr, err := e.kubectl(data, "apply", "-f", "-")
		if err != nil {
			return fmt.Errorf("apply %s: %v: %s", op.Manifest, err, strings.TrimSpace(stderr))
		}
		return nil
	case "delete":
		args := []string{"delete", op.Kind, op.Name, "--ignore-not-found"}
		if op.Namespace != "" {
			args = append(args, "-n", op.Namespace)
		}
		_, stderr, err := e.kubectl(nil, args...)
		if err != nil {
			return fmt.Errorf("delete %s/%s: %v: %s", op.Kind, op.Name, err, strings.TrimSpace(stderr))
		}
		return nil
	case "ensureNamespace":
		manifest := []byte("apiVersion: v1\nkind: Namespace\nmetadata:\n  name: " + op.Name + "\n")
		_, stderr, err := e.kubectl(manifest, "apply", "-f", "-")
		if err != nil {
			return fmt.Errorf("ensure namespace %s: %v: %s", op.Name, err, strings.TrimSpace(stderr))
		}
		return nil
	case "deleteNamespace":
		_, stderr, err := e.kubectl(nil, "delete", "namespace", op.Name, "--ignore-not-found")
		if err != nil {
			return fmt.Errorf("delete namespace %s: %v: %s", op.Name, err, strings.TrimSpace(stderr))
		}
		return nil
	case "awsDelete":
		return e.awsDelete(op)
	default:
		return fmt.Errorf("unknown setup/cleanup op %q", op.Op)
	}
}

// evaluate resolves the target resource once, then applies the assertion.
func (e *Engine) evaluate(c Check) (Result, error) {
	label := c.Desc
	if label == "" {
		label = fmt.Sprintf("%s: %s/%s", c.Type, c.Kind, c.Name)
	}

	obj, found, err := e.getResource(c.Kind, c.Namespace, c.Name)
	if err != nil {
		return Result{}, err
	}
	if !found {
		msg := fmt.Sprintf("%s %q not found", c.Kind, c.Name)
		if c.Namespace != "" {
			msg += " in namespace " + c.Namespace
		}
		return Result{Name: label, Passed: false, Message: msg}, nil
	}

	switch c.Type {
	case "exists":
		return Result{Name: label, Passed: true, Message: "found"}, nil
	case "running":
		phase := getString(obj, "status", "phase")
		return boolResult(label, phase == "Running", fmt.Sprintf("phase=%s", phase)), nil
	case "image":
		for _, ctr := range containersOf(obj) {
			if getString(ctr, "image") == c.Value {
				return boolResult(label, true, "uses "+c.Value), nil
			}
		}
		return boolResult(label, false, "no container uses "+c.Value), nil
	case "replicas":
		want, _ := strconv.Atoi(c.Value)
		got := int(getFloat(obj, "spec", "replicas"))
		return boolResult(label, got == want, fmt.Sprintf("spec.replicas=%d (want %d)", got, want)), nil
	case "ready":
		want, _ := strconv.Atoi(c.Value)
		got := int(getFloat(obj, "status", "readyReplicas"))
		return boolResult(label, got >= want, fmt.Sprintf("%d/%d ready", got, want)), nil
	case "label":
		if labels, ok := getMap(obj, "metadata", "labels"); ok {
			if v, ok := labels[c.Key].(string); ok && v == c.Value {
				return boolResult(label, true, fmt.Sprintf("%s=%s", c.Key, v)), nil
			}
		}
		if labels, ok := getMap(obj, "spec", "template", "metadata", "labels"); ok {
			if v, ok := labels[c.Key].(string); ok && v == c.Value {
				return boolResult(label, true, fmt.Sprintf("pod template %s=%s", c.Key, v)), nil
			}
		}
		return boolResult(label, false, fmt.Sprintf("label %s=%s not set", c.Key, c.Value)), nil
	case "annotation":
		if anns, ok := getMap(obj, "metadata", "annotations"); ok {
			if v, ok := anns[c.Key].(string); ok && v == c.Value {
				return boolResult(label, true, fmt.Sprintf("%s=%s", c.Key, v)), nil
			}
		}
		// Deployments/StatefulSets: Agent Injector annotations live on the Pod template.
		if anns, ok := getMap(obj, "spec", "template", "metadata", "annotations"); ok {
			if v, ok := anns[c.Key].(string); ok && v == c.Value {
				return boolResult(label, true, fmt.Sprintf("pod template %s=%s", c.Key, v)), nil
			}
		}
		return boolResult(label, false, fmt.Sprintf("annotation %s=%s not set", c.Key, c.Value)), nil
	case "env":
		for _, ctr := range containersOf(obj) {
			for _, ev := range getSlice(ctr, "env") {
				m, ok := ev.(map[string]any)
				if !ok {
					continue
				}
				if m["name"] == c.Key {
					if v, _ := m["value"].(string); v == c.Value {
						return boolResult(label, true, fmt.Sprintf("%s=%s", c.Key, v)), nil
					}
				}
			}
		}
		return boolResult(label, false, fmt.Sprintf("env %s=%s not set", c.Key, c.Value)), nil
	case "hasKey":
		if data, ok := getMap(obj, "data"); ok {
			if raw, present := data[c.Key]; present {
				if c.Value == "" {
					return boolResult(label, true, "key "+c.Key+" present"), nil
				}
				if v, _ := raw.(string); v == c.Value {
					return boolResult(label, true, fmt.Sprintf("%s=%s", c.Key, v)), nil
				}
				return boolResult(label, false, fmt.Sprintf("key %s has a different value", c.Key)), nil
			}
		}
		return boolResult(label, false, "no key "+c.Key+" under data"), nil
	case "selector":
		if sel, ok := getMap(obj, "spec", "selector"); ok {
			if v, _ := sel[c.Key].(string); v == c.Value {
				return boolResult(label, true, fmt.Sprintf("selector %s=%s", c.Key, v)), nil
			}
		}
		return boolResult(label, false, fmt.Sprintf("selector %s=%s not set", c.Key, c.Value)), nil
	case "endpoints":
		want := 1
		if c.Value != "" {
			want, _ = strconv.Atoi(c.Value)
		}
		count := 0
		for _, ss := range getSlice(obj, "subsets") {
			m, ok := ss.(map[string]any)
			if !ok {
				continue
			}
			if addrs, ok := m["addresses"].([]any); ok {
				count += len(addrs)
			}
		}
		return boolResult(label, count >= want, fmt.Sprintf("%d endpoint address(es), want >= %d", count, want)), nil
	default:
		return Result{Name: label, Passed: false, Message: "unknown check type " + c.Type}, nil
	}
}

func (e *Engine) evaluateAWS(def *Definition, c Check) (Result, error) {
	label := c.Desc
	if label == "" {
		label = fmt.Sprintf("%s: %s/%s", c.Type, c.Kind, c.Name)
	}
	if c.Type != "exists" {
		return Result{Name: label, Passed: false, Message: "aws backend supports type exists only (for now)"}, nil
	}

	switch c.Kind {
	case "dynamodb-table":
		stdout, stderr, err := e.awsCLI(def, "dynamodb", "describe-table", "--table-name", c.Name)
		if err != nil {
			if strings.Contains(stderr, "ResourceNotFoundException") || strings.Contains(stderr, "not found") {
				return Result{Name: label, Passed: false, Message: "table " + c.Name + " not found"}, nil
			}
			return Result{}, fmt.Errorf("dynamodb describe-table: %v: %s", err, strings.TrimSpace(stderr))
		}
		var out struct {
			Table struct {
				TableStatus string `json:"TableStatus"`
			} `json:"Table"`
		}
		if err := json.Unmarshal([]byte(stdout), &out); err != nil {
			return Result{}, err
		}
		status := out.Table.TableStatus
		want := c.Value
		if want == "" {
			want = "ACTIVE"
		}
		return boolResult(label, status == want, fmt.Sprintf("TableStatus=%s (want %s)", status, want)), nil

	case "s3-bucket":
		_, stderr, err := e.awsCLI(def, "s3api", "head-bucket", "--bucket", c.Name)
		if err != nil {
			if strings.Contains(stderr, "404") || strings.Contains(stderr, "Not Found") || strings.Contains(stderr, "NoSuchBucket") {
				return Result{Name: label, Passed: false, Message: "bucket " + c.Name + " not found"}, nil
			}
			return Result{}, fmt.Errorf("s3 head-bucket: %v: %s", err, strings.TrimSpace(stderr))
		}
		return Result{Name: label, Passed: true, Message: "bucket exists"}, nil

	case "s3-object":
		if c.Key == "" {
			return Result{Name: label, Passed: false, Message: "s3-object check needs key"}, nil
		}
		_, stderr, err := e.awsCLI(def, "s3api", "head-object", "--bucket", c.Name, "--key", c.Key)
		if err != nil {
			if strings.Contains(stderr, "404") || strings.Contains(stderr, "Not Found") || strings.Contains(stderr, "NoSuchKey") {
				return Result{Name: label, Passed: false, Message: fmt.Sprintf("s3://%s/%s not found", c.Name, c.Key)}, nil
			}
			return Result{}, fmt.Errorf("s3 head-object: %v: %s", err, strings.TrimSpace(stderr))
		}
		return Result{Name: label, Passed: true, Message: fmt.Sprintf("s3://%s/%s exists", c.Name, c.Key)}, nil

	case "lambda-function":
		stdout, stderr, err := e.awsCLI(def, "lambda", "get-function", "--function-name", c.Name)
		if err != nil {
			if strings.Contains(stderr, "ResourceNotFoundException") || strings.Contains(stderr, "not found") {
				return Result{Name: label, Passed: false, Message: "function " + c.Name + " not found"}, nil
			}
			return Result{}, fmt.Errorf("lambda get-function: %v: %s", err, strings.TrimSpace(stderr))
		}
		var out struct {
			Configuration struct {
				State string `json:"State"`
			} `json:"Configuration"`
		}
		if err := json.Unmarshal([]byte(stdout), &out); err != nil {
			return Result{}, err
		}
		state := out.Configuration.State
		want := c.Value
		if want == "" {
			want = "Active"
		}
		return boolResult(label, state == want, fmt.Sprintf("State=%s (want %s)", state, want)), nil

	case "iam-role":
		_, stderr, err := e.awsCLI(def, "iam", "get-role", "--role-name", c.Name)
		if err != nil {
			if strings.Contains(stderr, "NoSuchEntity") || strings.Contains(stderr, "not found") {
				return Result{Name: label, Passed: false, Message: "role " + c.Name + " not found"}, nil
			}
			return Result{}, fmt.Errorf("iam get-role: %v: %s", err, strings.TrimSpace(stderr))
		}
		return Result{Name: label, Passed: true, Message: "role exists"}, nil

	case "secretsmanager-secret":
		_, stderr, err := e.awsCLI(def, "secretsmanager", "describe-secret", "--secret-id", c.Name)
		if err != nil {
			if strings.Contains(stderr, "ResourceNotFoundException") || strings.Contains(stderr, "not found") {
				return Result{Name: label, Passed: false, Message: "secret " + c.Name + " not found"}, nil
			}
			return Result{}, fmt.Errorf("secretsmanager describe-secret: %v: %s", err, strings.TrimSpace(stderr))
		}
		return Result{Name: label, Passed: true, Message: "secret exists"}, nil

	default:
		return Result{Name: label, Passed: false, Message: "unknown aws kind " + c.Kind}, nil
	}
}

func (e *Engine) awsDelete(op Op) error {
	def := &Definition{Backend: "aws"}
	switch op.Kind {
	case "dynamodb-table":
		_, stderr, err := e.awsCLI(def, "dynamodb", "delete-table", "--table-name", op.Name)
		if err != nil && !strings.Contains(stderr, "ResourceNotFoundException") {
			return fmt.Errorf("delete dynamodb table %s: %v: %s", op.Name, err, strings.TrimSpace(stderr))
		}
		return nil
	case "lambda-function":
		_, stderr, err := e.awsCLI(def, "lambda", "delete-function", "--function-name", op.Name)
		if err != nil && !strings.Contains(stderr, "ResourceNotFoundException") {
			return fmt.Errorf("delete lambda %s: %v: %s", op.Name, err, strings.TrimSpace(stderr))
		}
		return nil
	case "s3-bucket":
		_, _, _ = e.awsCLI(def, "s3", "rm", "s3://"+op.Name, "--recursive")
		_, stderr, err := e.awsCLI(def, "s3api", "delete-bucket", "--bucket", op.Name)
		if err != nil && !strings.Contains(stderr, "NoSuchBucket") {
			return fmt.Errorf("delete bucket %s: %v: %s", op.Name, err, strings.TrimSpace(stderr))
		}
		return nil
	case "iam-role":
		return e.awsDeleteRole(def, op.Name)
	case "secretsmanager-secret":
		_, stderr, err := e.awsCLI(def, "secretsmanager", "delete-secret", "--secret-id", op.Name, "--force-delete-without-recovery")
		if err != nil && !strings.Contains(stderr, "ResourceNotFoundException") && !strings.Contains(stderr, "not found") {
			return fmt.Errorf("delete secret %s: %v: %s", op.Name, err, strings.TrimSpace(stderr))
		}
		return nil
	default:
		return fmt.Errorf("awsDelete: unknown kind %q", op.Kind)
	}
}

func (e *Engine) awsDeleteRole(def *Definition, name string) error {
	stdout, stderr, err := e.awsCLI(def, "iam", "list-role-policies", "--role-name", name)
	if err != nil {
		if strings.Contains(stderr, "NoSuchEntity") || strings.Contains(stderr, "not found") {
			return nil
		}
		return fmt.Errorf("list-role-policies %s: %v: %s", name, err, strings.TrimSpace(stderr))
	}
	var listed struct {
		PolicyNames []string `json:"PolicyNames"`
	}
	if err := json.Unmarshal([]byte(stdout), &listed); err != nil {
		return fmt.Errorf("parse list-role-policies: %w", err)
	}
	for _, pol := range listed.PolicyNames {
		_, stderr, err := e.awsCLI(def, "iam", "delete-role-policy", "--role-name", name, "--policy-name", pol)
		if err != nil && !strings.Contains(stderr, "NoSuchEntity") {
			return fmt.Errorf("delete-role-policy %s/%s: %v: %s", name, pol, err, strings.TrimSpace(stderr))
		}
	}
	_, stderr, err = e.awsCLI(def, "iam", "delete-role", "--role-name", name)
	if err != nil && !strings.Contains(stderr, "NoSuchEntity") {
		return fmt.Errorf("delete-role %s: %v: %s", name, err, strings.TrimSpace(stderr))
	}
	return nil
}

func (e *Engine) awsCLI(def *Definition, args ...string) (string, string, error) {
	awsBin, err := toolpath.Find("aws")
	if err != nil {
		return "", "", fmt.Errorf("%w. Install AWS CLI v2 and ensure LocalStack is up", err)
	}
	endpoint := e.resolveAWSEndpoint(def)
	region := "us-east-1"
	if def != nil && def.AWSRegion != "" {
		region = def.AWSRegion
	}
	full := append([]string{"--endpoint-url", endpoint, "--region", region}, args...)
	cmd := exec.Command(awsBin, full...)
	cmd.Env = append(os.Environ(),
		"AWS_ACCESS_KEY_ID=test",
		"AWS_SECRET_ACCESS_KEY=test",
		"AWS_DEFAULT_REGION="+region,
	)
	var outBuf, errBuf bytes.Buffer
	cmd.Stdout = &outBuf
	cmd.Stderr = &errBuf
	err = cmd.Run()
	return outBuf.String(), errBuf.String(), err
}

func (e *Engine) resolveAWSEndpoint(def *Definition) string {
	if def != nil && def.AWSEndpoint != "" {
		return def.AWSEndpoint
	}
	if v := os.Getenv("MOCKCTL_AWS_ENDPOINT"); v != "" {
		return v
	}
	e.awsOnce.Do(func() {
		e.awsEndpoint = "http://localhost:4566"
	})
	return e.awsEndpoint
}

func boolResult(name string, passed bool, msg string) Result {
	return Result{Name: name, Passed: passed, Message: msg}
}

// getResource fetches a single object as JSON. A missing object is reported
// as (nil, false, nil) so checks can render a clean "not found".
func (e *Engine) getResource(kind, namespace, name string) (map[string]any, bool, error) {
	args := []string{"get", kind, name, "-o", "json"}
	if namespace != "" {
		args = append(args, "-n", namespace)
	}
	stdout, stderr, err := e.kubectl(nil, args...)
	if err != nil {
		if strings.Contains(stderr, "NotFound") || strings.Contains(stderr, "not found") {
			return nil, false, nil
		}
		return nil, false, fmt.Errorf("kubectl get %s/%s: %v: %s", kind, name, err, strings.TrimSpace(stderr))
	}
	var obj map[string]any
	if err := json.Unmarshal([]byte(stdout), &obj); err != nil {
		return nil, false, fmt.Errorf("parse kubectl json for %s/%s: %w", kind, name, err)
	}
	return obj, true, nil
}

// kubectl shells out to the kubectl binary against the exported kubeconfig.
func (e *Engine) kubectl(stdin []byte, args ...string) (string, string, error) {
	kc, err := toolpath.Find("kubectl")
	if err != nil {
		return "", "", fmt.Errorf("%w. Is the cluster up? Try: mockctl up", err)
	}
	full := args
	if cfg := e.kubeconfigPath(); cfg != "" {
		full = append([]string{"--kubeconfig", cfg}, args...)
	}
	return procutil.RunCapture(stdin, kc, full...)
}

// kubeconfigPath finds ./output/kubeconfig.yaml by walking up from the
// working directory, matching how mockctl exports it. Empty means "let
// kubectl use its default kubeconfig".
func (e *Engine) kubeconfigPath() string {
	e.once.Do(func() {
		wd, err := os.Getwd()
		if err != nil {
			return
		}
		dir := wd
		for {
			candidate := filepath.Join(dir, "output", "kubeconfig.yaml")
			if info, err := os.Stat(candidate); err == nil && !info.IsDir() {
				e.kubeconfig = candidate
				return
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				return
			}
			dir = parent
		}
	})
	return e.kubeconfig
}

// containersOf returns the container list from a Pod (spec.containers) or a
// workload with a pod template (spec.template.spec.containers).
func containersOf(obj map[string]any) []map[string]any {
	if c := getSlice(obj, "spec", "containers"); len(c) > 0 {
		return asMaps(c)
	}
	return asMaps(getSlice(obj, "spec", "template", "spec", "containers"))
}

func asMaps(items []any) []map[string]any {
	out := make([]map[string]any, 0, len(items))
	for _, it := range items {
		if m, ok := it.(map[string]any); ok {
			out = append(out, m)
		}
	}
	return out
}

// getMap walks nested maps by keys, returning the map at the end.
func getMap(obj map[string]any, keys ...string) (map[string]any, bool) {
	cur := obj
	for _, k := range keys {
		next, ok := cur[k].(map[string]any)
		if !ok {
			return nil, false
		}
		cur = next
	}
	return cur, true
}

func getString(obj map[string]any, keys ...string) string {
	if len(keys) == 0 {
		return ""
	}
	parent, ok := getMap(obj, keys[:len(keys)-1]...)
	if !ok {
		return ""
	}
	s, _ := parent[keys[len(keys)-1]].(string)
	return s
}

func getFloat(obj map[string]any, keys ...string) float64 {
	if len(keys) == 0 {
		return 0
	}
	parent, ok := getMap(obj, keys[:len(keys)-1]...)
	if !ok {
		return 0
	}
	f, _ := parent[keys[len(keys)-1]].(float64)
	return f
}

func getSlice(obj map[string]any, keys ...string) []any {
	if len(keys) == 0 {
		return nil
	}
	parent, ok := getMap(obj, keys[:len(keys)-1]...)
	if !ok {
		return nil
	}
	s, _ := parent[keys[len(keys)-1]].([]any)
	return s
}
