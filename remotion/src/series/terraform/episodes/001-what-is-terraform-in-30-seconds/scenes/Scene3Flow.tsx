import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TILES = [
  {label: "Desired", color: COLORS.white},
  {label: "Plan", color: COLORS.cyan},
  {label: "Apply", color: COLORS.green},
  {label: "State", color: COLORS.kubernetesBlue},
] as const;

export const Scene3Flow: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={960} height={720}>
          {TILES.map((tile, i) => {
            const tileIn = progress01(frame, 8 + i * 18, 28 + i * 18);
            const x = 140 + i * 200;
            return (
              <React.Fragment key={tile.label}>
                <div
                  style={{
                    position: "absolute",
                    left: x,
                    top: 320,
                    transform: `translate(-50%, -50%) translateY(${(1 - tileIn) * 14}px)`,
                    opacity: tileIn,
                    width: 160,
                    padding: "24px 16px",
                    borderRadius: 14,
                    border: `1.5px solid ${tile.color}88`,
                    background: "rgba(15, 23, 42, 0.55)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: tile.color,
                      fontFamily: FONTS.mono,
                      fontSize: 40,
                      fontWeight: 800,
                      textShadow: `0 0 12px ${tile.color}55`,
                    }}
                  >
                    {tile.label}
                  </div>
                </div>
                {i < TILES.length - 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      left: x + 100,
                      top: 300,
                      opacity: tileIn,
                    }}
                  >
                    <Arrow direction="right" size={36} color={COLORS.muted} />
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: progress01(frame, 80, 100),
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            declare → preview → execute → map IDs
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
