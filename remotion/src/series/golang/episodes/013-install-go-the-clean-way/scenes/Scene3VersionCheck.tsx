import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Terminal} from "../../../icons/Terminal";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = ["$ go version", "go1.23.0 windows/amd64"];
const FULL_LEN = LINES.join("\n").length;

export const Scene3VersionCheck: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const typeEnd = Math.floor(durationInFrames * 0.55);
  const typedChars = Math.round(interpolate(frame, [4, typeEnd], [0, FULL_LEN], clamp));
  const checkIn = progress01(frame, typeEnd + 6, typeEnd + 22);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 720,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Terminal typedChars={typedChars} lines={LINES} title="new terminal" width={780} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1080,
          transform: "translate(-50%, -50%)",
          opacity: checkIn,
        }}
      >
        <Checkmark progress={checkIn} size={78} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1180,
          transform: "translateX(-50%)",
          color: COLORS.green,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: 24,
          fontWeight: 700,
          opacity: checkIn,
        }}
      >
        stable, not nightly
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
