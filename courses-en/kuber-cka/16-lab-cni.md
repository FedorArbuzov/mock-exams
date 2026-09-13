# 16. Lab: validate CNI

Calico must schedule Pods onto every node and pass Pod-to-Pod traffic.

## Task

Confirm:

- Calico (or the CNI you set in inventory) has Running Pods / a Ready DaemonSet
- all three nodes are **Ready**
- two Pods on **different** nodes can reach each other (you choose the probe)

**Check** requires three Ready nodes and a healthy CNI DaemonSet/Pods.

Next: [17. Validate CoreDNS](17-lab-coredns.md).
