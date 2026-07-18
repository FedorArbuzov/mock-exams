import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const EVENTS = [
  "FailedScheduling",
  "node affinity",
  "volume binding",
] as const;

export const Scene4Check: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cmdIn = progress01(frame, 0, 22);
  const eventsIn = progress01(frame, 28, 48);

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
        <Panel width={920} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 180,
              transform: `translate(-50%, -50%) translateY(${(1 - cmdIn) * 12}px)`,
              opacity: cmdIn,
              padding: "22px 28px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.cyan}`,
              background: "rgba(15, 23, 42, 0.55)",
              boxShadow: `0 0 20px ${COLORS.glowCyan}`,
            }}
          >
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 780,
                lineHeight: 1.4,
              }}
            >
              kubectl describe pod
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 320,
              transform: "translate(-50%, -50%)",
              opacity: eventsIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 720,
            }}
          >
            read Events
          </div>

          {EVENTS.map((event, i) => {
            const stepIn = progress01(frame, 50 + i * 22, 70 + i * 22);
            return (
              <div
                key={event}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 420 + i * 88,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 10}px)`,
                  opacity: stepIn,
                  color: COLORS.white,
                  fontFamily: FONTS.mono,
                  fontSize: 40,
                  fontWeight: 750,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(8,14,28,0.9)",
                  width: 760,
                  textAlign: "center",
                }}
              >
                {event}
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
