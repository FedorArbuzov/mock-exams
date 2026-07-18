import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Terminal} from "../../../icons/Terminal";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = ["$ mkdir -p GOPATH/src/", "  github.com/you"];
const FULL_LEN = LINES.join("\n").length;

export const Scene4OldTutorial: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const badgeIn = progress01(frame, 0, 16);
  const typeEnd = Math.floor(durationInFrames * 0.45);
  const typedChars = Math.round(interpolate(frame, [14, typeEnd], [0, FULL_LEN], clamp));
  const strikeIn = progress01(frame, typeEnd + 8, typeEnd + 24);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          transform: "translate(-50%, -50%)",
          opacity: badgeIn,
          padding: "10px 26px",
          borderRadius: 999,
          border: `2px solid ${COLORS.muted}`,
          color: COLORS.muted,
          fontFamily: FONTS.mono,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        tutorial from 2017
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Terminal typedChars={typedChars} lines={LINES} title="outdated advice" width={760} accent={COLORS.red} />
        <div
          style={{
            position: "absolute",
            left: "8%",
            top: "44%",
            width: "84%",
            height: 4,
            background: COLORS.red,
            transformOrigin: "left center",
            transform: `scaleX(${strikeIn})`,
            boxShadow: `0 0 12px ${COLORS.red}`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1120,
          transform: "translateX(-50%)",
          color: COLORS.red,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 700,
          opacity: strikeIn,
        }}
      >
        ignore for new projects
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
