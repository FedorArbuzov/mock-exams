import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Folder} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4NameMatch: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const topIn = progress01(frame, 0, 20);
  const checkIn = progress01(frame, 30, 48);
  const altIn = progress01(frame, 60, 82);
  const altLabelIn = progress01(frame, 92, 112);

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
        <Panel width={920} height={760}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 130,
              width: 920,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
              opacity: topIn,
              transform: `translateY(${(1 - topIn) * 10}px)`,
            }}
          >
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
              <Folder size={70} color={COLORS.cyan} strokeWidth={1.6} />
              <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
                payments/
              </div>
            </div>
            <Arrow direction="right" size={46} color={COLORS.white} />
            <div
              style={{
                padding: "14px 22px",
                borderRadius: 14,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.white,
                fontFamily: FONTS.mono,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              package payments
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 290,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Checkmark progress={checkIn} size={48} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              matches — saves confusion
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 470,
              width: 920,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 570,
              width: 920,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
              opacity: altIn,
              transform: `translateY(${(1 - altIn) * 10}px)`,
            }}
          >
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
              <Folder size={60} color={COLORS.muted} strokeWidth={1.6} />
              <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 20, fontWeight: 700}}>
                utils/
              </div>
            </div>
            <Arrow direction="right" size={40} color={COLORS.muted} />
            <div
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.border}`,
                color: COLORS.muted,
                fontFamily: FONTS.mono,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              package utilities
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 690,
              transform: "translate(-50%, -50%)",
              opacity: altLabelIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 18,
              fontWeight: 650,
            }}
          >
            still compiles — names don&apos;t have to match
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
