import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertCircle, ListChecks, PenLine, Terminal} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PANEL_W = 900;
const PANEL_H = 780;
const HUB = {x: 450, y: 190};
const SPOKES = [
  {x: 150, y: 560, label: "diagnostics", Icon: AlertCircle, color: COLORS.red},
  {x: 450, y: 600, label: "completions", Icon: ListChecks, color: COLORS.green},
  {x: 750, y: 560, label: "renames", Icon: PenLine, color: COLORS.cyan},
];

export const Scene2WhatIsIt: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const hubIn = progress01(frame, 0, 18);

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
            {SPOKES.map((s, i) => {
              const lineIn = progress01(frame, 26 + i * 14, 48 + i * 14);
              return (
                <line
                  key={s.label}
                  x1={HUB.x}
                  y1={HUB.y + 62}
                  x2={HUB.x + (s.x - HUB.x) * lineIn}
                  y2={HUB.y + 62 + (s.y - 70 - HUB.y - 62) * lineIn}
                  stroke={s.color}
                  strokeWidth={2.4}
                  opacity={0.7}
                />
              );
            })}
          </svg>

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
              gap: 14,
            }}
          >
            <div
              style={{
                width: 168,
                height: 168,
                borderRadius: 28,
                border: `2.5px solid ${COLORS.cyan}`,
                background: "rgba(34,211,238,0.1)",
                boxShadow: `0 0 30px ${COLORS.glowCyan}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Terminal size={92} color={COLORS.cyan} strokeWidth={1.7} />
            </div>
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 30, fontWeight: 700}}>
              gopls
            </div>
          </div>

          {SPOKES.map((s, i) => {
            const nodeIn = progress01(frame, 40 + i * 14, 60 + i * 14);
            const Icon = s.Icon;
            return (
              <div
                key={s.label}
                style={{
                  position: "absolute",
                  left: s.x,
                  top: s.y,
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
                    border: `2px solid ${s.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={54} color={s.color} strokeWidth={1.8} />
                </div>
                <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 680}}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
