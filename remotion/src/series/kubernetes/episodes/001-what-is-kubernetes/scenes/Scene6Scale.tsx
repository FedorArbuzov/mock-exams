import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {LoadBalancer} from "../../../icons/LoadBalancer";
import {Pod} from "../../../icons/Pod";
import {TrafficGraph} from "../../../icons/TrafficGraph";
import {fadeSlideUp, pulse} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene6Scale: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const traffic = interpolate(frame, [0, Math.floor(durationInFrames * 0.65)], [0.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const replicas = Math.round(interpolate(traffic, [0.15, 1], [3, 6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }));

  const pods = Array.from({length: 6}, (_, i) => {
    const delay = Math.floor(durationInFrames * 0.35) + Math.max(0, i - 2) * 8;
    const appear =
      i < 3
        ? 1
        : spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: {damping: 15, stiffness: 120},
          });
    return {i, appear};
  });

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div style={{...fadeSlideUp(frame, 0, 14), textAlign: "center"}}>
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 56, fontWeight: 800}}>
          Scale with traffic
        </div>
        <div style={{marginTop: 10, color: COLORS.cyan, fontSize: 36, fontWeight: 750}}>
          replicas: {replicas}
        </div>
      </div>

      <div style={{marginTop: 36, display: "flex", justifyContent: "center"}}>
        <TrafficGraph progress={traffic} />
      </div>

      <div style={{marginTop: 28, display: "flex", justifyContent: "center"}}>
        <LoadBalancer active />
      </div>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {pods.map(({i, appear}) => (
          <div
            key={i}
            style={{
              opacity: appear,
              transform: `scale(${appear * pulse(frame + i * 5, 0.14, 0.96, 1.05)})`,
            }}
          >
            <Pod label={`p${i + 1}`} status="healthy" width={120} height={96} />
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          color: COLORS.muted,
          fontSize: 28,
          fontWeight: 600,
        }}
      >
        requests evenly distributed
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
