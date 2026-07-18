"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <motion.div
      className={`rounded-2xl border border-border bg-card p-6 glow-ring ${className}`}
      whileHover={
        hover
          ? {
              y: -4,
              borderColor: "rgba(99, 230, 255, 0.28)",
              boxShadow:
                "0 0 0 1px rgba(99,230,255,0.16), 0 0 48px rgba(79,156,249,0.14), 0 28px 80px rgba(0,0,0,0.45)",
            }
          : undefined
      }
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
