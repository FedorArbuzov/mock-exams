import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {ServerIcon} from "../../../../../shared/components/icons";
import {Binary} from "../../../icons/Binary";
import {Terminal} from "../../../icons/Terminal";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = ["$ go build"];
const FULL_LEN = LINES.join("\n").length;
const TERMINAL_Y = 300;
const SERVER_Y = 1280;

export const Scene2Build: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const typeEnd = Math.floor(durationInFrames * 0.28);
  const typedChars = Math.round(interpolate(frame, [4, typeEnd], [0, FULL_LEN], clamp));
  const popIn = progress01(frame, typeEnd, typeEnd + 8);
  const travel = progress01(frame, typeEnd + 10, Math.floor(durationInFrames * 0.68));
  const checkIn = progress01(frame, Math.floor(durationInFrames * 0.7), Math.floor(durationInFrames * 0.84));

  const binaryY = TERMINAL_Y + 220 + (SERVER_Y - 140 - (TERMINAL_Y + 220)) * travel;
  const binaryScale = 0.65 + 0.35 * (1 - travel * 0.25);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: TERMINAL_Y, transform: "translateX(-50%)"}}>
        <Terminal typedChars={typedChars} lines={LINES} title="shell" width={640} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: binaryY,
          transform: `translate(-50%, -50%) scale(${binaryScale})`,
          opacity: popIn,
        }}
      >
        <Binary label="app" size={110} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: SERVER_Y,
          transform: "translate(-50%, -50%)",
          opacity: travel > 0.85 ? 1 : Math.max(0.15, travel),
        }}
      >
        <ServerIcon size={72} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: SERVER_Y + 100,
          transform: "translate(-50%, -50%)",
          opacity: checkIn,
        }}
      >
        <Checkmark progress={checkIn} size={54} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
