"use client";

import { useEffect } from "react";
import { trackVisit } from "@/lib/tracking";

/** Fires one pageview on mount (landing load). */
export function VisitTracker() {
  useEffect(() => {
    void trackVisit();
  }, []);

  return null;
}
