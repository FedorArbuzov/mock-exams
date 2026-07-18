import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3SmallCodebase: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const boxIn = progress01(frame, 0, 18);
  const tagsIn = progress01(frame, 22, 40);
  const labelIn = progress01(frame, durationInFrames * 0.55, durationInFrames * 0.72);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: `translate(-50%, -50%) scale(${0.9 + boxIn * 0.1})`,
          opacity: boxIn,
          width: 460,
          height: 320,
          borderRadius: 22,
          border: `2px solid ${COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            opacity: tagsIn,
            padding: "12px 24px",
            borderRadius: 999,
            border: `1.5px solid ${COLORS.cyan}`,
            color: COLORS.cyan,
            fontFamily: FONTS.mono,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          function
        </div>
        <div
          style={{
            opacity: tagsIn,
            padding: "12px 24px",
            borderRadius: 999,
            border: `1.5px solid ${COLORS.cyan}`,
            color: COLORS.cyan,
            fontFamily: FONTS.mono,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          interface
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 480,
          transform: "translateX(-50%)",
          color: COLORS.muted,
          fontFamily: FONTS.sans,
          fontSize: 22,
          fontWeight: 650,
          opacity: boxIn,
        }}
      >
        small codebase
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1180,
          transform: "translateX(-50%)",
          opacity: labelIn,
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 720,
          textShadow: `0 0 14px ${COLORS.glowCyan}`,
        }}
      >
        reads cleaner
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
