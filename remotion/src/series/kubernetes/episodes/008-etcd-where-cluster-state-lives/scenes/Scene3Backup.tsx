import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {HardDrive, CloudUpload} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = ["snapshot on schedule", "copy off-cluster", "test restore"] as const;

export const Scene3Backup: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const clusterIn = progress01(frame, 0, 22);
  const arrowIn = progress01(frame, 26, 42);
  const cloudIn = progress01(frame, 44, 64);

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
        <Panel width={920} height={720}>
          <div
            style={{
              position: "absolute",
              left: 220,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - clusterIn) * 12}px)`,
              opacity: clusterIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <HardDrive size={120} color={COLORS.kubernetesBlue} strokeWidth={1.5} />
            <div style={{color: COLORS.kubernetesBlue, fontFamily: FONTS.mono, fontSize: 42, fontWeight: 780}}>
              etcd snapshot
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 460,
              top: 260,
              opacity: arrowIn,
            }}
          >
            <Arrow direction="right" size={48} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 700,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - cloudIn) * 12}px)`,
              opacity: cloudIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <CloudUpload size={120} color={COLORS.green} strokeWidth={1.5} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 780}}>
              off-cluster
            </div>
          </div>

          {STEPS.map((step, i) => {
            const stepIn = progress01(frame, 52 + i * 24, 72 + i * 24);
            return (
              <div
                key={step}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 480 + i * 72,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 10}px)`,
                  opacity: stepIn,
                  color: COLORS.cyan,
                  fontFamily: FONTS.mono,
                  fontSize: 40,
                  fontWeight: 750,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                {i + 1}. {step}
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
