import React from "react";
import {COLORS, FONTS} from "../../../shared/constants";

type LoadBalancerProps = {
  active?: boolean;
  width?: number;
};

export const LoadBalancer: React.FC<LoadBalancerProps> = ({
  active = true,
  width = 280,
}) => {
  const color = active ? COLORS.kubernetesBlue : COLORS.muted;
  return (
    <div
      style={{
        width,
        borderRadius: 18,
        border: `2px solid ${color}`,
        background: COLORS.card,
        boxShadow: active ? `0 0 28px ${COLORS.glowBlue}` : "none",
        padding: "18px 20px",
        textAlign: "center",
        fontFamily: FONTS.sans,
      }}
    >
      <svg width="56" height="36" viewBox="0 0 56 36" fill="none" style={{margin: "0 auto 8px"}}>
        <rect x="8" y="8" width="40" height="20" rx="6" stroke={color} strokeWidth="2.5" />
        <path d="M18 18h20M28 12v12" stroke={color} strokeWidth="2.2" />
      </svg>
      <div style={{color, fontWeight: 750, fontSize: 26}}>Load Balancer</div>
    </div>
  );
};
