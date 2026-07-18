import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GaugeIcon} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const BoltIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M26 4L10 28h10l-4 16 20-26H26z" stroke={color} strokeWidth="2.3" strokeLinejoin="round" />
  </svg>
);

export const Scene3PlatformTools: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const labelIn = progress01(frame, durationInFrames * 0.55, durationInFrames * 0.72);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 280,
          top: 700,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 4, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 4, 16).opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <BoltIcon size={56} color={COLORS.cyan} />
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 680}}>
          deploy agents
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 800,
          top: 700,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 10, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 10, 16).opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <GaugeIcon size={56} needleAngle={-55} />
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 680}}>
          log forwarders
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1000,
          transform: "translateX(-50%)",
          opacity: labelIn,
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 28,
          fontWeight: 720,
          textShadow: `0 0 14px ${COLORS.glowCyan}`,
        }}
      >
        fast start, light footprint
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
