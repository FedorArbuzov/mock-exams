import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Cluster} from "../../../icons/Cluster";
import {fadeSlideUp} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Crash: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const crashAt = Math.floor(durationInFrames * 0.2);
  const removeAt = Math.floor(durationInFrames * 0.4);
  const replaceAt = Math.floor(durationInFrames * 0.55);

  const crashProgress = interpolate(frame, [crashAt, crashAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const removeProgress = interpolate(frame, [removeAt, removeAt + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const replace = spring({
    frame: Math.max(0, frame - replaceAt),
    fps,
    config: {damping: 14, stiffness: 120},
  });

  const midStatus = crashProgress > 0.5 ? "crashed" : "healthy";
  const midOpacity = 1 - removeProgress;
  const midScale = 1 - removeProgress * 0.35;

  const pods = [
    {id: "p1", label: "pod-1", status: "healthy" as const, opacity: 1, scale: 1},
    {
      id: "p2",
      label: removeProgress > 0.95 ? "pod-2" : "pod-2",
      status: (removeProgress > 0.95 ? "new" : midStatus) as "healthy" | "crashed" | "new",
      opacity: removeProgress > 0.95 ? replace : midOpacity,
      scale: removeProgress > 0.95 ? 0.85 + replace * 0.15 : midScale,
    },
    {id: "p3", label: "pod-3", status: "healthy" as const, opacity: 1, scale: 1},
  ];

  // After remove, show replacement sliding in as pod-2b visually via replace spring
  if (removeProgress > 0.95) {
    pods[1] = {
      id: "p2-new",
      label: "pod-2",
      status: "new",
      opacity: replace,
      scale: 0.85 + replace * 0.15,
    };
  }

  const healthyAgain = replace > 0.85;

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div style={{...fadeSlideUp(frame, 0, 14), textAlign: "center", marginBottom: 40}}>
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 56, fontWeight: 800}}>
          Self-healing
        </div>
        <div style={{marginTop: 12, color: COLORS.muted, fontSize: 30}}>
          crash → remove → replace
        </div>
      </div>

      <Cluster pods={pods} title="production cluster" />

      <div
        style={{
          marginTop: 36,
          textAlign: "center",
          color: healthyAgain ? COLORS.green : COLORS.red,
          fontSize: 32,
          fontWeight: 750,
          opacity: crashProgress,
        }}
      >
        {healthyAgain
          ? "Cluster healthy again"
          : removeProgress > 0.5
            ? "Starting replacement…"
            : "Pod crashed"}
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
