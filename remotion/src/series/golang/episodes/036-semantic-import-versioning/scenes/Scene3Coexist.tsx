import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {TrendingUp} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Coexist: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const row1In = progress01(frame, 0, 22);
  const row2In = progress01(frame, 34, 56);
  const labelIn = progress01(frame, 78, 98);

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
        <Panel width={940} height={780}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 140,
              opacity: row1In,
              transform: `translateY(${(1 - row1In) * 10}px)`,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.border}`,
                color: COLORS.muted,
                fontFamily: FONTS.mono,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              lib/v1
            </div>
            <Checkmark progress={row1In} size={44} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 21, fontWeight: 700}}>
              consumers keep working
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 340,
              width: 940,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 60,
              top: 460,
              opacity: row2In,
              transform: `translateY(${(1 - row2In) * 10}px)`,
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              lib/v2
            </div>
            <TrendingUp size={44} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 21, fontWeight: 700}}>
              evolves independently
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 660,
              transform: `translate(-50%, -50%) translateY(${(1 - labelIn) * 10}px)`,
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            different paths — so neither breaks the other
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
