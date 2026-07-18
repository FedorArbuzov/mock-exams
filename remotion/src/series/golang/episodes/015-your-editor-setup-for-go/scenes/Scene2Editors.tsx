import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GearIcon, WindowIcon} from "../../../../../shared/components/icons";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LEFT = {x: 300, y: 620};
const RIGHT = {x: 780, y: 620};
const HUB = {x: 540, y: 960};

export const Scene2Editors: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 4, 20);
  const rightIn = progress01(frame, 16, 32);
  const lineIn = progress01(frame, 28, 48);
  const hubIn = progress01(frame, 44, 62);
  const spin = frame * 0.7;

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" style={{position: "absolute"}}>
        <line
          x1={LEFT.x}
          y1={LEFT.y + 50}
          x2={LEFT.x + (HUB.x - LEFT.x) * lineIn}
          y2={LEFT.y + 50 + (HUB.y - 50 - LEFT.y) * lineIn}
          stroke={COLORS.cyan}
          strokeWidth={2}
          opacity={0.6}
        />
        <line
          x1={RIGHT.x}
          y1={RIGHT.y + 50}
          x2={RIGHT.x + (HUB.x - RIGHT.x) * lineIn}
          y2={RIGHT.y + 50 + (HUB.y - 50 - RIGHT.y) * lineIn}
          stroke={COLORS.muted}
          strokeWidth={2}
          opacity={0.6}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: LEFT.x,
          top: LEFT.y,
          transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 16}px)`,
          opacity: leftIn,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <WindowIcon size={82} color={COLORS.cyan} />
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 680}}>
          VS Code
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: RIGHT.x,
          top: RIGHT.y,
          transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 16}px)`,
          opacity: rightIn,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <WindowIcon size={82} color={COLORS.muted} />
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 680}}>
          GoLand
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: HUB.x,
          top: HUB.y,
          transform: `translate(-50%, -50%) scale(${0.9 + hubIn * 0.1})`,
          opacity: hubIn,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{transform: `rotate(${spin}deg)`}}>
          <GearIcon size={100} color={COLORS.green} />
        </div>
        <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
          gopls
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
