import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ArrowRightLeft, StickyNote} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const arrowIn = progress01(frame, 30, 48);
  const rightIn = progress01(frame, 46, 66);
  const noteIn = progress01(frame, 82, 102);

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
        <Panel width={940} height={720}>
          <div
            style={{
              position: "absolute",
              left: 230,
              top: 200,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 34,
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            types differ
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 200,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
            }}
          >
            <Arrow direction="right" size={50} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 200,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ArrowRightLeft size={54} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              convert explicitly
            </div>
            <Checkmark progress={rightIn} size={40} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 380,
              width: 940,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: `translate(-50%, -50%) translateY(${(1 - noteIn) * 10}px)`,
              opacity: noteIn,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <StickyNote size={48} color={COLORS.white} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              comment why, when it&apos;s not obvious
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
