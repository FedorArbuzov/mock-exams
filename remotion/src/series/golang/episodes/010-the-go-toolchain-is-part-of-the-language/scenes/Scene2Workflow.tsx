import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GoLogo} from "../../../icons/GoLogo";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const COMMANDS = ["go run", "go build", "go test", "go fmt", "go vet", "go mod"];

export const Scene2Workflow: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
        }}
      >
        <GoLogo size={130} />
      </div>

      {COMMANDS.map((cmd, i) => {
        const angle = (i / COMMANDS.length) * Math.PI * 2 - Math.PI / 2;
        const delay = 14 + i * 9;
        const conv = progress01(frame, delay, delay + 18);
        const radius = interpolate(conv, [0, 1], [380, 250], clamp);
        const x = 540 + Math.cos(angle) * radius;
        const y = 800 + Math.sin(angle) * radius * 0.9;

        return (
          <div
            key={cmd}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              opacity: conv,
              padding: "14px 22px",
              borderRadius: 999,
              border: `1.5px solid ${COLORS.cyan}`,
              color: COLORS.cyan,
              fontFamily: FONTS.mono,
              fontSize: 24,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {cmd}
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
