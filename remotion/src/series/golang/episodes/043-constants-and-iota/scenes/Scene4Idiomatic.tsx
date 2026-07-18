import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TILES = ["simple", "compile-time", "String()"] as const;

export const Scene4Idiomatic: React.FC<Props> = ({text, durationInFrames}) => {
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
          {TILES.map((label, i) => {
            const tileIn = progress01(frame, 8 + i * 22, 28 + i * 22);
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  left: 160 + i * 280,
                  top: 260,
                  transform: `translate(-50%, -50%) translateY(${(1 - tileIn) * 14}px)`,
                  opacity: tileIn,
                  width: 240,
                  padding: "28px 18px",
                  borderRadius: 16,
                  border: `1.5px solid ${COLORS.cyan}66`,
                  background: "rgba(15, 23, 42, 0.65)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                }}
              >
                <Checkmark progress={tileIn} size={44} />
                <div
                  style={{
                    color: COLORS.white,
                    fontFamily: FONTS.sans,
                    fontSize: 38,
                    fontWeight: 750,
                    textAlign: "center",
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: progress01(frame, 80, 105),
              padding: "18px 28px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.border}`,
              color: COLORS.muted,
              fontFamily: FONTS.mono,
              fontSize: 38,
              fontWeight: 700,
              whiteSpace: "pre",
            }}
          >
            {"switch s {\n  case StatusActive: ...\n}"}
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
