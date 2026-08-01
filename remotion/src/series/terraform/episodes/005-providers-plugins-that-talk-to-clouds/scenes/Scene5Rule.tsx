import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Download, Hexagon, Puzzle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TILES = [
  {label: "Orchestrate", icon: Hexagon, color: COLORS.cyan},
  {label: "Implement", icon: Puzzle, color: COLORS.kubernetesBlue},
  {label: "Install", icon: Download, color: COLORS.green},
] as const;

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={620} accent={COLORS.green}>
          {TILES.map((tile, i) => {
            const tileIn = progress01(frame, 8 + i * 22, 30 + i * 22);
            const Icon = tile.icon;
            return (
              <div
                key={tile.label}
                style={{
                  position: "absolute",
                  left: 160 + i * 280,
                  top: 310,
                  transform: `translate(-50%, -50%) translateY(${(1 - tileIn) * 14}px) scale(${0.9 + tileIn * 0.1})`,
                  opacity: tileIn,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                  width: 220,
                  padding: "24px 16px",
                  borderRadius: 14,
                  border: `1.5px solid ${tile.color}88`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <Icon size={52} color={tile.color} strokeWidth={1.6} />
                <div style={{color: tile.color, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 780}}>
                  {tile.label}
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
