"use client";

import { motion } from "framer-motion";

const sidebarItems = [
  { label: "Lessons", active: true },
  { label: "Roadmap", active: false },
  { label: "Labs", active: false },
  { label: "Interview Qs", active: false },
  { label: "Progress", active: false },
];

const codeLines = [
  { text: "apiVersion: apps/v1", tone: "muted" },
  { text: "kind: Deployment", tone: "keyword" },
  { text: "metadata:", tone: "muted" },
  { text: "  name: web", tone: "value" },
  { text: "spec:", tone: "muted" },
  { text: "  replicas: 3", tone: "accent" },
];

const lessonPoints = [
  "A Deployment manages Pod replicas",
  "Desired state is declared in YAML",
  "Controllers reconcile what you describe",
];

export function HeroAppMockup() {
  return (
    <motion.div
      className="relative animate-float"
      initial={{ opacity: 0, y: 32, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
    >
      <div
        aria-hidden
        className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-primary/20 via-transparent to-secondary/15 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1528]/95 shadow-[0_40px_120px_rgba(0,0,0,0.55)] glow-ring">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-3 font-mono text-[11px] text-muted">
            exallenge.app / kubernetes-fundamentals
          </span>
        </div>

        <div className="grid grid-cols-[88px_1fr] sm:grid-cols-[132px_1fr]">
          <aside className="border-r border-white/5 bg-white/[0.015] p-2 sm:p-3">
            <p className="mb-3 hidden px-2 font-display text-[11px] font-semibold tracking-wide text-foreground/80 sm:block">
              EXALLENGE
            </p>
            <nav className="flex flex-col gap-1" aria-label="App sidebar demo">
              {sidebarItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  className={`rounded-lg px-2 py-2 text-[10px] sm:px-2.5 sm:text-xs ${
                    item.active
                      ? "bg-primary/15 text-primary"
                      : "text-muted"
                  }`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                >
                  {item.label}
                </motion.div>
              ))}
            </nav>

            <div className="mt-4 hidden rounded-xl border border-white/5 p-2.5 sm:block">
              <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted">
                <span>Progress</span>
                <span className="text-success">68%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: "0%" }}
                  animate={{ width: "68%" }}
                  transition={{ delay: 0.8, duration: 1.1, ease: "easeOut" }}
                />
              </div>
            </div>
          </aside>

          <div className="p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-secondary">
                  Current lesson
                </p>
                <h3 className="mt-1 font-display text-sm font-semibold text-foreground sm:text-base">
                  Kubernetes Fundamentals
                </h3>
              </div>
              <span className="rounded-md border border-success/20 bg-success/10 px-2 py-1 text-[10px] text-success">
                68% complete
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-white/[0.02] p-3 sm:p-4">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  Lesson notes
                </p>
                <ul className="mt-3 flex flex-col gap-2.5">
                  {lessonPoints.map((point, i) => (
                    <motion.li
                      key={point}
                      className="flex items-start gap-2 text-[11px] leading-snug text-foreground/90 sm:text-xs"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.08 }}
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                      {point}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-[#070B16] p-3 font-mono text-[10px] leading-relaxed sm:text-[11px]">
                <div className="mb-2 flex items-center justify-between text-muted">
                  <span>deployment.yaml</span>
                  <motion.span
                    className="text-secondary"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  >
                    ● live
                  </motion.span>
                </div>
                {codeLines.map((line, i) => (
                  <motion.div
                    key={line.text}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.08 }}
                    className={
                      line.tone === "keyword"
                        ? "text-primary"
                        : line.tone === "accent"
                          ? "text-secondary"
                          : line.tone === "value"
                            ? "text-success"
                            : "text-muted"
                    }
                  >
                    {line.text}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-3 hidden items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 sm:flex">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: ["40%", "68%", "40%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="text-[10px] text-muted">Lesson progress</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
