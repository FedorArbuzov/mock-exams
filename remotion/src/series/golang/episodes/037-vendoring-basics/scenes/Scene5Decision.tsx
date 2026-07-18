import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Archive, ShieldCheck} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Decision: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const orIn = progress01(frame, 30, 46);
  const rightIn = progress01(frame, 40, 62);

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
        <Panel width={940} height={700}>
          <div
            style={{
              position: "absolute",
              left: 250,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Archive size={76} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, textAlign: "center"}}>
              must hermetically
              <br />
              seal deps
            </div>
            <Checkmark progress={leftIn} size={44} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              vendor
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 470,
              top: 60,
              width: 1,
              height: 580,
              background: COLORS.border,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 300,
              transform: "translate(-50%, -50%)",
              opacity: orIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 800,
              background: COLORS.background,
              padding: "6px 14px",
              borderRadius: 999,
              border: `1.5px solid ${COLORS.border}`,
            }}
          >
            OR
          </div>

          <div
            style={{
              position: "absolute",
              left: 690,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <ShieldCheck size={76} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, textAlign: "center"}}>
              otherwise
            </div>
            <Checkmark progress={rightIn} size={44} />
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
              tidy + checksums
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
