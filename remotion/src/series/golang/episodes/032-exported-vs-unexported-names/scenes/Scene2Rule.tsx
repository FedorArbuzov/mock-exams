import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {CaseLower, CaseUpper, Globe, Lock} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 14, 34);
  const arrowIn = progress01(frame, 40, 58);

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
        <Panel width={940} height={800}>
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 140,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <CaseUpper size={72} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
              Uppercase
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 140,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <CaseLower size={72} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
              lowercase
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 260,
              top: 320,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
            }}
          >
            <Arrow direction="down" size={44} color={COLORS.cyan} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 680,
              top: 320,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
            }}
          >
            <Arrow direction="down" size={44} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 260,
              top: 470,
              transform: `translate(-50%, -50%) translateY(${(1 - arrowIn) * 12}px)`,
              opacity: arrowIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Globe size={84} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 750}}>
              exported
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 17, fontWeight: 600}}>
              across packages
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 470,
              transform: `translate(-50%, -50%) translateY(${(1 - arrowIn) * 12}px)`,
              opacity: arrowIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Lock size={84} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 750}}>
              unexported
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 17, fontWeight: 600}}>
              package-only
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
