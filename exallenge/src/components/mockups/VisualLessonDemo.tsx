"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KubernetesDiagram } from "@/components/mockups/KubernetesDiagram";

const scenes = [
  {
    title: "Pods run your containers",
    caption: "A Pod is the smallest deployable unit in Kubernetes.",
    code: [
      "apiVersion: v1",
      "kind: Pod",
      "metadata:",
      "  name: api",
      "spec:",
      "  containers:",
      "  - name: api",
      "    image: api:1.2",
    ],
  },
  {
    title: "ReplicaSets keep count",
    caption: "Controllers continuously reconcile desired replicas.",
    code: [
      "apiVersion: apps/v1",
      "kind: ReplicaSet",
      "spec:",
      "  replicas: 3",
      "  selector:",
      "    matchLabels:",
      "      app: web",
    ],
  },
  {
    title: "Traffic reaches healthy pods",
    caption: "Services distribute requests across ready endpoints.",
    code: [
      "apiVersion: v1",
      "kind: Service",
      "spec:",
      "  selector:",
      "    app: web",
      "  ports:",
      "  - port: 80",
    ],
  },
];

export function VisualLessonDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % scenes.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  const scene = scenes[index];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#0E1528] glow-ring">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          <span className="ml-2 font-mono text-xs text-muted">
            lesson · kubernetes-visual
          </span>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {scenes.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-5 rounded-full transition-colors ${
                i === index ? "bg-secondary" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-b border-white/5 p-4 sm:p-6 lg:border-b-0 lg:border-r">
          <AnimatePresence mode="wait">
            <motion.div
              key={scene.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                Visual lesson
              </p>
              <h3 className="mt-2 font-display text-xl font-semibold text-foreground sm:text-2xl">
                {scene.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{scene.caption}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-5">
            <KubernetesDiagram />
          </div>
        </div>

        <div className="relative bg-[#070B16] p-4 sm:p-6">
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(79,156,249,0.18), transparent 40%), radial-gradient(circle at 80% 70%, rgba(99,230,255,0.12), transparent 35%)",
            }}
          />
          <div className="relative">
            <div className="mb-3 flex items-center justify-between text-xs text-muted">
              <span>manifest.yaml</span>
              <span className="text-success">synced</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.pre
                key={scene.title + "-code"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-x-auto font-mono text-[12px] leading-6 text-foreground/90 sm:text-[13px]"
              >
                {scene.code.map((line) => (
                  <div key={line}>
                    <span className="mr-4 inline-block w-4 text-muted/50 select-none">
                      ·
                    </span>
                    <span
                      className={
                        line.includes("kind:")
                          ? "text-primary"
                          : line.includes("replicas:")
                            ? "text-secondary"
                            : "text-foreground/80"
                      }
                    >
                      {line}
                    </span>
                  </div>
                ))}
              </motion.pre>
            </AnimatePresence>

            <div className="mt-6 flex items-center gap-3">
              <motion.div
                className="h-10 w-10 rounded-full border border-secondary/40 bg-secondary/10"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div>
                <p className="text-xs text-muted">Traffic pulse</p>
                <p className="text-sm text-foreground">3 healthy endpoints</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
