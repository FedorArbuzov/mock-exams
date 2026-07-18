import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileCode, Folder, PackagePlus, Play} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CENTER = {x: 410, y: 420};
const NODES = [
  {label: "create folder", Icon: Folder, x: 410, y: 140},
  {label: "init module", Icon: PackagePlus, x: 680, y: 420},
  {label: "package main", Icon: FileCode, x: 410, y: 700},
  {label: "run it", Icon: Play, x: 140, y: 420},
];

export const Scene3CoreLoop: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={820} height={840}>
          <svg width={820} height={840} style={{position: "absolute"}}>
            {NODES.map((n, i) => {
              const next = NODES[(i + 1) % NODES.length];
              const lineIn = progress01(frame, 20 + i * 16, 40 + i * 16);
              const midX = (n.x + next.x) / 2 + (CENTER.x - (n.x + next.x) / 2) * 0.35;
              const midY = (n.y + next.y) / 2 + (CENTER.y - (n.y + next.y) / 2) * 0.35;
              return (
                <path
                  key={i}
                  d={`M${n.x},${n.y} Q${midX},${midY} ${next.x},${next.y}`}
                  stroke={COLORS.cyan}
                  strokeWidth={2.2}
                  fill="none"
                  opacity={0.5 * lineIn}
                  strokeDasharray={300}
                  strokeDashoffset={300 * (1 - lineIn)}
                />
              );
            })}
          </svg>

          {NODES.map((n, i) => {
            const delay = 6 + i * 16;
            const nodeIn = progress01(frame, delay, delay + 16);
            const Icon = n.Icon;
            return (
              <div
                key={n.label}
                style={{
                  position: "absolute",
                  left: n.x,
                  top: n.y,
                  transform: `translate(-50%, -50%) scale(${0.9 + nodeIn * 0.1})`,
                  opacity: nodeIn,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 22,
                    border: `2px solid ${COLORS.cyan}`,
                    background: COLORS.background,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={58} color={COLORS.cyan} strokeWidth={1.6} />
                </div>
                <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
                  {n.label}
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
