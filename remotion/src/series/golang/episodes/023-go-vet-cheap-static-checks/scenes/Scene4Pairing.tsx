import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Pairing: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 14, 34);
  const labelIn = progress01(frame, 44, 62);

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
        <Panel width={900} height={700}>
          <div
            style={{
              position: "absolute",
              left: 300,
              top: 300,
              transform: `translate(-50%, -50%) scale(${0.9 + leftIn * 0.1})`,
              opacity: leftIn,
              width: 380,
              height: 380,
              borderRadius: 999,
              border: `2.5px solid ${COLORS.cyan}`,
              background: "rgba(34,211,238,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              textAlign: "center",
              padding: "0 40px",
            }}
          >
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
              go vet
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 17, fontWeight: 600}}>
              format mismatches
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 17, fontWeight: 600}}>
              unreachable code
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 600,
              top: 300,
              transform: `translate(-50%, -50%) scale(${0.9 + rightIn * 0.1})`,
              opacity: rightIn,
              width: 380,
              height: 380,
              borderRadius: 999,
              border: `2.5px solid ${COLORS.green}`,
              background: "rgba(52,211,153,0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              textAlign: "center",
              padding: "0 40px",
            }}
          >
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
              tests
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 17, fontWeight: 600}}>
              logic errors
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 17, fontWeight: 600}}>
              wrong behavior
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 600,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 750,
              width: 700,
              textAlign: "center",
            }}
          >
            together: full coverage
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
