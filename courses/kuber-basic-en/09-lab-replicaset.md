# 9. Lab: ReplicaSet

The goal: watch the self-healing "magic" happen, and get a feel for how selector and labels connect.

## Task 1. Create a ReplicaSet

Create a file `rs.yaml`:

- `kind: ReplicaSet`, name `web-rs`.
- `replicas: 3`.
- `selector.matchLabels: { app: web }`.
- `template.metadata.labels: { app: web }`.
- Container: `nginx:1.27`, port 80.

Apply it and check:

```bash
kubectl apply -f rs.yaml
kubectl get rs
kubectl get pods -l app=web
```

**Check:** three Pods, all `Running`.

## Task 2. Self-healing

1. Delete one of the Pods by hand:
   ```bash
   kubectl delete pod <one-of-the-pod-names>
   ```
2. Immediately run `kubectl get pods -l app=web -w`.

**Check:** the RS quickly creates a replacement Pod, and the count is back to `3`.

## Task 3. Scaling

1. Scale up to 5 replicas:
   ```bash
   kubectl scale rs/web-rs --replicas=5
   ```
2. Scale down to 2.
3. Watch how the Pod list changes.

**Check:** the number of `Running` Pods always matches `replicas`.

## Task 4. A stranger with the same labels

1. Create a separate Pod (not owned by the RS) carrying the label `app=web`:
   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: stranger
     labels:
       app: web
   spec:
     containers:
       - name: nginx
         image: nginx:1.27
   ```
2. Apply it, then immediately check `kubectl get pods -l app=web`.

**What happens:** the RS "adopts" this Pod as one of its own, and since the total now exceeds `replicas`, it deletes **one of** the matching Pods — which might well be `stranger` itself.

**Takeaway:** selectors match on labels, full stop. Watch out for labels that overlap between unrelated objects.

## Task 5. Trying to update the image

1. Change the image in `rs.yaml` to `nginx:1.27.1`.
2. `kubectl apply -f rs.yaml`.
3. Check the images on the already-running Pods:
   ```bash
   kubectl get pods -l app=web -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
   ```

**What you'll see:** the ReplicaSet **doesn't touch** the existing Pods. They keep running the old image. To pick up the new one, you'd have to delete the Pods yourself and let the RS recreate them from the updated template.

**Takeaway:** for smooth rollouts you need a **Deployment** — next topic.

## Cleanup

```bash
kubectl delete rs web-rs
kubectl delete pod stranger --ignore-not-found
```

## Check yourself

1. What happens if `selector.matchLabels` and `template.metadata.labels` **don't** match?
2. Can two ReplicaSets have the same selector? What happens if they do?
3. Why is a bare Pod, with no RS or Deployment behind it, a bad idea in production?
