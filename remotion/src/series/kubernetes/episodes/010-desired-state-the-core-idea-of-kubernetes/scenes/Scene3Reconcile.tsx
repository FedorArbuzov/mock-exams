import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {Pod} from "../../../icons/Pod";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const YAML_LINES = ["kind: Deployment", "replicas: 3"] as const;

export const Scene3Reconcile: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const yamlIn = progress01(frame, 0, 24);
  const loopIn = progress01(frame, 28, 50);

  const pods = [0, 1, 2].map((i) => {
    const delay = Math.floor(durationInFrames * 0.45) + i * 10;
    const appear = spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: {damping: 14, stiffness: 130},
    });
    return {i, appear};
  });

  const replacePod = interpolate(
    frame,
    [Math.floor(durationInFrames * 0.72), Math.floor(durationInFrames * 0.85)],
    [1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

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
        <Panel width={960} height={760}>
          <div
            style={{
              position: "absolute",
              left: 240,
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - yamlIn) * 12}px)`,
              opacity: yamlIn,
              padding: "28px 34px",
              borderRadius: 16,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(7, 12, 24, 0.95)",
              boxShadow: `0 0 28px ${COLORS.glowBlue}`,
              minWidth: 380,
            }}
          >
            {YAML_LINES.map((line, i) => (
              <div
                key={line}
                style={{
                  color: line.includes("replicas") ? COLORS.cyan : COLORS.white,
                  fontFamily: FONTS.mono,
                  fontSize: line.includes("replicas") ? 46 : 40,
                  fontWeight: line.includes("replicas") ? 800 : 700,
                  lineHeight: 1.5,
                  opacity: progress01(frame, 4 + i * 10, 22 + i * 10),
                  textShadow: line.includes("replicas") ? `0 0 16px ${COLORS.glowCyan}` : undefined,
                }}
              >
                {line}
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: 520,
              top: 240,
              opacity: loopIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Arrow direction="right" size={44} color={COLORS.green} />
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 780}}>
              controller loop
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: "translate(-50%, -50%)",
              display: "flex",
              gap: 22,
            }}
          >
            {pods.map(({i, appear}) => (
              <div
                key={i}
                style={{
                  opacity: i === 2 ? appear * replacePod : appear,
                  transform: `translateY(${(1 - appear) * 24}px) scale(${0.85 + appear * 0.15})`,
                }}
              >
                <Pod
                  label={`pod-${i + 1}`}
                  status={i === 2 && replacePod < 0.5 ? "crashed" : "healthy"}
                  width={130}
                  height={100}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 660,
              transform: "translate(-50%, -50%)",
              opacity: progress01(frame, durationInFrames * 0.75, durationInFrames * 0.9),
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 36,
              fontWeight: 720,
            }}
          >
            Pod dies → controller replaces it
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
