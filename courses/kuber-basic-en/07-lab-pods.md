# 7. Lab: Pods

The goal: create, watch, and delete a Pod, and get comfortable reading its state.

> Before starting: your cluster is running (`scripts\minikube-up.cmd` or `./scripts/minikube-up.sh`), and `kubectl get nodes` shows `Ready`.

## Task 1. Run a bare Pod

1. Create a Pod running `nginx:1.27` with `kubectl run`.
2. Check its status and cluster-internal IP (`-o wide`).
3. Get a shell inside and confirm nginx is actually serving something:
   ```bash
   kubectl exec -it <pod> -- curl -s localhost:80 | head -n 5
   ```

**Check:** `kubectl get pods` shows `Running`, `READY 1/1`.

## Task 2. Look at events and logs

1. Get the full description of the Pod (`describe`).
2. Find the **Events** section in the output — what happened while it was starting up.
3. Check the container's logs (`logs`).

**Check:** the logs contain nginx access/error lines.

## Task 3. Create a Pod from YAML

Write a `pod.yaml` file:

- `kind: Pod`, name `web`, label `app=web`.
- One container, `nginx:1.27`, port 80.
- Environment variable `GREETING=hello`.
- `requests`: CPU `50m`, memory `64Mi`.

Apply it and verify:

```bash
kubectl apply -f pod.yaml
kubectl get pods --show-labels
kubectl exec web -- printenv GREETING
```

**Check:** the Pod is `Running`, the label shows up, and the variable equals `hello`.

## Task 4. Break it, then fix it

1. In `pod.yaml`, set the image to something that clearly doesn't exist, e.g. `nginx:does-not-exist`.
2. Apply it under a different Pod name, say `web-bad`.
3. Find the root cause in `kubectl describe pod web-bad`.
4. Fix the image and apply again.

**Check:** `describe` shows `ImagePullBackOff` / `ErrImagePull` before the fix, and `Running` after.

## Task 5. A Pod with two containers

Build a Pod with two containers:

- `web` — `nginx:1.27`.
- `pinger` — `busybox:1.36`, running `["sh","-c","while true; do wget -qO- localhost:80 >/dev/null && echo ok; sleep 5; done"]`.

Confirm `pinger` can see `web` over `localhost`:

```bash
kubectl logs <pod> -c pinger
```

**Check:** the `pinger` logs show a stream of `ok` lines.

## Cleanup

```bash
kubectl delete pod web web-bad <multi-container-pod-name> --ignore-not-found
# or
kubectl delete -f pod.yaml
```

## Check yourself

1. What happens to a Pod if the node it lives on gets killed? (Hint: nothing good — see the next section on ReplicaSet.)
2. Why do two containers in the same Pod share `localhost`, but two different Pods don't?
3. How is `kubectl logs` different from `kubectl exec ... cat /var/log/...`?
