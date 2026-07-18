import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Immutable: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const xIn = progress01(frame, 18, 36);
  const arrowIn = progress01(frame, 38, 54);
  const rightIn = progress01(frame, 52, 72);

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
              left: 220,
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{position: "relative"}}>
              <div
                style={{
                  padding: "16px 24px",
                  borderRadius: 12,
                  border: `1.5px solid ${COLORS.red}66`,
                  color: COLORS.red,
                  fontFamily: FONTS.mono,
                  fontSize: 46,
                  fontWeight: 700,
                  textDecoration: xIn > 0.15 ? "line-through" : "none",
                  opacity: 0.55 + xIn * 0.45,
                }}
              >
                {"s[0] = 'A'"}
              </div>
              <div style={{position: "absolute", right: -18, top: -18, opacity: xIn}}>
                <XCircle size={42} color={COLORS.red} fill={COLORS.background} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              won&apos;t compile
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 240,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
            }}
          >
            <Arrow direction="right" size={50} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 740,
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              []rune(s)
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 700}}>
              or
            </div>
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              strings.Builder
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              Builder
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
