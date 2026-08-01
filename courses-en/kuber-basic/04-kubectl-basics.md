# 4. kubectl Basics

`kubectl` is the main tool for talking to a cluster. Under the hood it just sends HTTP requests to **kube-apiserver** and formats the response for you.

## How kubectl finds your cluster

Through a **kubeconfig** file. By default it looks in `~/.kube/config`, but you can point it elsewhere explicitly:

```bash
kubectl --kubeconfig ./output/kubeconfig.yaml get nodes
```

or via an environment variable:

```bash
# bash / zsh
export KUBECONFIG=./output/kubeconfig.yaml

# PowerShell
$env:KUBECONFIG = ".\output\kubeconfig.yaml"
```

A kubeconfig holds three kinds of entries:

- **clusters** — the API address plus certificates.
- **users** — credentials (a token or client certificate).
- **contexts** — a pairing of "cluster + user + default namespace".

```bash
kubectl config view
kubectl config get-contexts
kubectl config use-context mock-exams
kubectl config set-context --current --namespace=dev
```

## The core commands

### Reading things

```bash
kubectl get pods                       # list in the current namespace
kubectl get pods -A                    # across all namespaces
kubectl get pods -n kube-system        # in one specific namespace
kubectl get pods -o wide               # + IP and node
kubectl get pods -l app=web            # filter by label
kubectl get pods --show-labels         # show the labels
kubectl get pods -w                    # watch for changes in real time
```

### Details

```bash
kubectl describe pod <name>            # human-readable summary + Events
kubectl get pod <name> -o yaml         # the object's "live" YAML
kubectl get pod <name> -o json         # same, as JSON
```

### Create / change / delete

```bash
kubectl apply -f file.yaml             # create or update from YAML
kubectl apply -f .                     # every YAML file in a directory
kubectl delete -f file.yaml            # delete using the same manifest
kubectl delete pod <name>              # delete a specific object
kubectl edit deploy/web                # open in an editor, apply on save
```

`apply` is the **declarative** way of working: "make it look like this file." It covers 99% of real-world usage.

> A couple of these examples (`deploy/web`, `-l app=web`) already assume a **Deployment** and **label selectors** — both get their own full lesson later (10 and 8). Don't worry if they feel unfamiliar yet; just note the command shapes for now, you'll be using them constantly once we get there.

### Logs and exec

```bash
kubectl logs <pod>                     # single-container pod
kubectl logs <pod> -c <container>      # multi-container pod
kubectl logs <pod> --previous          # logs from the last crashed container
kubectl logs deploy/web                # logs from any Pod owned by a Deployment
kubectl logs -l app=web --tail=100 -f  # follow, filtered by label

kubectl exec -it <pod> -- sh           # get a shell inside the container
kubectl exec <pod> -- env              # run a command without a TTY
```

### Reaching a Pod without a Service or Ingress

```bash
kubectl port-forward pod/<name> 8080:80
kubectl port-forward svc/web 8080:80
```

Works only while the command is running — great for quick debugging.

### Spinning up a throwaway Pod

```bash
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
```

`--rm` deletes the Pod once you exit, `--restart=Never` keeps it a plain Pod instead of wrapping it in a Deployment.

## A few useful tricks

### Inspecting an object's fields

```bash
kubectl explain pod
kubectl explain pod.spec
kubectl explain pod.spec.containers --recursive
```

### Generating a YAML template

```bash
kubectl run nginx --image=nginx:1.27 --dry-run=client -o yaml > pod.yaml
kubectl create deploy web --image=nginx:1.27 --dry-run=client -o yaml > deploy.yaml
```

`--dry-run=client` means "don't send anything to the cluster, just show me what you would have done."

### Precise output with jsonpath

```bash
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
```

### Short names

| Full name | Short form |
|--------|-----------|
| pods | po |
| services | svc |
| deployments | deploy |
| replicasets | rs |
| namespaces | ns |
| nodes | no |
| configmaps | cm |
| persistentvolumeclaims | pvc |

```bash
kubectl get po,svc,deploy
```

### Every object kind

```bash
kubectl api-resources                  # everything this cluster supports
kubectl api-resources --namespaced=true
```

## Handy flags

- `-n <ns>` / `--namespace=<ns>` — which namespace.
- `-A` / `--all-namespaces` — across all namespaces.
- `-l <label>` — filter by labels (`app=web`, `app!=web`, `tier in (front,back)`).
- `-o yaml | json | wide | jsonpath=...` — output format.
- `--dry-run=client` — don't apply anything, just check.
- `-f <file|dir|->` — where the manifest comes from (`-` means stdin).

## A few tips

- Most of the "magic" of debugging is just `describe` + `events`. If something's broken, start there.
- Add an alias to `~/.bashrc` / your PowerShell `$PROFILE`: `alias k=kubectl` (on Windows in PowerShell: `Set-Alias k kubectl`).
- A plain `kubectl get` in the right namespace gives you the big picture fast; when in doubt, `kubectl get all -n <ns>`.
