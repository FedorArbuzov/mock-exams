import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {Pod} from "../../../icons/Pod";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Notready: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const killIn = progress01(frame, 0, 24);
  const statusIn = progress01(frame, 28, 52);
  const effectIn = progress01(frame, 56, 82);

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
              top: 160,
              transform: `translate(-50%, -50%) translateY(${(1 - killIn) * 12}px)`,
              opacity: killIn,
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "18px 28px",
              borderRadius: 14,
              border: `2px solid ${COLORS.red}`,
              background: "rgba(248, 113, 113, 0.08)",
            }}
          >
            <XCircle size={52} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 750}}>
              kubelet stopped
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 340,
              transform: "translate(-50%, -50%)",
              opacity: statusIn,
              width: 780,
              padding: "24px 28px",
              borderRadius: 16,
              border: `2px solid ${COLORS.red}`,
              background: "rgba(15, 23, 42, 0.55)",
              textAlign: "center",
            }}
          >
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 50, fontWeight: 800}}>
              NotReady
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 34, fontWeight: 650, marginTop: 10}}>
              Ready=False · KubeletNotReady
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: "translate(-50%, -50%)",
              opacity: effectIn,
              display: "flex",
              gap: 24,
              alignItems: "center",
            }}
          >
            <Pod label="old pod" width={110} height={85} status="healthy" />
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 700}}>
              still running
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 660,
              transform: "translate(-50%, -50%)",
              opacity: effectIn,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 34,
              fontWeight: 650,
            }}
          >
            no new Pods scheduled here
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
