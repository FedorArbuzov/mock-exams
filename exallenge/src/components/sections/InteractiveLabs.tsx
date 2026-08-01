"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LabsTerminal } from "@/components/mockups/LabsTerminal";

export function InteractiveLabs() {
  return (
    <section id="labs" className="py-20 sm:py-28" aria-labelledby="labs-heading">
      <Container>
        <SectionHeading
          eyebrow="Interactive Labs"
          title={<span id="labs-heading">Practice like you&apos;re on the job</span>}
          description="A VS Code–inspired lab environment. Run commands and practice real DevOps scenarios."
        />
        <div className="mt-12">
          <LabsTerminal />
        </div>
      </Container>
    </section>
  );
}
