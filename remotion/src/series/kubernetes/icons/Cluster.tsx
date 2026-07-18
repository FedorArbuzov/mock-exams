import React from "react";
import {COLORS, FONTS} from "../../../shared/constants";
import {Pod} from "./Pod";

type ClusterProps = {
  pods: Array<{
    id: string;
    label: string;
    status: "healthy" | "crashed" | "pending" | "new";
    opacity?: number;
    scale?: number;
  }>;
  title?: string;
  style?: React.CSSProperties;
};

export const Cluster: React.FC<ClusterProps> = ({
  pods,
  title = "cluster",
  style,
}) => {
  return (
    <div
      style={{
        borderRadius: 28,
        border: `1.5px solid ${COLORS.border}`,
        background: "rgba(11, 16, 32, 0.7)",
        padding: 28,
        boxShadow: `inset 0 0 40px ${COLORS.glowBlue}`,
        ...style,
      }}
    >
      <div
        style={{
          color: COLORS.muted,
          fontFamily: FONTS.sans,
          fontSize: 24,
          fontWeight: 600,
          marginBottom: 18,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {title}
      </div>
      <div style={{display: "flex", gap: 18, justifyContent: "center", justifyContent: "center"}}>
        {pods.map((pod) => (
          <div
            key={pod.id}
            style={{
              opacity: pod.opacity ?? 1,
              transform: `scale(${pod.scale ?? 1})`,
            }}
          >
            <Pod label={pod.label} status={pod.status} />
          </div>
        ))}
      </div>
    </div>
  );
};
