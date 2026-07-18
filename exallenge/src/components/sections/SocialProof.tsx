"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/lib/config";

const stats = [
  { label: "Students", value: siteConfig.stats.students },
  { label: "Lessons", value: siteConfig.stats.lessons },
  { label: "Labs", value: siteConfig.stats.labs },
  { label: "Interview Questions", value: siteConfig.stats.interviewQuestions },
  { label: "Animated Videos", value: siteConfig.stats.animatedVideos },
];

function StatValue({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (inView) setShown(true);
  }, [inView]);

  return (
    <motion.span
      ref={ref}
      className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      initial={{ opacity: 0, y: 8 }}
      animate={shown ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.45 }}
    >
      {value}
    </motion.span>
  );
}

export function SocialProof() {
  return (
    <section className="relative pb-8 pt-4" aria-label="Social proof">
      <Container>
        <motion.div
          className="rounded-2xl border border-border bg-white/[0.02] px-6 py-8 sm:px-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-center text-sm text-muted sm:text-[15px]">
            Trusted by developers learning Kubernetes worldwide.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <StatValue value={stat.value} />
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
