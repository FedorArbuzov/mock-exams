import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Pod} from "../../../icons/Pod";
import {clamp, fadeSlideUp, floatY} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Model: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const eq = interpolate(frame, [8, 24], [0, 1], clamp);
  const q = interpolate(frame, [34, 50], [0, 1], clamp);
  const pressure = interpolate(frame, [55, 85], [0.2, 0.92], clamp);

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          marginTop: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            opacity: eq,
            transform: `translateY(${(1 - eq) * 18}px)`,
            fontFamily: FONTS.sans,
          }}
        >
          <Eq left="Node" right="Capacity" color={COLORS.cyan} />
          <Eq left="Cluster" right="Orchestration" color={COLORS.kubernetesBlue} />
        </div>

        <div
          style={{
            width: 900,
            display: "flex",
            gap: 18,
            opacity: q,
            ...fadeSlideUp(frame, 30, 16),
          }}
        >
          <AskCard
            title="App broken?"
            body={<Pod label="app" status="crashed" width={120} height={90} />}
          />
          <AskCard
            title="Node under pressure?"
            body={
              <div style={{width: "100%"}}>
                <Meter label="CPU" value={pressure} />
                <Meter label="MEM" value={pressure * 0.85} />
              </div>
            }
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: interpolate(frame, [70, 85], [0, 1], clamp),
            color: COLORS.muted,
            fontFamily: FONTS.sans,
            fontSize: 22,
          }}
        >
          <Checkmark size={42} progress={1} />
          Always ask both
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const Eq: React.FC<{left: string; right: string; color: string}> = ({left, right, color}) => (
  <div
    style={{
      borderRadius: 18,
      border: `1.5px solid ${color}66`,
      background: COLORS.card,
      padding: "16px 20px",
      color: COLORS.white,
      fontSize: 24,
      fontWeight: 700,
    }}
  >
    <span style={{color}}>{left}</span>
    <span style={{color: COLORS.muted}}> = </span>
    {right}
  </div>
);

const AskCard: React.FC<{title: string; body: React.ReactNode}> = ({title, body}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        flex: 1,
        borderRadius: 20,
        border: `1.5px solid ${COLORS.border}`,
        background: COLORS.card,
        padding: 18,
        minHeight: 220,
        transform: `translateY(${floatY(frame) * 0.2}px)`,
        fontFamily: FONTS.sans,
      }}
    >
      <div style={{color: COLORS.white, fontSize: 26, fontWeight: 720, marginBottom: 16}}>
        {title}
      </div>
      <div style={{display: "flex", justifyContent: "center"}}>{body}</div>
    </div>
  );
};

const Meter: React.FC<{label: string; value: number}> = ({label, value}) => (
  <div style={{marginBottom: 12}}>
    <div style={{color: COLORS.muted, fontSize: 16, marginBottom: 4}}>{label}</div>
    <div
      style={{
        height: 12,
        borderRadius: 99,
        background: "rgba(148,163,184,0.2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value * 100}%`,
          height: "100%",
          borderRadius: 99,
          background: value > 0.8 ? COLORS.red : COLORS.cyan,
          boxShadow: `0 0 10px ${value > 0.8 ? COLORS.red : COLORS.glowCyan}`,
        }}
      />
    </div>
  </div>
);
