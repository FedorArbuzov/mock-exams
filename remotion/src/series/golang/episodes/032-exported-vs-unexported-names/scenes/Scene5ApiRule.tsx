import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Globe, Lock, MessageCircleQuestion} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5ApiRule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const questionIn = progress01(frame, 0, 20);
  const yesIn = progress01(frame, 34, 54);
  const noIn = progress01(frame, 44, 64);

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
        <Panel width={920} height={780}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 120,
              transform: `translate(-50%, -50%) translateY(${(1 - questionIn) * 10}px)`,
              opacity: questionIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <MessageCircleQuestion size={72} color={COLORS.white} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              does a caller need it?
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 260,
              top: 400,
              transform: `translate(-50%, -50%) translateY(${(1 - yesIn) * 12}px)`,
              opacity: yesIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              yes
            </div>
            <Globe size={80} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              Export (Uppercase)
            </div>
            <Checkmark progress={yesIn} size={44} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 660,
              top: 400,
              transform: `translate(-50%, -50%) translateY(${(1 - noIn) * 12}px)`,
              opacity: noIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              no
            </div>
            <Lock size={80} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              keep lowercase
            </div>
            <Checkmark progress={noIn} size={44} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
