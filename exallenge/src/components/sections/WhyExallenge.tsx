"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckItem } from "@/components/ui/CheckItem";
import { siteConfig } from "@/lib/config";

const randomLearning = [
  "Random YouTube videos",
  "Scattered blog posts",
  "No roadmap",
  "No practice",
  "No interview preparation",
  "No progress tracking",
];

const exallenge = [
  "Structured learning",
  "Clear explanations",
  "Interactive labs",
  "Learning roadmap",
  "Interview questions",
  "Track your progress",
];

export function WhyExallenge() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="why-heading">
      <Container>
        <SectionHeading
          eyebrow="Why Exallenge"
          title={<span id="why-heading">Stop guessing. Start mastering.</span>}
          description="One structured platform instead of an endless pile of disconnected content."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <motion.div
            className="rounded-2xl border border-border bg-white/[0.02] p-6 sm:p-8"
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Random Learning
            </p>
            <h3 className="mt-2 font-display text-xl font-semibold text-foreground/70">
              The old way
            </h3>
            <ul className="mt-6 flex flex-col gap-3.5">
              {randomLearning.map((item) => (
                <CheckItem key={item} positive={false}>
                  {item}
                </CheckItem>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-secondary/5 p-6 glow-ring sm:p-8"
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <div
              aria-hidden
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/15 blur-3xl"
            />
            <p className="relative text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              {siteConfig.name}
            </p>
            <h3 className="relative mt-2 font-display text-xl font-semibold text-foreground">
              The product way
            </h3>
            <ul className="relative mt-6 flex flex-col gap-3.5">
              {exallenge.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
