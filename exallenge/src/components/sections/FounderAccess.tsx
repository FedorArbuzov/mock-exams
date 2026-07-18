"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckItem } from "@/components/ui/CheckItem";
import { siteConfig } from "@/lib/config";

const included = [
  "One-time payment",
  "Lifetime access",
  "Lifetime updates",
  "Future courses included",
  "Future labs included",
  "Future interview questions included",
  "Future visual lessons included",
  "Premium Discord (placeholder)",
  "Priority support (placeholder)",
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
              <Badge tone="primary">Limited Founder Offer</Badge>
              <h2
                id="founder-heading"
                className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]"
              >
                Founder Access
              </h2>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                Join early and get lifetime access to every current and future
                lesson with a single payment.
              </p>

              <div className="mt-8 flex items-end gap-3">
                <span className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
                  {siteConfig.founderPrice}
                </span>
                <span className="mb-2 text-sm text-muted">one-time</span>
              </div>

              <div className="mt-8">
                <Button href="#founder" size="lg" className="w-full sm:w-auto">
                  Get Lifetime Access
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                Included forever
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
