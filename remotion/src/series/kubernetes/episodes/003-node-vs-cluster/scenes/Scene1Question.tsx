import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {clamp, fadeSlideUp, floatY} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.05], clamp);
  const flip = interpolate(frame, [18, 34], [0, 1], clamp);

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          transform: `scale(${zoom})`,
          marginTop: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 42,
        }}
      >
        <div
          style={{
            ...fadeSlideUp(frame, 0, 16),
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 48,
            fontWeight: 780,
            textAlign: "center",
          }}
        >
          Node vs Cluster
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            ...fadeSlideUp(frame, 10, 18),
          }}
        >
          <Card title="Node" subtitle="one machine" color={COLORS.cyan} y={floatY(frame)} />
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 99,
              border: `2px solid ${flip > 0.5 ? COLORS.red : COLORS.muted}`,
              color: flip > 0.5 ? COLORS.red : COLORS.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: flip > 0.5 ? 42 : 36,
              fontWeight: 800,
              fontFamily: FONTS.sans,
              boxShadow: flip > 0.5 ? `0 0 20px ${COLORS.red}66` : "none",
              transform: `rotate(${flip * 180}deg)`,
            }}
          >
            {flip > 0.5 ? "≠" : "="}
          </div>
          <Card title="Cluster" subtitle="many + brain" color={COLORS.kubernetesBlue} y={floatY(frame + 18)} />
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const Card: React.FC<{title: string; subtitle: string; color: string; y: number}> = ({
  title,
  subtitle,
  color,
  y,
}) => (
  <div
    style={{
      width: 280,
      borderRadius: 24,
      border: `2px solid ${color}`,
      background: COLORS.card,
      boxShadow: `0 0 24px ${color}44`,
      padding: "28px 20px",
      textAlign: "center",
      transform: `translateY(${y}px)`,
      fontFamily: FONTS.sans,
    }}
  >
    <div style={{color, fontSize: 42, fontWeight: 780}}>{title}</div>
    <div style={{marginTop: 10, color: COLORS.muted, fontSize: 22}}>{subtitle}</div>
  </div>
);
