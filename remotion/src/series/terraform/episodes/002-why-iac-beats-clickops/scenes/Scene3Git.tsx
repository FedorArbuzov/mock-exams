import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {GitPullRequest, GitBranch} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Git: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const gitIn = progress01(frame, 0, 22);
  const prIn = progress01(frame, 24, 46);
  const planIn = progress01(frame, 50, 74);
  const checkIn = progress01(frame, 78, 98);

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
              left: 200,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - gitIn) * 12}px)`,
              opacity: gitIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <GitBranch size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 40,
                fontWeight: 800,
              }}
            >
              Git
            </div>
          </div>

          <div style={{position: "absolute", left: 340, top: 260, opacity: prIn}}>
            <Arrow direction="right" size={40} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 480,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - prIn) * 12}px)`,
              opacity: prIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <GitPullRequest size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.sans,
                fontSize: 38,
                fontWeight: 750,
              }}
            >
              pull request
            </div>
          </div>

          <div style={{position: "absolute", left: 620, top: 260, opacity: planIn}}>
            <Arrow direction="right" size={40} color={COLORS.muted} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 760,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - planIn) * 12}px)`,
              opacity: planIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                padding: "16px 24px",
                borderRadius: 12,
                border: `2px solid ${COLORS.green}`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 800,
                boxShadow: `0 0 20px ${COLORS.glowGreen}`,
              }}
            >
              plan
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12, opacity: checkIn}}>
              <Checkmark progress={checkIn} size={36} />
              <div
                style={{
                  color: COLORS.green,
                  fontFamily: FONTS.sans,
                  fontSize: 34,
                  fontWeight: 750,
                }}
              >
                review before apply
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: checkIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            reruns, not archaeology
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
