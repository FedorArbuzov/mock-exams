import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TILES = [
  {label: "Intent", sub: "files"},
  {label: "Diff", sub: "plan"},
  {label: "Change", sub: "apply"},
  {label: "Map", sub: "state"},
] as const;

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={920} height={680} accent={COLORS.green}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 820,
            }}
          >
            {TILES.map((tile, i) => {
              const tileIn = progress01(frame, 8 + i * 16, 28 + i * 16);
              return (
                <div
                  key={tile.label}
                  style={{
                    transform: `translateY(${(1 - tileIn) * 12}px)`,
                    opacity: tileIn,
                    padding: "28px 24px",
                    borderRadius: 14,
                    border: `1.5px solid ${COLORS.border}`,
                    background: "rgba(15, 23, 42, 0.55)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      color: COLORS.green,
                      fontFamily: FONTS.mono,
                      fontSize: 44,
                      fontWeight: 800,
                      textShadow: `0 0 16px ${COLORS.glowGreen}`,
                    }}
                  >
                    {tile.label}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      color: COLORS.muted,
                      fontFamily: FONTS.sans,
                      fontSize: 34,
                      fontWeight: 700,
                    }}
                  >
                    {tile.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
