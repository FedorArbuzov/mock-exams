import React from "react";
import {COLORS, FONTS} from "../../../shared/constants";

type ServiceTileProps = {
  label: string;
  pulse?: number;
  style?: React.CSSProperties;
};

/** Generic "production service" card — deliberately anonymous, no real company logos. */
export const ServiceTile: React.FC<ServiceTileProps> = ({label, pulse = 1, style}) => (
  <div
    style={{
      width: 168,
      height: 96,
      borderRadius: 16,
      border: `1.5px solid ${COLORS.border}`,
      background: COLORS.card,
      boxShadow: `0 0 ${16 * pulse}px ${COLORS.glowGreen}`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontFamily: FONTS.sans,
      ...style,
    }}
  >
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
      <rect x="4" y="5" width="24" height="8" rx="2.5" stroke={COLORS.cyan} strokeWidth="2" />
      <rect x="4" y="19" width="24" height="8" rx="2.5" stroke={COLORS.cyan} strokeWidth="2" />
      <circle cx="9" cy="9" r="1.6" fill={COLORS.green} />
      <circle cx="9" cy="23" r="1.6" fill={COLORS.green} />
    </svg>
    <div style={{color: COLORS.white, fontSize: 17, fontWeight: 650}}>{label}</div>
  </div>
);
