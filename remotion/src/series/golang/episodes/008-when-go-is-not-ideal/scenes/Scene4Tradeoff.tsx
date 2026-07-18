import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {ScaleIcon, XMarkGlyph} from "../../../../../shared/components/icons";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const REASONS = ["compile-time safety", "simple deploys", "concurrency"];

export const Scene4Tradeoff: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const tilt = interpolate(frame, [20, durationInFrames * 0.5], [0, -6], clamp);
  const xIn = progress01(frame, durationInFrames * 0.55, durationInFrames * 0.7);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 620,
          transform: `translate(-50%, -50%) rotate(${tilt}deg) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
        }}
      >
        <ScaleIcon size={140} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 260,
          top: 900,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        {REASONS.map((r, i) => (
          <div
            key={r}
            style={{
              ...fadeSlideUp(frame, 30 + i * 12, 14),
              padding: "8px 16px",
              borderRadius: 999,
              border: `1.5px solid ${COLORS.cyan}`,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 18,
              fontWeight: 650,
            }}
          >
            {r}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: 820,
          top: 900,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{position: "relative", width: 56, height: 56, ...fadeSlideUp(frame, 30, 14)}}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 99,
              border: `2px solid ${COLORS.muted}`,
            }}
          />
          <div style={{position: "absolute", left: 0, top: 0, opacity: xIn}}>
            <XMarkGlyph size={56} />
          </div>
        </div>
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 620}}>
          moral victory
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
