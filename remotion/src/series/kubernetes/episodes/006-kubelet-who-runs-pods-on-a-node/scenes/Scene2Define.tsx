import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {Pod} from "../../../icons/Pod";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const FLOW = ["API server", "kubelet", "container runtime", "Pod"] as const;

export const Scene2Define: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

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
          {FLOW.map((step, i) => {
            const stepIn = progress01(frame, 8 + i * 22, 28 + i * 22);
            const isLast = i === FLOW.length - 1;
            return (
              <React.Fragment key={step}>
                <div
                  style={{
                    position: "absolute",
                    left: 160 + i * 200,
                    top: 300,
                    transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 12}px)`,
                    opacity: stepIn,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {isLast ? (
                    <Pod label="app" width={100} height={80} status="healthy" />
                  ) : (
                    <div
                      style={{
                        padding: "16px 20px",
                        borderRadius: 12,
                        border: `2px solid ${i === 1 ? COLORS.green : COLORS.cyan}`,
                        color: i === 1 ? COLORS.green : COLORS.cyan,
                        fontFamily: FONTS.mono,
                        fontSize: i === 1 ? 38 : 34,
                        fontWeight: 750,
                        background: "rgba(15, 23, 42, 0.55)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {step}
                    </div>
                  )}
                </div>
                {i < FLOW.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 260 + i * 200,
                      top: 300,
                      opacity: progress01(frame, 20 + i * 22, 36 + i * 22),
                    }}
                  >
                    <Arrow direction="right" size={36} color={COLORS.cyan} />
                  </div>
                )}
              </React.Fragment>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              opacity: progress01(frame, 70, 90),
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 650,
              textAlign: "center",
              width: 780,
            }}
          >
            pulls specs · starts containers · reports status
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
