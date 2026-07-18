import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, Package, Play} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Mistake: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const rightIn = progress01(frame, 14, 32);
  const warnIn = progress01(frame, 36, 56);
  const wobble = Math.sin(frame * 0.3) * (warnIn > 0.3 ? 3 : 0);

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
        <Panel width={880} height={620}>
          <svg width={880} height={620} style={{position: "absolute"}}>
            <line
              x1={230}
              y1={160}
              x2={650}
              y2={160}
              stroke={COLORS.muted}
              strokeWidth={2}
              strokeDasharray="8 10"
              opacity={0.5}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: 230,
              top: 160,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 16}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Play size={82} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              go run
            </div>
            <Checkmark progress={leftIn} size={54} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600}}>
              works fine
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 650,
              top: 160,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 16}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Package size={82} color={COLORS.muted} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              built binary
            </div>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 999,
                border: `2px solid ${COLORS.muted}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.muted,
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              ?
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 600}}>
              never checked
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 440,
              top: 160,
              transform: `translate(-50%, -50%) rotate(${wobble}deg)`,
              opacity: warnIn,
            }}
          >
            <AlertTriangle size={70} color={COLORS.red} strokeWidth={1.6} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 340,
              transform: "translate(-50%, -50%)",
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 26,
              fontWeight: 750,
              opacity: warnIn,
            }}
          >
            same behavior?
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 440,
              transform: "translate(-50%, -50%)",
              width: 700,
              textAlign: "center",
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 700,
              opacity: warnIn,
            }}
          >
            build it before you tag a release
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
