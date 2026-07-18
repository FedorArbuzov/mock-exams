import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {FolderIcon} from "../../../../../shared/components/icons";
import {fadeSlideUpWith, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const shake = Math.sin(frame * 0.5) * (frame < 40 ? 4 : 0);
  const markIn = progress01(frame, durationInFrames * 0.35, durationInFrames * 0.6);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          ...fadeSlideUpWith(`translate(-50%, -50%) rotate(${shake}deg)`, frame, 0, 18),
        }}
      >
        <FolderIcon size={190} color={COLORS.muted} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1010,
          transform: "translateX(-50%)",
          color: COLORS.cyan,
          fontSize: 46,
          fontWeight: 800,
          opacity: markIn * (0.75 + Math.sin(frame * 0.12) * 0.2),
          textShadow: `0 0 16px ${COLORS.glowCyan}`,
        }}
      >
        ?
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
