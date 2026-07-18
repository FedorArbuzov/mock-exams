import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GearIcon} from "../../../../../shared/components/icons";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TAGS = ["CLIs", "APIs", "workers", "proxies", "k8s tooling"];

export const Scene2SweetSpots: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const spin = frame * 1.2;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: `translate(-50%, -50%) rotate(${spin}deg)`,
        }}
      >
        <GearIcon size={90} color={COLORS.cyan} />
      </div>

      {TAGS.map((tag, i) => {
        const angle = (i / TAGS.length) * Math.PI * 2 - Math.PI / 2;
        const delay = 14 + i * 10;
        const conv = progress01(frame, delay, delay + 20);
        const radius = interpolate(conv, [0, 1], [340, 190], clamp);
        const x = 540 + Math.cos(angle) * radius;
        const y = 800 + Math.sin(angle) * radius * 0.82;

        return (
          <div
            key={tag}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              opacity: conv,
              padding: "10px 18px",
              borderRadius: 999,
              border: `1.5px solid ${COLORS.cyan}`,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 20,
              fontWeight: 650,
              whiteSpace: "nowrap",
            }}
          >
            {tag}
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
