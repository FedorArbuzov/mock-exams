import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {FolderIcon} from "../../../../../shared/components/icons";
import {fadeSlideUpWith, floatY, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Modules: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const drift = floatY(frame, 14, 130);
  const tagIn = progress01(frame, durationInFrames * 0.3, durationInFrames * 0.5);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 680 + drift,
          ...fadeSlideUpWith("translate(-50%, -50%)", frame, 0, 18),
        }}
      >
        <FolderIcon size={170} color={COLORS.cyan} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 680 + drift + 40,
          transform: `translate(-50%, -50%) translateY(${(1 - tagIn) * 12}px)`,
          opacity: tagIn,
          padding: "10px 22px",
          borderRadius: 999,
          border: `2px solid ${COLORS.green}`,
          background: "rgba(52, 211, 153, 0.12)",
          color: COLORS.green,
          fontFamily: FONTS.mono,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        go.mod
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 940,
          transform: "translateX(-50%)",
          color: COLORS.white,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 700,
          opacity: tagIn,
        }}
      >
        lives anywhere on disk
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
