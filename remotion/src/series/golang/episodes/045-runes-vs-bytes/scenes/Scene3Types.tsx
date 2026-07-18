import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TILES = [
  {expr: "byte = uint8", delay: 0},
  {expr: "rune = int32", delay: 24},
] as const;

export const Scene3Types: React.FC<Props> = ({text, durationInFrames}) => {
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
            const tileIn = progress01(frame, tile.delay, tile.delay + 22);
            return (
              <div
                key={tile.expr}
                style={{
                  position: "absolute",
                  left: 240 + i * 480,
                  top: 320,
                  transform: `translate(-50%, -50%) translateY(${(1 - tileIn) * 14}px)`,
                  opacity: tileIn,
                  width: 380,
                  padding: "36px 28px",
                  borderRadius: 16,
                  border: `1.5px solid ${COLORS.cyan}66`,
                  background: "rgba(15, 23, 42, 0.65)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 22,
                }}
              >
                <Checkmark progress={tileIn} size={48} />
                <div
                  style={{
                    color: COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: 46,
                    fontWeight: 800,
                    textAlign: "center",
                  }}
                >
                  {tile.expr}
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
