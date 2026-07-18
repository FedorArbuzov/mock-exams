import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {FolderIcon, MagnifyingGlass} from "../../../../../shared/components/icons";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const sweepX = interpolate(frame, [10, durationInFrames * 0.55], [-70, 70], clamp);
  const modIn = progress01(frame, durationInFrames * 0.6, durationInFrames * 0.78);
  const glassFade = interpolate(frame, [durationInFrames * 0.55, durationInFrames * 0.68], [1, 0], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
        }}
      >
        <FolderIcon size={140} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 700,
          transform: `translate(calc(-50% + ${sweepX}px), -50%)`,
          opacity: glassFade,
        }}
      >
        <MagnifyingGlass size={70} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1020,
          transform: "translate(-50%, -50%)",
          opacity: modIn,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            padding: "14px 24px",
            borderRadius: 12,
            border: `2px solid ${COLORS.cyan}`,
            color: COLORS.cyan,
            fontFamily: FONTS.mono,
            fontSize: 26,
            fontWeight: 700,
            boxShadow: `0 0 20px ${COLORS.glowCyan}`,
          }}
        >
          go.mod
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
