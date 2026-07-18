import React from "react";
import {COLORS, FONTS} from "../../../shared/constants";

type LangBadgeProps = {
  label: string;
  accent?: string;
  emphasis?: boolean;
  style?: React.CSSProperties;
};

export const LangBadge: React.FC<LangBadgeProps> = ({
  label,
  accent = COLORS.cyan,
  emphasis = false,
  style,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "16px 28px",
      borderRadius: 999,
      border: `2px solid ${accent}`,
      background: emphasis ? "rgba(34, 211, 238, 0.12)" : COLORS.card,
      boxShadow: emphasis ? `0 0 26px ${COLORS.glowCyan}` : "none",
      fontFamily: FONTS.sans,
      ...style,
    }}
  >
    <div style={{width: 14, height: 14, borderRadius: 99, background: accent}} />
    <div style={{color: COLORS.white, fontSize: 26, fontWeight: 720}}>{label}</div>
  </div>
);
