import React from "react";
import {COLORS, FONTS} from "../constants";

type BrandFooterProps = {
  /** Slightly stronger on the final CTA beat */
  emphasis?: boolean;
};

/**
 * Persistent brand mark for the full reel — quiet, lower safe-area footer.
 */
export const BrandFooter: React.FC<BrandFooterProps> = ({emphasis = false}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 56,
        zIndex: 40,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        fontFamily: FONTS.sans,
      }}
    >
      <div
        style={{
          color: emphasis ? COLORS.cyan : COLORS.muted,
          fontSize: emphasis ? 26 : 22,
          fontWeight: 560,
          letterSpacing: 1.4,
          opacity: emphasis ? 0.92 : 0.72,
          textShadow: emphasis
            ? `0 0 14px ${COLORS.glowCyan}`
            : "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        exallenge.tech
      </div>
    </div>
  );
};
