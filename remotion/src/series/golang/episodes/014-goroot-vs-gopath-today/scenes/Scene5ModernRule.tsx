import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {LangBadge} from "../../../icons/LangBadge";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEPS = ["mkdir myapp", "go mod init", "write code"];

export const Scene5ModernRule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {STEPS.map((step, i) => {
        const delay = 6 + i * 24;
        const stepIn = progress01(frame, delay, delay + 16);
        const arrowIn = progress01(frame, delay + 14, delay + 26);
        const top = 560 + i * 220;
        return (
          <React.Fragment key={step}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top,
                transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 14}px)`,
                opacity: stepIn,
              }}
            >
              <LangBadge label={step} accent={i === 1 ? COLORS.cyan : COLORS.muted} emphasis={i === 1} />
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: top + 110,
                  transform: "translate(-50%, -50%)",
                  opacity: arrowIn,
                }}
              >
                <Arrow direction="down" size={56} color={COLORS.cyan} />
              </div>
            )}
          </React.Fragment>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
