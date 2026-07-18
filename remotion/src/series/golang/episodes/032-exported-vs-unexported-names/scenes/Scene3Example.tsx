import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Globe} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Example: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const boxIn = progress01(frame, 0, 20);
  const row1In = progress01(frame, 26, 46);
  const row2In = progress01(frame, 60, 80);

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
        <Panel width={960} height={780}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 60,
              transform: "translate(-50%, -50%)",
              opacity: boxIn,
              color: COLORS.muted,
              fontFamily: FONTS.mono,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            package fmt
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - row1In) * 10}px)`,
              opacity: row1In,
              display: "flex",
              alignItems: "center",
              gap: 22,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.white,
                fontFamily: FONTS.mono,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              <span style={{color: COLORS.cyan}}>P</span>rintln
            </div>
            <div style={{color: COLORS.white, fontSize: 26}}>→</div>
            <Globe size={54} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              callable anywhere
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 400,
              width: 960,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: `translate(-50%, -50%) translateY(${(1 - row2In) * 10}px)`,
              opacity: row2In,
              display: "flex",
              alignItems: "center",
              gap: 22,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.border}`,
                color: COLORS.muted,
                fontFamily: FONTS.mono,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              <span style={{color: COLORS.red}}>p</span>arseConfig
            </div>
            <div style={{color: COLORS.red, fontSize: 26, fontWeight: 800}}>
              ✕
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              invisible outside package
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
