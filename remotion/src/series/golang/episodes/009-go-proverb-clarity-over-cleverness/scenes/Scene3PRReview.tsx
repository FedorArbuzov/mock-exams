import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const Row: React.FC<{
  label: string;
  pillText: string;
  color: string;
  frame: number;
  delay: number;
}> = ({label, pillText, color, frame, delay}) => {
  const rowIn = progress01(frame, delay, delay + 16);
  const pillIn = progress01(frame, delay + 14, delay + 28);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 26px",
        opacity: rowIn,
        transform: `translateY(${(1 - rowIn) * 14}px)`,
      }}
    >
      <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 620}}>
        {label}
      </div>
      <div
        style={{
          padding: "8px 16px",
          borderRadius: 999,
          border: `1.5px solid ${color}`,
          color,
          fontSize: 17,
          fontWeight: 700,
          opacity: pillIn,
        }}
      >
        {pillText}
      </div>
    </div>
  );
};

export const Scene3PRReview: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cardIn = progress01(frame, 0, 18);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 750,
          transform: `translate(-50%, -50%) translateY(${(1 - cardIn) * 20}px)`,
          opacity: cardIn,
          width: 720,
          borderRadius: 20,
          border: `1.5px solid ${COLORS.border}`,
          background: COLORS.card,
          overflow: "hidden",
          boxShadow: `0 0 30px ${COLORS.glowCyan}`,
        }}
      >
        <div
          style={{
            padding: "16px 26px",
            borderBottom: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            fontFamily: FONTS.sans,
            fontSize: 18,
            fontWeight: 650,
          }}
        >
          pull request review
        </div>
        <Row label="clear code" pillText="Approved" color={COLORS.green} frame={frame} delay={16} />
        <div style={{height: 1, background: COLORS.border}} />
        <Row label="clever one-liner" pillText="too magical" color={COLORS.red} frame={frame} delay={40} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
