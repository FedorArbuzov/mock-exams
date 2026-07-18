import React from "react";

import {AbsoluteFill, useCurrentFrame} from "remotion";

import {COLORS, FONTS} from "../../../../../shared/constants";

import {Caption} from "../../../../../shared/components/Caption";

import {Arrow} from "../../../../../shared/components/Arrow";

import {Panel} from "../../../../../shared/components/Panel";

import {progress01} from "../../../../../shared/utils/animations";



type Props = {text: string; durationInFrames: number};



const LEFT_LINES = ['"a\\nb"', '"\\t tab"'];

const RIGHT_LINES = ["`a\\nb`", "`\t tab`"];



export const Scene3Quoted: React.FC<Props> = ({text, durationInFrames}) => {

  const frame = useCurrentFrame();

  const leftIn = progress01(frame, 0, 22);

  const arrowIn = progress01(frame, 28, 46);

  const rightIn = progress01(frame, 48, 70);



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

        <Panel width={960} height={720}>

          <div

            style={{

              position: "absolute",

              left: 220,

              top: 280,

              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,

              opacity: leftIn,

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              gap: 22,

            }}

          >

            {LEFT_LINES.map((line) => (

              <div

                key={line}

                style={{

                  padding: "14px 20px",

                  borderRadius: 12,

                  border: `1.5px solid ${COLORS.red}66`,

                  color: COLORS.white,

                  fontFamily: FONTS.mono,

                  fontSize: 38,

                  fontWeight: 700,

                  whiteSpace: "pre",

                }}

              >

                {line.split(/(\\n|\\t)/).map((part, i) =>

                  part === "\\n" || part === "\\t" ? (

                    <span key={i} style={{color: COLORS.red}}>

                      {part}

                    </span>

                  ) : (

                    <span key={i}>{part}</span>

                  ),

                )}

              </div>

            ))}

            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>

              escapes

            </div>

          </div>



          <div

            style={{

              position: "absolute",

              left: "50%",

              top: 280,

              transform: "translate(-50%, -50%)",

              opacity: arrowIn,

            }}

          >

            <Arrow direction="right" size={50} color={COLORS.cyan} />

          </div>



          <div

            style={{

              position: "absolute",

              left: 740,

              top: 280,

              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,

              opacity: rightIn,

              display: "flex",

              flexDirection: "column",

              alignItems: "center",

              gap: 22,

            }}

          >

            {RIGHT_LINES.map((line) => (

              <div

                key={line}

                style={{

                  padding: "14px 20px",

                  borderRadius: 12,

                  border: `1.5px solid ${COLORS.cyan}88`,

                  color: COLORS.cyan,

                  fontFamily: FONTS.mono,

                  fontSize: 38,

                  fontWeight: 700,

                  whiteSpace: "pre",

                }}

              >

                {line}

              </div>

            ))}

            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>

              raw

            </div>

          </div>

        </Panel>

      </div>



      <Caption text={text} durationInFrames={durationInFrames} />

    </AbsoluteFill>

  );

};

