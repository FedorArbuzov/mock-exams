import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Container} from "../../../icons/Container";
import {Pod} from "../../../icons/Pod";
import {clamp, fadeSlideUp, floatY} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftCheck = interpolate(frame, [20, 36], [0, 1], clamp);
  const rightCheck = interpolate(frame, [50, 68], [0, 1], clamp);
  const scaleExtra = Math.floor(interpolate(frame, [70, 95], [0, 2], clamp));

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          marginTop: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            ...fadeSlideUp(frame, 0, 14),
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 36,
            fontWeight: 720,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          One Pod = one colocated unit of work
        </div>

        <div
          style={{
            display: "flex",
            gap: 22,
            width: "100%",
            justifyContent: "center",
            ...fadeSlideUp(frame, 10, 16),
          }}
        >
          {/* Left: shared */}
          <Panel title="Share localhost / volume" accent={COLORS.cyan}>
            <div
              style={{
                width: "100%",
                borderRadius: 18,
                border: `2px solid ${COLORS.cyan}`,
                padding: 16,
                display: "flex",
                justifyContent: "center",
                gap: 12,
                background: "rgba(8,14,28,0.85)",
              }}
            >
              <Container label="a" size={86} active />
              <Container label="b" size={86} active />
            </div>
            <div style={{marginTop: 12, color: COLORS.muted, fontSize: 20, fontFamily: FONTS.sans}}>
              Same Pod
            </div>
            <div style={{position: "absolute", top: 14, right: 14, opacity: leftCheck}}>
              <Checkmark size={48} progress={leftCheck} />
            </div>
          </Panel>

          {/* Right: independent */}
          <Panel title="Scale independently" accent={COLORS.kubernetesBlue}>
            <div style={{display: "flex", flexDirection: "column", gap: 10, width: "100%"}}>
              <DeployCard name="web" count={1 + scaleExtra} />
              <DeployCard name="worker" count={1} />
            </div>
            <div style={{marginTop: 12, color: COLORS.muted, fontSize: 20, fontFamily: FONTS.sans}}>
              Separate Deployments
            </div>
            <div style={{position: "absolute", top: 14, right: 14, opacity: rightCheck}}>
              <Checkmark size={48} progress={rightCheck} />
            </div>
          </Panel>
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const Panel: React.FC<{
  title: string;
  accent: string;
  children: React.ReactNode;
}> = ({title, accent, children}) => (
  <div
    style={{
      width: 430,
      minHeight: 360,
      borderRadius: 24,
      border: `1.5px solid ${accent}66`,
      background: COLORS.card,
      padding: 20,
      position: "relative",
    }}
  >
    <div
      style={{
        color: accent,
        fontFamily: FONTS.sans,
        fontSize: 22,
        fontWeight: 700,
        marginBottom: 16,
        paddingRight: 48,
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const DeployCard: React.FC<{name: string; count: number}> = ({name, count}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        padding: 10,
        background: "rgba(8,14,28,0.9)",
      }}
    >
      <div
        style={{
          color: COLORS.muted,
          fontSize: 16,
          fontFamily: FONTS.sans,
          marginBottom: 8,
          fontWeight: 650,
        }}
      >
        Deployment/{name}
      </div>
      <div style={{display: "flex", gap: 8}}>
        {Array.from({length: count}).map((_, i) => (
          <div key={i} style={{transform: `translateY(${floatY(frame + i * 9) * 0.4}px)`}}>
            <Pod label={`p${i}`} width={70} height={58} status="healthy" />
          </div>
        ))}
      </div>
    </div>
  );
};
