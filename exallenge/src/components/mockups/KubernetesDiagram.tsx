"use client";

import { motion } from "framer-motion";

type PodStatus = "healthy" | "pending" | "new";

type PodNodeProps = {
  label: string;
  status?: PodStatus;
  delay?: number;
};

const statusStyles: Record<PodStatus, string> = {
  healthy: "border-success/60 shadow-[0_0_20px_rgba(34,197,94,0.25)]",
  pending: "border-muted/40 shadow-none",
  new: "border-secondary/70 shadow-[0_0_20px_rgba(99,230,255,0.3)]",
};

export function PodNode({ label, status = "healthy", delay = 0 }: PodNodeProps) {
  return (
    <motion.div
      className={`flex h-16 w-[4.5rem] flex-col items-center justify-center rounded-xl border bg-[#0B1020]/90 sm:h-[4.5rem] sm:w-20 ${statusStyles[status]}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <span
        className={`mb-1 h-1.5 w-1.5 rounded-full ${
          status === "healthy"
            ? "bg-success"
            : status === "new"
              ? "bg-secondary"
              : "bg-muted"
        }`}
      />
      <span className="font-mono text-[10px] text-foreground/90 sm:text-[11px]">
        {label}
      </span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wider text-muted">
        pod
      </span>
    </motion.div>
  );
}

type KubernetesDiagramProps = {
  compact?: boolean;
  className?: string;
};

export function KubernetesDiagram({
  compact = false,
  className = "",
}: KubernetesDiagramProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-[#0B1020]/70 p-3 sm:p-4 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Cluster
        </span>
        <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] text-success">
          Desired state
        </span>
      </div>

      <div
        className={`relative flex flex-col items-center ${compact ? "gap-3" : "gap-4"}`}
      >
        <motion.div
          className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary"
          animate={{ boxShadow: ["0 0 0 rgba(79,156,249,0)", "0 0 24px rgba(79,156,249,0.35)", "0 0 0 rgba(79,156,249,0)"] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          Service / Load Balancer
        </motion.div>

        <div className="relative h-8 w-px overflow-hidden bg-white/10">
          <motion.span
            className="absolute inset-x-0 h-3 bg-gradient-to-b from-transparent via-secondary to-transparent"
            animate={{ y: [-12, 32] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted">
            ReplicaSet · replicas: 3
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <PodNode label="web-1" delay={0.1} />
            <PodNode label="web-2" delay={0.25} />
            <PodNode label="web-3" status="new" delay={0.4} />
          </div>
        </div>

        {!compact ? (
          <div className="mt-1 flex w-full gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1 flex-1 rounded-full bg-secondary/30"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{
                  duration: 1.6,
                  delay: i * 0.25,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
