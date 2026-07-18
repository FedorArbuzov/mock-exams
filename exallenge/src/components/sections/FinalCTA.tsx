"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Particles } from "@/components/layout/Particles";
import { siteConfig } from "@/lib/config";

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
            Become Interview Ready.
          </h2>
          <p className="mt-5 text-base text-muted sm:text-lg">
            Theory.
            <br />
            Practice.
            <br />
            Interview Questions.
          </p>
          <p className="mt-4 text-sm text-secondary">Everything in one place.</p>
          <div className="mt-8 flex justify-center">
            <Button href={siteConfig.founderCtaHref} size="lg">
              Get Founder Access
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
