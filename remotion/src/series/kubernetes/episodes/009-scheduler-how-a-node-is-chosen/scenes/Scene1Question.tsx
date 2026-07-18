import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Waypoints} from "lucide-react";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {TopicBanner} from "../../../../../shared/components/TopicBanner";
import {Pod} from "../../../icons/Pod";
import {TOPIC_TITLE} from "../content";
import {fadeSlideUpWith, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const RINGS = [140, 220, 300];

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const panelIn = progress01(frame, 0, 20);
  const markIn = progress01(frame, durationInFrames * 0.35, durationInFrames * 0.6);
  const podIn = progress01(frame, 18, 38);

  return (
    <AbsoluteFill>
      <TopicBanner title={TOPIC_TITLE} durationInFrames={durationInFrames} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: `translate(-50%, -50%) scale(${0.94 + panelIn * 0.06})`,
          opacity: panelIn,
        }}
      >
        <Panel width={780} height={760}>
          {RINGS.map((r, i) => {
            const pulse = 0.5 + 0.5 * Math.sin(frame * 0.05 - i * 1.1);
            return (
              <div
                key={r}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "42%",
                  width: r,
                  height: r,
                  transform: "translate(-50%, -50%)",
                  borderRadius: 999,
                  border: `2px solid ${COLORS.cyan}`,
                  opacity: 0.12 + pulse * 0.18,
                }}
              />
            );
          })}

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "42%",
              display: "flex",
              alignItems: "center",
              gap: 28,
              ...fadeSlideUpWith("translate(-50%, -50%)", frame, 0, 18),
            }}
          >
            <div style={{opacity: podIn}}>
              <Pod label="app" status="pending" width={130} height={100} />
            </div>
            <Waypoints size={100} color={COLORS.cyan} strokeWidth={1.5} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "70%",
              transform: "translate(-50%, -50%)",
              color: COLORS.cyan,
              fontSize: 48,
              fontWeight: 800,
              opacity: markIn * (0.75 + Math.sin(frame * 0.12) * 0.2),
              textShadow: `0 0 16px ${COLORS.glowCyan}`,
            }}
          >
            why this node?
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
