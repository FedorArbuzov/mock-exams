import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ROWS = [
  {type: "int", use: "counters, indexes", cyan: true},
  {type: "int64", use: "timestamps, IDs"},
  {type: "uint32", use: "packed binary formats"},
  {type: "float64", use: "math — not money"},
];

export const Scene2Sizes: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={960} height={880}>
          {ROWS.map((row, i) => {
            const delay = 10 + i * 26;
            const rowIn = progress01(frame, delay, delay + 20);
            return (
              <div
                key={row.type}
                style={{
                  position: "absolute",
                  left: 60,
                  top: 90 + i * 190,
                  opacity: rowIn,
                  transform: `translateY(${(1 - rowIn) * 10}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <div
                  style={{
                    padding: "14px 22px",
                    borderRadius: 12,
                    border: `1.5px solid ${row.cyan ? COLORS.cyan : COLORS.border}`,
                    color: row.cyan ? COLORS.cyan : COLORS.white,
                    fontFamily: FONTS.mono,
                    fontSize: 42,
                    fontWeight: 700,
                    minWidth: 160,
                    textAlign: "center",
                  }}
                >
                  {row.type}
                </div>
                <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
                  {row.use}
                </div>
                {row.cyan && <Checkmark progress={rowIn} size={36} />}
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
