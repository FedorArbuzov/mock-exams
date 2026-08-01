import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {GitCompare, Target, XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {TfFile} from "../../../icons/TfFile";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Declare: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const midIn = progress01(frame, 24, 48);
  const rightIn = progress01(frame, 52, 76);

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
              left: 220,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Target size={56} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.sans,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              desired state
            </div>
          </div>

          <div style={{position: "absolute", left: 380, top: 240, opacity: midIn}}>
            <Arrow direction="right" size={40} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 520,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - midIn) * 12}px)`,
              opacity: midIn,
            }}
          >
            <TfFile
              size={220}
              lines={['resource "aws_s3_bucket" "data" {', "  bucket = my-bucket", "}"]}
            />
          </div>

          <div style={{position: "absolute", left: 660, top: 240, opacity: rightIn}}>
            <Arrow direction="right" size={40} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 780,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <GitCompare size={56} color={COLORS.green} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 40,
                fontWeight: 800,
              }}
            >
              diff
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 280,
              top: 480,
              transform: "translate(-50%, -50%)",
              opacity: leftIn * (1 - midIn * 0.5),
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <XCircle size={36} color={COLORS.red} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.red,
                fontFamily: FONTS.sans,
                fontSize: 34,
                fontWeight: 700,
                textDecoration: "line-through",
              }}
            >
              procedural checklist
            </div>
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
