import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Lock, ShieldAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Authz: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const flowIn = progress01(frame, 0, 22);
  const err401In = progress01(frame, 26, 50);
  const err403In = progress01(frame, 54, 78);

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
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 140,
              transform: "translate(-50%, -50%)",
              opacity: flowIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 750}}>
              request
            </div>
            <Arrow direction="right" size={36} color={COLORS.cyan} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              AuthN
            </div>
            <Arrow direction="right" size={36} color={COLORS.cyan} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              AuthZ
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 260,
              top: 340,
              transform: `translate(-50%, -50%) translateY(${(1 - err401In) * 12}px)`,
              opacity: err401In,
              width: 360,
              padding: "22px 24px",
              borderRadius: 14,
              border: `2px solid ${COLORS.red}`,
              background: "rgba(248, 113, 113, 0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Lock size={52} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 50, fontWeight: 800}}>
              401
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 650}}>
              bad credentials
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 340,
              transform: `translate(-50%, -50%) translateY(${(1 - err403In) * 12}px)`,
              opacity: err403In,
              width: 360,
              padding: "22px 24px",
              borderRadius: 14,
              border: `2px solid ${COLORS.red}`,
              background: "rgba(248, 113, 113, 0.08)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ShieldAlert size={52} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 50, fontWeight: 800}}>
              403
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 650}}>
              RBAC denied
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 580,
              transform: "translate(-50%, -50%)",
              opacity: err403In,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 750,
              textAlign: "center",
              width: 780,
            }}
          >
            logged in but not allowed
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
