"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { CheckItem } from "@/components/ui/CheckItem";
import { EmailSignup } from "@/components/ui/EmailSignup";
import { siteConfig } from "@/lib/config";

const included = [
  "Free access during beta",
  "Current lessons and labs",
  "New content drops every week",
  "Direct feedback loop with founder",
  "Roadmap voting by active users",
  "Early access to new tracks",
  "Interview prep updates",
  "No credit card required",
  "Cancel anytime",
];

export function FounderAccess() {
  return (
    <section id="founder" className="py-20 sm:py-28" aria-labelledby="founder-heading">
      <Container>
        <motion.div
          className="relative overflow-hidden rounded-[1.75rem] border border-primary/25 bg-gradient-to-br from-[#121A2E] via-[#0E1528] to-[#0B1020] p-6 glow-ring sm:p-10 lg:p-12"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div
            aria-hidden
            className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-primary/20 blur-[100px]"
          />
          <div
            aria-hidden
            className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-secondary/15 blur-[90px]"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Badge tone="primary">Early Access Beta</Badge>
              <h2
                id="founder-heading"
                className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
              >
                Free Beta Access
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                Leave your email and we&apos;ll send access instructions. Free
                for early users while we learn what you need most.
              </p>

              <div className="mt-8 flex items-end gap-3">
                <span className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                  {siteConfig.founderPrice}
                </span>
                <span className="mb-2 text-sm text-muted">limited launch</span>
              </div>

              <div className="mt-8">
                <EmailSignup source="founder" layout="stack" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                What is included now
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {included.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
