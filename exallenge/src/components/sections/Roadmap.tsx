"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ROADMAP_ITEMS } from "@/lib/constants";

const statusLabel = {
  completed: "Completed",
  current: "Current",
  upcoming: "Coming Soon",
} as const;

const statusStyles = {
  completed: "border-success/30 bg-success/10 text-success",
  current: "border-primary/35 bg-primary/15 text-primary shadow-[0_0_28px_rgba(79,156,249,0.2)]",
  upcoming: "border-white/10 bg-white/[0.02] text-muted",
} as const;

export function Roadmap() {
  return (
    <section id="roadmap" className="py-20 sm:py-28" aria-labelledby="roadmap-heading">
      <Container>
        <SectionHeading
          eyebrow="Roadmap"
          title={<span id="roadmap-heading">A clear path from fundamentals to production</span>}
          description="Know exactly where you are — and what comes next."
        />

        <div className="relative mx-auto mt-14 max-w-xl">
          <div
            aria-hidden
            className="absolute bottom-4 left-[1.35rem] top-4 w-px bg-gradient-to-b from-success via-primary to-white/10 sm:left-1/2 sm:-translate-x-px"
          />

          <ol className="flex flex-col gap-4">
            {ROADMAP_ITEMS.map((item, index) => (
              <motion.li
                key={item.id}
                className="relative grid grid-cols-[auto_1fr] items-center gap-4 sm:grid-cols-[1fr_auto_1fr]"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
              >
                <div
                  className={`hidden sm:block ${
                    index % 2 === 0 ? "text-right" : "invisible"
                  }`}
                >
                  {index % 2 === 0 ? (
                    <RoadmapCard label={item.label} status={item.status} />
                  ) : null}
                </div>

                <div
                  className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border ${statusStyles[item.status]}`}
                >
                  <span className="font-mono text-xs font-semibold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="sm:hidden">
                  <RoadmapCard label={item.label} status={item.status} />
                </div>

                <div
                  className={`hidden sm:block ${
                    index % 2 === 1 ? "text-left" : "invisible"
                  }`}
                >
                  {index % 2 === 1 ? (
                    <RoadmapCard label={item.label} status={item.status} />
                  ) : null}
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

function RoadmapCard({
  label,
  status,
}: {
  label: string;
  status: keyof typeof statusLabel;
}) {
  return (
    <div
      className={`inline-flex min-w-[160px] flex-col rounded-2xl border px-4 py-3 text-left ${statusStyles[status]}`}
    >
      <span className="font-display text-base font-semibold text-foreground">
        {label}
      </span>
      <span className="mt-1 text-[11px] uppercase tracking-[0.12em] opacity-80">
        {statusLabel[status]}
      </span>
    </div>
  );
}
