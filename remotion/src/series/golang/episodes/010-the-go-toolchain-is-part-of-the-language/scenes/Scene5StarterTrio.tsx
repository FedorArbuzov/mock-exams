import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Terminal} from "../../../icons/Terminal";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = ["$ go fmt ./...", "$ go vet ./...", "$ go test ./..."];
const FULL_LEN = LINES.join("\n").length;

export const Scene5StarterTrio: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const typeEnd = Math.floor(durationInFrames * 0.6);
  const typedChars = Math.round(interpolate(frame, [4, typeEnd], [0, FULL_LEN], clamp));
  const checkIn = progress01(frame, typeEnd + 6, typeEnd + 22);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Terminal typedChars={typedChars} lines={LINES} title="muscle memory" width={700} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1160,
          transform: "translate(-50%, -50%)",
          opacity: checkIn,
        }}
      >
        <Checkmark progress={checkIn} size={78} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
