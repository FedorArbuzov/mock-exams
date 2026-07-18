import React, {useMemo} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GoLogo} from "../../../icons/GoLogo";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CENTER_X = 540;
const PILE_Y = 720;
const FINAL_Y = 1140;

const OTHER_CHIPS = [
  {dx: -260, dy: -110, color: "#64748B"},
  {dx: -150, dy: 140, color: "#8B5CF6"},
  {dx: 20, dy: -220, color: "#F87171"},
  {dx: 190, dy: 110, color: "#34D399"},
  {dx: 300, dy: -60, color: "#F59E0B"},
  {dx: -80, dy: 240, color: "#60A5FA"},
];

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const pileIn = progress01(frame, 0, durationInFrames * 0.2);
  const separate = progress01(frame, durationInFrames * 0.2, durationInFrames * 0.62);
  const reveal = progress01(frame, durationInFrames * 0.52, durationInFrames * 0.72);
  const labelIn = progress01(frame, durationInFrames * 0.68, durationInFrames * 0.84);

  const chips = useMemo(() => OTHER_CHIPS, []);

  const goX = CENTER_X;
  const goY = PILE_Y + (FINAL_Y - PILE_Y) * separate;
  const goSize = 64 + (190 - 64) * separate;

  return (
    <AbsoluteFill>
      {chips.map((chip, i) => {
        const stagger = progress01(frame, i * 3, i * 3 + 14);
        const outward = 1 + separate * 0.9;
        const opacity = stagger * (1 - separate * 0.85);
        const x = CENTER_X + chip.dx * (0.4 + outward * 0.6) * pileIn;
        const y = PILE_Y + chip.dy * (0.4 + outward * 0.6) * pileIn;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - 30,
              top: y - 30,
              width: 60,
              height: 60,
              borderRadius: 14,
              background: chip.color,
              opacity: Math.max(0, opacity),
              boxShadow: `0 0 18px ${chip.color}66`,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          left: goX - 30,
          top: goY - 30,
          width: 60,
          height: 60,
          borderRadius: 14,
          background: "#64748B",
          opacity: Math.max(0, pileIn * (1 - reveal)),
          boxShadow: "0 0 18px rgba(100,116,139,0.4)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: goX - goSize / 2,
          top: goY - goSize / 2,
          opacity: pileIn * reveal,
        }}
      >
        <GoLogo size={goSize} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: FINAL_Y + 130,
          textAlign: "center",
          opacity: labelIn,
          transform: `translateY(${(1 - labelIn) * 12}px)`,
          color: COLORS.white,
          fontFamily: FONTS.sans,
          fontSize: 40,
          fontWeight: 780,
          letterSpacing: 1,
        }}
      >
        Go
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
