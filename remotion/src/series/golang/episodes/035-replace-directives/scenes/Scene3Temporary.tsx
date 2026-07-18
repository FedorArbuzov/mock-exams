import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Package, StickyNote, Wrench} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Temporary: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 14, 34);
  const noteIn = progress01(frame, 66, 86);

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
              left: 260,
              top: 190,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Wrench size={78} color={COLORS.green} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.green,
                fontFamily: FONTS.sans,
                fontSize: 20,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              local dev &amp;
              <br />
              emergency patch
            </div>
            <Checkmark progress={leftIn} size={40} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 190,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Package size={78} color={COLORS.muted} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.muted,
                fontFamily: FONTS.sans,
                fontSize: 20,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              long-term
              <br />
              publishing strategy
            </div>
            <div style={{color: COLORS.red, fontSize: 22, fontWeight: 800}}>✕</div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 460,
              width: 940,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 600,
              transform: `translate(-50%, -50%) translateY(${(1 - noteIn) * 10}px)`,
              opacity: noteIn,
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <StickyNote size={50} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              comment why it&apos;s there
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
