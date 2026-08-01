import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertOctagon, CloudOff, Eye} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Ownership: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const dataIn = progress01(frame, 0, 24);
  const boundaryIn = progress01(frame, 28, 52);
  const dangerIn = progress01(frame, 56, 80);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - dataIn) * 12}px)`,
              opacity: dataIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Eye size={56} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                padding: "16px 22px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.cyan}88`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 700,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              data "aws_ami" "base"
            </div>
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
              read-only
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 240,
              width: 1,
              height: 200,
              background: COLORS.border,
              opacity: boundaryIn,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - boundaryIn) * 12}px)`,
              opacity: boundaryIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750, textAlign: "center"}}>
              outside boundary
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 700}}>
              existing VPC / AMI
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: dangerIn,
              display: "flex",
              alignItems: "center",
              gap: 36,
            }}
          >
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
              <CloudOff size={48} color={COLORS.red} strokeWidth={1.6} />
              <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
                orphans
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
              <AlertOctagon size={48} color={COLORS.red} strokeWidth={1.6} />
              <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
                destroy shared
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
