import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {MessageCircleQuestion, Terminal} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Habit: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const arrowIn = progress01(frame, 30, 48);
  const rightIn = progress01(frame, 46, 66);
  const checkIn = progress01(frame, 78, 96);

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
        <Panel width={960} height={620}>
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <MessageCircleQuestion size={80} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, textAlign: "center"}}>
              mystery helper
              <br />
              from a forum post
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
            }}
          >
            <Arrow direction="right" size={54} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 740,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Terminal size={80} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              go doc first
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 480,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Checkmark progress={checkIn} size={54} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750}}>
              know before you import
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
