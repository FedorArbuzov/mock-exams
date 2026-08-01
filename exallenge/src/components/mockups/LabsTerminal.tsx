"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PodNode } from "@/components/mockups/KubernetesDiagram";

const steps = [
  {
    command: "kubectl get pods",
    output: [
      "NAME     READY   STATUS    RESTARTS   AGE",
      "web-1    1/1     Running   0          2m",
      "web-2    1/1     Running   0          2m",
      "web-3    0/1     Pending   0          5s",
    ],
    pods: [
      { label: "web-1", status: "healthy" as const },
      { label: "web-2", status: "healthy" as const },
      { label: "web-3", status: "pending" as const },
    ],
  },
  {
    command: "kubectl scale deploy/web --replicas=3",
    output: [
      "deployment.apps/web scaled",
      "",
      "Waiting for rollout to finish...",
      "3 of 3 updated replicas available",
    ],
    pods: [
      { label: "web-1", status: "healthy" as const },
      { label: "web-2", status: "healthy" as const },
      { label: "web-3", status: "new" as const },
    ],
  },
  {
    command: "kubectl get pods -o wide",
    output: [
      "NAME     READY   STATUS    NODE",
      "web-1    1/1     Running   node-a",
      "web-2    1/1     Running   node-b",
      "web-3    1/1     Running   node-a",
    ],
    pods: [
      { label: "web-1", status: "healthy" as const },
      { label: "web-2", status: "healthy" as const },
      { label: "web-3", status: "healthy" as const },
    ],
  },
];

export function LabsTerminal() {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const step = steps[index];

  useEffect(() => {
    setTyped("");
    let i = 0;
    const command = step.command;
    const typing = window.setInterval(() => {
      i += 1;
      setTyped(command.slice(0, i));
      if (i >= command.length) window.clearInterval(typing);
    }, 36);
    return () => window.clearInterval(typing);
  }, [index, step.command]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % steps.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-[#0D1117] glow-ring">
        <div className="flex items-center gap-2 border-b border-white/5 bg-[#161B22] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 font-mono text-xs text-muted">
            lab · kubernetes-basics — zsh
          </span>
        </div>
        <div className="min-h-[280px] p-4 font-mono text-[12px] leading-6 sm:p-5 sm:text-[13px]">
          <div className="text-muted">~/labs/kubernetes</div>
          <div className="mt-3 flex gap-2">
            <span className="text-success">❯</span>
            <span className="text-foreground">
              {typed}
              <motion.span
                aria-hidden
                className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-secondary align-middle"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </span>
          </div>

          <AnimatePresence mode="wait">
            {typed === step.command ? (
              <motion.pre
                key={step.command}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 whitespace-pre-wrap text-muted"
              >
                {step.output.join("\n")}
              </motion.pre>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 glow-ring sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              Cluster status
            </p>
            <p className="mt-1 text-sm text-muted">
              Updates as you run commands
            </p>
          </div>
          <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] text-primary">
            synced
          </span>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B1020]/80 p-5">
          <p className="mb-4 text-[10px] uppercase tracking-wider text-muted">
            Cluster view
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <AnimatePresence mode="popLayout">
              {step.pods.map((pod) => (
                <motion.div
                  key={`${index}-${pod.label}-${pod.status}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <PodNode label={pod.label} status={pod.status} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
