import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const codeCard = (border: string): React.CSSProperties => ({
  width: 380,
  borderRadius: 16,
  border: `1.5px solid ${border}`,
  background: "rgba(7,12,24,0.9)",
  padding: "22px 24px",
  fontFamily: FONTS.mono,
  fontSize: 21,
  lineHeight: 1.6,
});

export const Scene2Philosophy: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const leftBadge = progress01(frame, 20, 36);
  const rightIn = progress01(frame, 16, 34);
  const rightBadge = progress01(frame, 40, 58);

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
        <Panel width={880} height={560}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 70,
              opacity: leftIn,
              transform: `translateY(${(1 - leftIn) * 12}px)`,
            }}
          >
            <div style={codeCard(COLORS.red)}>
              <div style={{color: COLORS.muted}}>// increment i</div>
              <div style={{color: COLORS.white}}>i++</div>
            </div>
            <div style={{marginTop: 16, display: "flex", justifyContent: "center", opacity: leftBadge}}>
              <XCircle size={50} color={COLORS.red} strokeWidth={1.8} />
            </div>
            <div style={{marginTop: 10, textAlign: "center", color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
              repeats the code
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 460,
              top: 70,
              opacity: rightIn,
              transform: `translateY(${(1 - rightIn) * 12}px)`,
            }}
          >
            <div style={{...codeCard(COLORS.green), fontSize: 19}}>
              <div style={{color: COLORS.green}}>// retry budget exhausted,</div>
              <div style={{color: COLORS.green}}>// stop hammering upstream</div>
              <div style={{color: COLORS.white, marginTop: 4}}>retries--</div>
            </div>
            <div style={{marginTop: 16, display: "flex", justifyContent: "center", opacity: rightBadge}}>
              <Checkmark progress={rightBadge} size={50} />
            </div>
            <div style={{marginTop: 10, textAlign: "center", color: COLORS.white, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
              explains why
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
