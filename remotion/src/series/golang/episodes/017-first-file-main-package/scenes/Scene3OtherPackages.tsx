import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Package, Terminal} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PANEL_W = 900;
const PANEL_H = 820;
const MAIN = {x: 450, y: 620};
const LIBS = [
  {x: 150, y: 200, label: "utils"},
  {x: 450, y: 160, label: "handlers"},
  {x: 750, y: 200, label: "models"},
];

export const Scene3OtherPackages: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const mainIn = progress01(frame, 46, 66);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 850,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={PANEL_W} height={PANEL_H}>
          <svg width={PANEL_W} height={PANEL_H} style={{position: "absolute"}}>
            {LIBS.map((lib, i) => {
              const lineIn = progress01(frame, 20 + i * 12, 44 + i * 12);
              return (
                <line
                  key={lib.label}
                  x1={lib.x}
                  y1={lib.y + 70}
                  x2={lib.x + (MAIN.x - lib.x) * lineIn}
                  y2={lib.y + 70 + (MAIN.y - 80 - lib.y - 70) * lineIn}
                  stroke={COLORS.cyan}
                  strokeWidth={2.4}
                  opacity={0.6}
                />
              );
            })}
          </svg>

          {LIBS.map((lib, i) => {
            const nodeIn = progress01(frame, 6 + i * 12, 22 + i * 12);
            return (
              <div
                key={lib.label}
                style={{
                  position: "absolute",
                  left: lib.x,
                  top: lib.y,
                  transform: `translate(-50%, -50%) translateY(${(1 - nodeIn) * 14}px)`,
                  opacity: nodeIn,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 20,
                    border: `2px solid ${COLORS.muted}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Package size={54} color={COLORS.muted} strokeWidth={1.7} />
                </div>
                <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 650}}>
                  {lib.label}
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: MAIN.x,
              top: MAIN.y,
              transform: `translate(-50%, -50%) scale(${0.9 + mainIn * 0.1})`,
              opacity: mainIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 168,
                height: 168,
                borderRadius: 28,
                border: `2.5px solid ${COLORS.green}`,
                background: "rgba(52,211,153,0.1)",
                boxShadow: `0 0 30px ${COLORS.glowGreen}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Terminal size={92} color={COLORS.green} strokeWidth={1.7} />
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 28, fontWeight: 700}}>
              package main
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
