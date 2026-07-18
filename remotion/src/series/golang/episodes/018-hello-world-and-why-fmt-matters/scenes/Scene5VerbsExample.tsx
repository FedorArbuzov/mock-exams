import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5VerbsExample: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 18);
  const outputIn = progress01(frame, 26, 44);
  const badIn = progress01(frame, 50, 68);

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
        <Panel width={900} height={640}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 50,
              width: 820,
              borderRadius: 16,
              border: `1.5px solid ${COLORS.border}`,
              background: "rgba(7,12,24,0.92)",
              padding: "24px 28px",
              opacity: codeIn,
              transform: `translateY(${(1 - codeIn) * 10}px)`,
            }}
          >
            <div style={{fontFamily: FONTS.mono, fontSize: 24, lineHeight: 1.6}}>
              <span style={{color: COLORS.cyan}}>fmt.Printf</span>
              <span style={{color: COLORS.white}}>(</span>
              <span style={{color: COLORS.green}}>&quot;user=</span>
              <span style={{color: COLORS.cyan, fontWeight: 800}}>%s</span>
              <span style={{color: COLORS.green}}> id=</span>
              <span style={{color: COLORS.cyan, fontWeight: 800}}>%d</span>
              <span style={{color: COLORS.green}}>\n&quot;</span>
              <span style={{color: COLORS.white}}>, name, id)</span>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 40,
              top: 220,
              width: 820,
              borderRadius: 14,
              border: `1.5px solid ${COLORS.green}66`,
              background: "rgba(52,211,153,0.06)",
              padding: "18px 28px",
              opacity: outputIn,
              transform: `translateY(${(1 - outputIn) * 10}px)`,
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 24}}>
              user=alice id=42
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 40,
              top: 380,
              width: 820,
              opacity: badIn,
              transform: `translateY(${(1 - badIn) * 10}px)`,
            }}
          >
            <div
              style={{
                color: COLORS.muted,
                fontFamily: FONTS.sans,
                fontSize: 20,
                fontWeight: 650,
                marginBottom: 12,
              }}
            >
              verbs beat concatenation
            </div>
            <div
              style={{
                borderRadius: 14,
                border: `1.5px solid ${COLORS.red}55`,
                padding: "16px 24px",
                fontFamily: FONTS.mono,
                fontSize: 20,
                color: COLORS.muted,
                textDecoration: "line-through",
                textDecorationColor: COLORS.red,
              }}
            >
              &quot;user=&quot; + name + &quot; id=&quot; + strconv.Itoa(id)
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
