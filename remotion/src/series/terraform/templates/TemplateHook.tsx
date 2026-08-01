import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {HelpCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../shared/constants";
import {Caption} from "../../../shared/components/Caption";
import {Panel} from "../../../shared/components/Panel";
import {TopicBanner} from "../../../shared/components/TopicBanner";
import {fadeSlideUpWith, progress01} from "../../../shared/utils/animations";

type Props = {
  text: string;
  durationInFrames: number;
  topicTitle: string;
  mark: string;
};

/** Scene 1: TopicBanner + hook mark. */
export const TemplateHook: React.FC<Props> = ({
  text,
  durationInFrames,
  topicTitle,
  mark,
}) => {
  const frame = useCurrentFrame();
  const panelIn = progress01(frame, 0, 20);
  const markIn = progress01(frame, durationInFrames * 0.35, durationInFrames * 0.6);

  return (
    <AbsoluteFill>
      <TopicBanner title={topicTitle} durationInFrames={durationInFrames} />
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
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              ...fadeSlideUpWith("translate(-50%, -50%)", frame, 0, 18),
            }}
          >
            <HelpCircle size={160} color={COLORS.cyan} strokeWidth={1.5} />
          </div>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "72%",
              transform: "translate(-50%, -50%)",
              color: COLORS.cyan,
              fontSize: mark.length > 18 ? 40 : 48,
              fontWeight: 800,
              textAlign: "center",
              width: 700,
              lineHeight: 1.2,
              opacity: markIn * (0.75 + Math.sin(frame * 0.12) * 0.2),
              textShadow: `0 0 16px ${COLORS.glowCyan}`,
            }}
          >
            {mark}
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
