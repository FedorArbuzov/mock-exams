import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {ServerIcon} from "../../../../../shared/components/icons";
import {Binary} from "../../../icons/Binary";
import {Terminal} from "../../../icons/Terminal";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = ["$ go build"];
const FULL_LEN = LINES.join("\n").length;

const TERMINAL_Y = 300;
const SERVER_Y = 1240;

export const Scene2Compiled: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const typeEnd = Math.floor(durationInFrames * 0.3);
  const typedChars = Math.round(interpolate(frame, [4, typeEnd], [0, FULL_LEN], clamp));

  const popIn = progress01(frame, typeEnd, typeEnd + 8);
  const travel = progress01(frame, typeEnd + 10, Math.floor(durationInFrames * 0.62));
  const tagsIn = progress01(frame, Math.floor(durationInFrames * 0.64), Math.floor(durationInFrames * 0.76));
  const strike = progress01(frame, Math.floor(durationInFrames * 0.8), Math.floor(durationInFrames * 0.94));
  const labelIn = progress01(frame, Math.floor(durationInFrames * 0.7), Math.floor(durationInFrames * 0.85));

  const binaryY = TERMINAL_Y + 220 + (SERVER_Y - 40 - (TERMINAL_Y + 220)) * travel;
  const binaryScale = 0.6 + 0.4 * (1 - travel * 0.3);

  const tags = ["JVM", "interpreter", "extra deps"];

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          opacity: travel > 0.85 ? 1 : Math.max(0.15, travel),
        }}
      >
        <ServerIcon size={70} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: SERVER_Y + 110,
          transform: "translateX(-50%)",
          display: "flex",
          gap: 18,
          opacity: tagsIn,
        }}
      >
        {tags.map((tag) => (
          <div
            key={tag}
            style={{
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 620,
              textDecoration: strike > 0.15 ? "line-through" : "none",
              textDecorationColor: COLORS.red,
              opacity: 1 - strike * 0.55,
            }}
          >
            {tag}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: SERVER_Y + 170,
          transform: `translate(-50%, ${(1 - labelIn) * 10}px)`,
          opacity: labelIn,
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 700,
          textShadow: `0 0 14px ${COLORS.glowCyan}`,
        }}
      >
        1 file → server
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
