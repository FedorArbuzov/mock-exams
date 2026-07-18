import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {Pod} from "../../../icons/Pod";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const FACTORS = ["CPU", "memory", "taints", "affinity"] as const;

export const Scene2Define: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const schedIn = progress01(frame, 0, 22);
  const pickIn = progress01(frame, 40, 62);
  const bindIn = progress01(frame, 66, 86);

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
              transform: `translate(-50%, -50%) translateY(${(1 - schedIn) * 12}px)`,
              opacity: schedIn,
              color: COLORS.cyan,
              fontFamily: FONTS.mono,
              fontSize: 46,
              fontWeight: 800,
              textShadow: `0 0 16px ${COLORS.glowCyan}`,
            }}
          >
            kube-scheduler
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              transform: "translate(-50%, -50%)",
              opacity: pickIn,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              width: 820,
            }}
          >
            {FACTORS.map((f, i) => {
              const badgeIn = progress01(frame, 42 + i * 8, 58 + i * 8);
              return (
                <div
                  key={f}
                  style={{
                    opacity: badgeIn,
                    color: COLORS.white,
                    fontFamily: FONTS.mono,
                    fontSize: 38,
                    fontWeight: 700,
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: `1px solid ${COLORS.border}`,
                    background: "rgba(8,14,28,0.9)",
                  }}
                >
                  {f}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: 280,
              top: 480,
              opacity: bindIn,
            }}
          >
            <Pod label="Pending" status="pending" width={140} height={105} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 480,
              top: 520,
              opacity: bindIn,
            }}
          >
            <Arrow direction="right" size={48} color={COLORS.green} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 640,
              top: 460,
              opacity: bindIn,
              transform: `translateY(${(1 - bindIn) * 12}px)`,
              padding: "20px 24px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.green}`,
              background: "rgba(15, 23, 42, 0.55)",
              boxShadow: `0 0 20px ${COLORS.glowGreen}`,
            }}
          >
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 780}}>
              node-2
            </div>
            <div style={{marginTop: 8, color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 34, fontWeight: 650}}>
              bound
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
