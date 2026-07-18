import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const plusIn = progress01(frame, 16, 30);
  const rightIn = progress01(frame, 20, 38);
  const arrowIn = progress01(frame, 44, 60);
  const resultIn = progress01(frame, 58, 76);

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
        <Panel width={900} height={620}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 60,
              width: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                opacity: leftIn,
                padding: "18px 24px",
                borderRadius: 14,
                border: `2px solid ${COLORS.cyan}`,
                background: "rgba(34,211,238,0.06)",
              }}
            >
              <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 16, fontWeight: 650}}>
                where hosted
              </div>
              <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
                github.com/acme
              </div>
            </div>

            <div style={{opacity: plusIn, color: COLORS.white, fontSize: 34, fontWeight: 800}}>+</div>

            <div
              style={{
                opacity: rightIn,
                padding: "18px 24px",
                borderRadius: 14,
                border: `2px solid ${COLORS.green}`,
                background: "rgba(52,211,153,0.06)",
              }}
            >
              <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 16, fontWeight: 650}}>
                package
              </div>
              <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
                /payments
              </div>
            </div>
          </div>

          <div style={{position: "absolute", left: "50%", top: 280, transform: "translate(-50%, 0)", opacity: arrowIn}}>
            <Arrow direction="down" size={50} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 440,
              transform: "translate(-50%, -50%)",
              opacity: resultIn,
              padding: "22px 34px",
              borderRadius: 16,
              border: `2px solid ${COLORS.white}`,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            github.com/acme/payments
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
