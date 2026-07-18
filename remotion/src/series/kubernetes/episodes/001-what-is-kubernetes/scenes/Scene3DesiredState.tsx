import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Pod} from "../../../icons/Pod";
import {YamlEditor} from "../../../icons/YamlEditor";
import {fadeSlideUp} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const YAML = "apiVersion: apps/v1\nkind: Deployment\nreplicas: 3";

export const Scene3DesiredState: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const typingEnd = Math.floor(durationInFrames * 0.55);
  const typedChars = Math.floor(
    interpolate(frame, [0, typingEnd], [0, YAML.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  const pods = [0, 1, 2].map((i) => {
    const delay = Math.floor(durationInFrames * 0.55) + i * 10;
    const appear = spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: {damping: 14, stiffness: 130},
    });
    return {i, appear};
  });

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div style={{...fadeSlideUp(frame, 0, 14), textAlign: "center", marginBottom: 36}}>
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 56, fontWeight: 800}}>
          Desired state
        </div>
        <div style={{marginTop: 10, color: COLORS.muted, fontSize: 30}}>
          You define it. Kubernetes enforces it.
        </div>
      </div>

      <div style={{display: "flex", justifyContent: "center"}}>
        <YamlEditor typedChars={typedChars} />
      </div>

      <div
        style={{
          marginTop: 48,
          display: "flex",
          justifyContent: "center",
          gap: 22,
        }}
      >
        {pods.map(({i, appear}) => (
          <div
            key={i}
            style={{
              opacity: appear,
              transform: `translateY(${(1 - appear) * 30}px) scale(${0.85 + appear * 0.15})`,
            }}
          >
            <Pod label={`replica ${i + 1}`} status="new" />
          </div>
        ))}
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
