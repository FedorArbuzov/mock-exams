"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VisualLessonDemo } from "@/components/mockups/VisualLessonDemo";

export function LearnVisually() {
  return (
    <section
      id="learn-visually"
      className="py-20 sm:py-28"
      aria-labelledby="visual-heading"
    >
      <Container>
        <SectionHeading
          eyebrow="Learn Visually"
          title={
            <span id="visual-heading">
              Difficult concepts. Clear animations.
            </span>
          }
          description="Pods, traffic, ReplicaSets, and controllers — explained the way developers actually understand systems."
        />
        <div className="mt-12">
          <VisualLessonDemo />
        </div>
      </Container>
    </section>
  );
}
