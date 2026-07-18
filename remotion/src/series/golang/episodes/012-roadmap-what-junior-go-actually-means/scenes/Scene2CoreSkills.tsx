import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {ServerIcon, ToolboxIcon} from "../../../../../shared/components/icons";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ORBIT_DOTS = [0, 1, 2];

const GoroutinesIcon: React.FC<{size: number}> = ({size}) => (
  <div style={{position: "relative", width: size, height: size}}>
    <div
      style={{
        position: "absolute",
        left: size / 2 - 6,
        top: size / 2 - 6,
        width: 12,
        height: 12,
        borderRadius: 99,
        background: COLORS.cyan,
      }}
    />
    {ORBIT_DOTS.map((i) => {
      const angle = (i / 3) * Math.PI * 2;
      const r = size * 0.38;
      const x = size / 2 + Math.cos(angle) * r - 5;
      const y = size / 2 + Math.sin(angle) * r - 5;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 10,
            height: 10,
            borderRadius: 99,
            border: `2px solid ${COLORS.cyan}`,
          }}
        />
      );
    })}
  </div>
);

const ArrowReturnIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M12 16v10a6 6 0 0 0 6 6h14M26 26l6 6-6 6" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WAYPOINTS = [
  {label: "HTTP service", render: (c: string) => <ServerIcon size={54} color={c} />},
  {label: "explicit errors", render: (c: string) => <ArrowReturnIcon size={54} color={c} />},
  {label: "clean modules", render: (c: string) => <ToolboxIcon size={70} color={c} />},
  {label: "testing", render: (c: string) => <Checkmark progress={1} size={54} />},
  {label: "goroutines, no leaks", render: () => <GoroutinesIcon size={54} />},
];

export const Scene2CoreSkills: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const TOP = 380;
  const STEP = 220;

  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" style={{position: "absolute"}}>
        {WAYPOINTS.slice(0, -1).map((_, i) => {
          const lineIn = progress01(frame, 10 + i * 22, 10 + i * 22 + 18);
          return (
            <line
              key={i}
              x1={540}
              y1={TOP + i * STEP + 40}
              x2={540}
              y2={TOP + i * STEP + STEP * lineIn - 40 * (1 - lineIn)}
              stroke={COLORS.cyan}
              strokeWidth={2}
              opacity={0.6}
            />
          );
        })}
      </svg>

      {WAYPOINTS.map((w, i) => {
        const dotIn = progress01(frame, 6 + i * 22, 6 + i * 22 + 16);
        return (
          <div
            key={w.label}
            style={{
              position: "absolute",
              left: "50%",
              top: TOP + i * STEP,
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 22,
              opacity: dotIn,
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: 99,
                border: `2px solid ${COLORS.cyan}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 18px ${COLORS.glowCyan}`,
              }}
            >
              {w.render(COLORS.cyan)}
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 680}}>
              {w.label}
            </div>
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
