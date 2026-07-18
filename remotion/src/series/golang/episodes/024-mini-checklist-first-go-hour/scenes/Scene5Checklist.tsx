import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Check} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS = ["version OK", "hello runs", "format on save", "vet clean"];

export const Scene5Checklist: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={780} height={640}>
          <div
            style={{
              position: "absolute",
              left: 50,
              top: 60,
              width: 680,
              borderRadius: 20,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(7,12,24,0.9)",
              padding: "10px 0",
            }}
          >
            {ITEMS.map((item, i) => {
              const delay = 10 + i * 22;
              const rowIn = progress01(frame, delay, delay + 14);
              const boxIn = progress01(frame, delay + 10, delay + 26);
              return (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 22,
                    padding: "20px 30px",
                    opacity: rowIn,
                    transform: `translateX(${(1 - rowIn) * -14}px)`,
                    borderBottom: i < ITEMS.length - 1 ? `1px solid ${COLORS.border}` : undefined,
                  }}
                >
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 10,
                      border: `2px solid ${COLORS.green}`,
                      background: boxIn > 0.5 ? "rgba(52,211,153,0.25)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div style={{opacity: boxIn}}>
                      <Check size={30} color={COLORS.green} strokeWidth={3} />
                    </div>
                  </div>
                  <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700}}>
                    {item}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
