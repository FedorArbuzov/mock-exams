import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {OctagonX} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Ownership: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const libIn = progress01(frame, 0, 18);
  const arrowIn = progress01(frame, 20, 36);
  const mainIn = progress01(frame, 34, 52);
  const badgeIn = progress01(frame, 52, 70);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 820,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={720} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 120,
              transform: `translate(-50%, -50%) translateY(${(1 - libIn) * 14}px)`,
              opacity: libIn,
              width: 380,
              padding: "22px 0",
              borderRadius: 16,
              border: `2px solid ${COLORS.muted}`,
              textAlign: "center",
            }}
          >
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 26, fontWeight: 700}}>
              library
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600, marginTop: 6}}>
              returns an error
            </div>
          </div>

          <div style={{position: "absolute", left: "50%", top: 230, transform: "translate(-50%, 0)", opacity: arrowIn}}>
            <Arrow direction="down" size={50} color={COLORS.red} />
          </div>
          <div
            style={{
              position: "absolute",
              left: "62%",
              top: 260,
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 18,
              fontWeight: 700,
              opacity: arrowIn,
            }}
          >
            error
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 460,
              transform: `translate(-50%, -50%) scale(${0.92 + mainIn * 0.08})`,
              opacity: mainIn,
              width: 420,
              padding: "26px 0",
              borderRadius: 18,
              border: `2.5px solid ${COLORS.cyan}`,
              background: "rgba(34,211,238,0.06)",
              textAlign: "center",
            }}
          >
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 30, fontWeight: 700}}>
              main
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600, marginTop: 6}}>
              decides what happens next
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 610,
              transform: `translate(-50%, -50%) translateY(${(1 - badgeIn) * 10}px)`,
              opacity: badgeIn,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 20px",
              borderRadius: 999,
              border: `2px solid ${COLORS.red}`,
              background: "rgba(248,113,113,0.1)",
            }}
          >
            <OctagonX size={30} color={COLORS.red} strokeWidth={1.8} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              only main can exit
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
