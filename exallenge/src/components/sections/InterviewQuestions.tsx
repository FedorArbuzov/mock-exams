"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { INTERVIEW_QUESTIONS } from "@/lib/constants";

export function InterviewQuestions() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="interview-heading">
      <Container>
        <SectionHeading
          eyebrow="Interview Questions"
          title={<span id="interview-heading">Walk into interviews prepared</span>}
          description="Realistic DevOps questions with structured answers — not trivia dumps."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTERVIEW_QUESTIONS.map((question, index) => (
            <motion.div
              key={question}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="h-full min-h-[140px]">
                <span className="font-mono text-[11px] text-secondary">
                  Q{String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-[17px] font-semibold leading-snug text-foreground">
                  {question}
                </h3>
                <p className="mt-4 text-xs text-muted">Reveal answer →</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
