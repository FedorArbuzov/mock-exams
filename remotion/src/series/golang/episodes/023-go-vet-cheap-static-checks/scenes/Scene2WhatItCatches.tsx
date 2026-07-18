import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Ban, Percent, Tag, Zap} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CATCHES = [
  {label: "printf mismatch", Icon: Percent},
  {label: "unreachable code", Icon: Ban},
  {label: "suspicious struct tags", Icon: Tag},
  {label: "concurrency footguns", Icon: Zap},
];

export const Scene2WhatItCatches: React.FC<Props> = ({text, durationInFrames}) => {
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
        <Panel width={900} height={780}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 900,
              height: 780,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
            }}
          >
            {CATCHES.map((c, i) => {
              const delay = 6 + i * 20;
              const cellIn = progress01(frame, delay, delay + 16);
              const Icon = c.Icon;
              return (
                <div
                  key={c.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                    opacity: cellIn,
                    transform: `scale(${0.9 + cellIn * 0.1})`,
                    borderRight: i % 2 === 0 ? `1px solid ${COLORS.border}` : undefined,
                    borderBottom: i < 2 ? `1px solid ${COLORS.border}` : undefined,
                  }}
                >
                  <Icon size={72} color={COLORS.cyan} strokeWidth={1.6} />
                  <div
                    style={{
                      color: COLORS.white,
                      fontFamily: FONTS.sans,
                      fontSize: 22,
                      fontWeight: 700,
                      textAlign: "center",
                      maxWidth: 260,
                    }}
                  >
                    {c.label}
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
