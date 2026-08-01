"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Particles } from "@/components/layout/Particles";
import { EmailSignup } from "@/components/ui/EmailSignup";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28" aria-labelledby="final-cta-heading">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
      />
      <Particles count={16} />

      <Container className="relative">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <h2
            id="final-cta-heading"
            className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl"
          >
            Try The Product Free.
          </h2>
          <p className="mt-5 text-base text-muted sm:text-lg">
            Leave your email and get access instructions.
          </p>
          <p className="mt-4 text-sm text-secondary">Free beta, built with users.</p>
          <div className="mx-auto mt-8 max-w-xl text-left">
            <EmailSignup source="final-cta" />
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
