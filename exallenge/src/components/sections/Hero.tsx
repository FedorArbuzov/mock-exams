"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Particles } from "@/components/layout/Particles";
import { HeroAppMockup } from "@/components/mockups/HeroAppMockup";
import { IconCheck, IconPlay } from "@/components/icons/Icons";
import { siteConfig } from "@/lib/config";

const perks = ["One-time payment", "Lifetime updates", "Founder pricing"];

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pb-20 pt-28 sm:pb-28 sm:pt-36"
    >
      <div aria-hidden className="absolute inset-0 grid-bg" />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute right-0 top-40 h-[360px] w-[360px] rounded-full bg-secondary/10 blur-[100px]"
      />
      <Particles count={24} />

      <Container className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 xl:gap-16">
        <div>
          <motion.p
            className="font-display text-sm font-semibold tracking-[0.22em] text-secondary"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {siteConfig.name}
          </motion.p>

          <motion.h1
            className="mt-5 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08] xl:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
          >
            Master DevOps.
            <br />
            <span className="text-gradient">Not Just Kubernetes.</span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            Interactive lessons, visual explanations, hands-on labs and interview
            questions — everything you need to become a confident DevOps
            engineer.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            <Button href={siteConfig.founderCtaHref} size="lg">
              Get Founder Access
            </Button>
            <Button href={siteConfig.demoHref} variant="secondary" size="lg">
              <IconPlay size={18} />
              Watch Demo
            </Button>
          </motion.div>

          <motion.ul
            className="mt-7 flex flex-wrap gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28 }}
          >
            {perks.map((perk) => (
              <li
                key={perk}
                className="inline-flex items-center gap-1.5 text-sm text-muted"
              >
                <IconCheck size={16} className="text-success" />
                {perk}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="relative lg:justify-self-end">
          <HeroAppMockup />
        </div>
      </Container>
    </section>
  );
}
