import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, GitPullRequest} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const codeCard: React.CSSProperties = {
  width: 400,
  borderRadius: 16,
  background: "rgba(7,12,24,0.9)",
  padding: "20px 24px",
  fontFamily: FONTS.mono,
  fontSize: 20,
  lineHeight: 1.6,
};

export const Scene4Honesty: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const warnIn = progress01(frame, 20, 38);
  const arrowIn = progress01(frame, 40, 56);
  const rightIn = progress01(frame, 54, 72);
  const checkIn = progress01(frame, 70, 88);

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
        <Panel width={760} height={780}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 100,
              transform: "translate(-50%, -50%)",
              opacity: leftIn,
            }}
          >
            <div style={{...codeCard, border: `1.5px solid ${COLORS.red}66`}}>
              <div style={{color: COLORS.muted}}>// always returns nil</div>
              <div style={{color: COLORS.white}}>return err</div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 210,
              transform: "translate(-50%, -50%)",
              opacity: warnIn,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <AlertTriangle size={34} color={COLORS.red} strokeWidth={1.8} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              comment lied
            </div>
          </div>

          <div style={{position: "absolute", left: "50%", top: 300, transform: "translate(-50%, 0)", opacity: arrowIn}}>
            <Arrow direction="down" size={50} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 480,
              transform: "translate(-50%, -50%)",
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <GitPullRequest size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{...codeCard, border: `1.5px solid ${COLORS.green}66`}}>
              <div style={{color: COLORS.green}}>// may return an error</div>
              <div style={{color: COLORS.white}}>return err</div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 690,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Checkmark progress={checkIn} size={50} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              updated in the same PR
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
