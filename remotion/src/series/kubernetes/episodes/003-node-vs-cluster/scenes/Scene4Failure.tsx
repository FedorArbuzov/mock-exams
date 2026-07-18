import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Pod} from "../../../icons/Pod";
import {clamp, fadeSlideUp, floatY} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Failure: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const mid = durationInFrames * 0.48;
  const scenarioB = frame > mid;
  const nodeFail = interpolate(frame, [12, 28], [0, 1], clamp);
  const cpFail = interpolate(frame, [mid + 8, mid + 24], [0, 1], clamp);

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          marginTop: 150,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            ...fadeSlideUp(frame, 0, 14),
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 32,
            fontWeight: 720,
            textAlign: "center",
          }}
        >
          {scenarioB ? "Control plane fails" : "One node fails"}
        </div>

        <div
          style={{
            width: 900,
            borderRadius: 24,
            border: `1.5px solid ${COLORS.border}`,
            background: COLORS.card,
            padding: 24,
            fontFamily: FONTS.sans,
          }}
        >
          <div
            style={{
              borderRadius: 14,
              border: `2px solid ${scenarioB && cpFail > 0.5 ? COLORS.red : COLORS.cyan}`,
              padding: "12px 16px",
              textAlign: "center",
              color: COLORS.white,
              fontWeight: 700,
              fontSize: 22,
              marginBottom: 18,
              boxShadow:
                scenarioB && cpFail > 0.5
                  ? `0 0 18px ${COLORS.red}55`
                  : `0 0 14px ${COLORS.glowCyan}`,
            }}
          >
            Control Plane {scenarioB && cpFail > 0.5 ? "DOWN" : "OK"}
          </div>

          <div style={{display: "flex", gap: 16, justifyContent: "center"}}>
            {[0, 1, 2].map((i) => {
              const failed = !scenarioB && i === 0 && nodeFail > 0.5;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 170,
                    borderRadius: 16,
                    border: `2px solid ${failed ? COLORS.red : COLORS.green}`,
                    background: "rgba(8,14,28,0.95)",
                    opacity: failed ? 0.45 : 1,
                    transform: `translateY(${failed ? 10 : floatY(frame + i * 8) * 0.25}px)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      color: failed ? COLORS.red : COLORS.green,
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    node-{i + 1}
                  </div>
                  {!failed && <Pod label="pod" width={90} height={70} status="healthy" />}
                  {failed && (
                    <div style={{color: COLORS.red, fontSize: 28, fontWeight: 800}}>✕</div>
                  )}
                </div>
              );
            })}
          </div>

          {scenarioB && (
            <div
              style={{
                marginTop: 16,
                opacity: cpFail,
                textAlign: "center",
                color: COLORS.red,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              apply / deploy blocked — desired state unsafe to change
            </div>
          )}
          {!scenarioB && (
            <div
              style={{
                marginTop: 16,
                opacity: nodeFail,
                textAlign: "center",
                color: COLORS.green,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              cluster can still be healthy
            </div>
          )}
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
