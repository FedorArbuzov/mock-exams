import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LINES = [
  {code: "x := 42", highlight: false},
  {code: "p := &x", highlight: true, op: "&"},
  {code: "*p = 99", highlight: true, op: "*"},
] as const;

export const Scene2Basics: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const ampIn = progress01(frame, 24, 42);
  const starIn = progress01(frame, 46, 64);
  const rightIn = progress01(frame, 68, 88);

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
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "20px 24px",
              borderRadius: 12,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            {LINES.map((line) => (
              <div
                key={line.code}
                style={{
                  color: line.highlight ? COLORS.cyan : COLORS.muted,
                  fontFamily: FONTS.mono,
                  fontSize: 42,
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                {line.code}
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: 520,
              top: 220,
              transform: "translate(-50%, -50%)",
              opacity: ampIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                border: `2px solid ${COLORS.cyan}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 50,
                fontWeight: 800,
                textShadow: `0 0 12px ${COLORS.glowCyan}`,
              }}
            >
              &
            </div>
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              address-of
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 520,
              top: 380,
              opacity: ampIn * starIn,
            }}
          >
            <Arrow direction="down" size={44} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                border: `2px solid ${COLORS.green}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 50,
                fontWeight: 800,
                textShadow: `0 0 12px ${COLORS.glowGreen}`,
              }}
            >
              *
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              dereference
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
