"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { FAQ_ITEMS } from "@/lib/constants";

export function FAQ() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="faq-heading">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title={<span id="faq-heading">Questions, answered</span>}
        />
        <div className="mt-10">
          <Accordion items={[...FAQ_ITEMS]} />
        </div>
      </Container>
    </section>
  );
}
