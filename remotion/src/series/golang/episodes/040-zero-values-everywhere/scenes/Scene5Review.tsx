import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {MessageCircleQuestion, TriangleAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Review: React.FC<Props> = ({text, durationInFrames}) => {
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
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700, textAlign: "center"}}>
              zero value means...
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
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              ready
            </div>
            <Checkmark progress={yesIn} size={64} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 650, textAlign: "center"}}>
              use it as-is
            </div>
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
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              broken
            </div>
            <TriangleAlert size={58} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 650, textAlign: "center"}}>
              handle it explicitly
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
