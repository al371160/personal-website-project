import { C, Stage, anim, animLinear, kf, show } from "./kit";

// AEGIS: the five hazards of a spacewalk and how vitals reach the ground
// (before vs. a live telemetry stream).

const AMBER = "#f2b84b";

// Suit → mission control arc, as a quadratic bezier.
const P0 = [244, 168];
const P1 = [420, 60];
const P2 = [596, 196];
const bez = (t) => [0, 1].map((k) => (1 - t) ** 2 * P0[k] + 2 * t * (1 - t) * P1[k] + t ** 2 * P2[k]);
const ARC = `M${P0} Q${P1} ${P2}`;

// Keyframes that carry an element along the arc between two loop percentages.
function travel(start, end, reverse = false) {
  const steps = 6;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const [x, y] = bez(reverse ? 1 - t : t);
    return [start + (end - start) * t, `transform:translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`];
  });
}

function Bubble({ text, w }) {
  return (
    <g>
      <rect x={-w / 2} y="-13" width={w} height="26" rx="13" fill="#262626" stroke="#3a3a3a" />
      <text x="0" y="4" textAnchor="middle" className="fig-t">{text}</text>
    </g>
  );
}

/* 0. The situation: NASA's five hazards of spaceflight, applied to a spacewalk */

const HAZARDS = [
  { key: "R", word: "Radiation", caption: "Radiation: outside the station's hull, only the suit stands between the astronaut and the sun." },
  { key: "I", word: "Isolation", caption: "Isolation & confinement: hours sealed in a suit, with only a voice link to anyone else." },
  { key: "D", word: "Distance", caption: "Distance from Earth: from the Moon, every call to the ground takes over a second each way." },
  { key: "G", word: "Gravity", caption: "Gravity: no up or down, and every movement fights a pressurized suit." },
  { key: "E", word: "Environment", caption: "Hostile, closed environment: oxygen, CO₂ scrubbing and cooling all depend on the suit." },
];
const PHASE = 17;
const phase = (i) => [2 + i * PHASE, 2 + (i + 1) * PHASE];
const HERO = [400, 215];

// Astronaut drawn around the torso's center.
function Astronaut() {
  return (
    <g>
      <rect x="-42" y="-24" width="18" height="58" rx="5" fill="#9a9a9a" />
      <rect x="-30" y="-28" width="58" height="72" rx="16" fill="#e6e6e6" />
      <rect x="-16" y="42" width="12" height="40" rx="5" fill="#d6d6d6" />
      <rect x="2" y="42" width="12" height="40" rx="5" fill="#d6d6d6" />
      <circle cx="0" cy="-54" r="28" fill="#e6e6e6" />
      <ellipse cx="8" cy="-56" rx="18" ry="14" fill="#1d2840" />
    </g>
  );
}

function HazardsFigure() {
  const [hx, hy] = HERO;
  const css = [
    ...HAZARDS.flatMap((_, i) => {
      const [s, e] = phase(i);
      return [show(`ae0-on${i}`, [[s, e]]), show(`ae0-done${i}`, [[e, 96]]), show(`ae0-fx${i}`, [[s, e - 0.8]])];
    }),
    show("ae0-all", [[2 + 5 * PHASE, 96]]),
    kf("ae0-ray", [[0, "transform:translate(150px,140px);opacity:0"], [15, "opacity:1"], [85, "opacity:1"], [100, `transform:translate(${hx - 40}px,${hy - 40}px);opacity:0`]]),
    kf("ae0-ring", [[0, "transform:scale(1.6)"], [phase(1)[0], "transform:scale(1.6)"], [phase(1)[1] - 2, "transform:scale(1)"], [100, "transform:scale(1)"]]),
    kf("ae0-signal", [[0, "transform:translate(0px,0px)"], [phase(2)[0] + 1, "transform:translate(0px,0px)"], [phase(2)[1] - 2, "transform:translate(260px,92px)"], [100, "transform:translate(260px,92px)"]]),
    kf("ae0-drift", [[0, "transform:rotate(0deg)"], [phase(3)[0], "transform:rotate(0deg)"], [phase(3)[0] + 4, "transform:rotate(-10deg)"], [phase(3)[0] + 9, "transform:rotate(8deg)"], [phase(3)[1], "transform:rotate(0deg)"], [100, "transform:rotate(0deg)"]]),
    kf("ae0-co2", [[0, "transform:scaleX(.3)"], [phase(4)[0], "transform:scaleX(.3)"], [phase(4)[1] - 1, "transform:scaleX(.92)"], [100, "transform:scaleX(.92)"]]),
  ];

  return (
    <Stage
      id="ae0"
      label="Animation: NASA's five hazards of human spaceflight (radiation, isolation, distance from Earth, gravity, and a hostile closed environment) light up one by one around an astronaut on a spacewalk."
      css={css}
      captions={[
        ...HAZARDS.map((h, i) => ({ text: h.caption, from: phase(i)[0], to: phase(i)[1] - 0.8 })),
        { text: "On a spacewalk, all five stack up at once, for hours.", from: 2 + 5 * PHASE, to: 96 },
      ]}
    >
      {/* Hazard chips */}
      {HAZARDS.map((h, i) => {
        const x = 80 + i * 132;
        return (
          <g key={h.key}>
            <rect x={x} y="28" width="112" height="30" rx="15" fill="none" stroke="#2c2c2c" />
            <g style={animLinear(`ae0-done${i}`)}>
              <rect x={x} y="28" width="112" height="30" rx="15" fill={AMBER} fillOpacity=".08" stroke={AMBER} strokeOpacity=".5" />
            </g>
            <g style={animLinear(`ae0-on${i}`)}>
              <rect x={x} y="28" width="112" height="30" rx="15" fill={AMBER} fillOpacity=".22" stroke={AMBER} />
            </g>
            <text x={x + 18} y="48" className="fig-t-h" fill={AMBER}>{h.key}</text>
            <text x={x + 34} y="47" className="fig-t">{h.word}</text>
          </g>
        );
      })}

      {/* R: sun and particles */}
      <g style={animLinear("ae0-fx0")}>
        <circle cx="130" cy="130" r="18" fill={AMBER} />
        {Array.from({ length: 8 }, (_, k) => {
          const a = (k * Math.PI) / 4;
          return <line key={k} x1={130 + Math.cos(a) * 24} y1={130 + Math.sin(a) * 24} x2={130 + Math.cos(a) * 32} y2={130 + Math.sin(a) * 32} stroke={AMBER} strokeWidth="2" />;
        })}
        {Array.from({ length: 10 }, (_, k) => (
          <line key={k} x1="0" y1="0" x2="10" y2="3" stroke={AMBER} strokeWidth="2" style={{ animation: `ae0-ray 1.1s linear ${(-k * 0.11).toFixed(2)}s infinite` }} />
        ))}
      </g>

      {/* I: the space around the astronaut closes in */}
      <g style={animLinear("ae0-fx1")}>
        <circle cx={hx} cy={hy - 10} r="100" fill="none" stroke={AMBER} strokeDasharray="6 6" style={{ ...anim("ae0-ring"), transformBox: "fill-box", transformOrigin: "center" }} />
        <text x={hx + 120} y={hy - 60} className="fig-t-s">6+ hours in the suit</text>
      </g>

      {/* D: a slow signal to Earth */}
      <g style={animLinear("ae0-fx2")}>
        <circle cx="700" cy="330" r="40" fill="#14203a" stroke="#253863" />
        <line x1={hx + 40} y1={hy + 20} x2="672" y2="306" stroke="#3a3a3a" strokeDasharray="4 6" />
        <circle cx={hx + 40} cy={hy + 20} r="5" fill={AMBER} style={anim("ae0-signal", "linear")} />
        <text x="560" y="236" className="fig-t-s">~1.3 s each way (Moon)</text>
      </g>

      {/* G: no up or down */}
      <g style={animLinear("ae0-fx3")}>
        {[[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy], k) => (
          <path
            key={k}
            d={`M${hx + dx * 130 - dy * 8} ${hy + dy * 110 + dx * 8} L${hx + dx * 146} ${hy + dy * 126} L${hx + dx * 130 + dy * 8} ${hy + dy * 110 - dx * 8}`}
            fill="none"
            stroke="#6a6a6a"
            strokeWidth="2"
          />
        ))}
        <text x={hx - 150} y={hy - 70} className="fig-t-s">no up, no down</text>
      </g>

      {/* E: the suit's life support */}
      <g style={animLinear("ae0-fx4")}>
        {[["O₂", 0.8, C.good], ["CO₂", null, C.bad], ["H₂O °C", 0.55, C.accent]].map(([t, v, c], k) => (
          <g key={t}>
            <text x="500" y={170 + k * 30} className="fig-t-s">{t}</text>
            <rect x="550" y={162 + k * 30} width="110" height="8" rx="4" fill="#262626" />
            <rect
              x="550"
              y={162 + k * 30}
              width="110"
              height="8"
              rx="4"
              fill={c}
              style={v == null ? { ...anim("ae0-co2"), transformBox: "fill-box", transformOrigin: "left" } : { transform: `scaleX(${v})`, transformBox: "fill-box", transformOrigin: "left" }}
            />
          </g>
        ))}
      </g>

      <g transform={`translate(${hx} ${hy})`}>
        <g style={anim("ae0-drift")}>
          <Astronaut />
          <g style={animLinear("ae0-fx4")}>
            <rect x="-34" y="-86" width="68" height="134" rx="22" fill="none" stroke={AMBER} strokeWidth="2" />
          </g>
          <g style={animLinear("ae0-all")}>
            <circle cx="0" cy="-10" r="100" fill="none" stroke={AMBER} strokeOpacity=".5" />
          </g>
        </g>
      </g>
    </Stage>
  );
}

/* 1. Before: vitals by check-in. After: one stream to visor and ground. */

function VitalsFigure() {
  const hidden = "opacity:0";
  const askPath = travel(4, 14, true);
  const replyPath = travel(22, 32);
  const css = [
    kf("ae1-ask", [[0, `${askPath[0][1]};opacity:0`], [4, `${askPath[0][1]};opacity:1`], ...askPath.slice(1), [15, `${askPath[6][1]};opacity:1`], [16.5, `${askPath[6][1]};opacity:0`], [100, hidden]]),
    show("ae1-wait", [[16, 22]]),
    kf("ae1-reply", [[0, `${replyPath[0][1]};opacity:0`], [21.4, `${replyPath[0][1]};opacity:0`], [22, `${replyPath[0][1]};opacity:1`], ...replyPath.slice(1), [33, `${replyPath[6][1]};opacity:1`], [34.5, `${replyPath[6][1]};opacity:0`], [100, hidden]]),
    show("ae1-hr", [[24, 46]]),
    show("ae1-unseen", [[28, 46]]),
    show("ae1-before", [[0, 46]]),
    show("ae1-after", [[48, 96]]),
    show("ae1-live", [[52, 96]]),
    kf("ae1-alert", [[0, "opacity:0"], [74, "opacity:0"], [75, "opacity:1"], [77, "opacity:.3"], [79, "opacity:1"], [81, "opacity:.3"], [83, "opacity:1"], [90, "opacity:1"], [92, "opacity:0"], [100, "opacity:0"]]),
    kf("ae1-flow", [[0, `transform:translate(${P0[0]}px,${P0[1]}px);opacity:0`], [10, "opacity:1"], ...[0.25, 0.5, 0.75].map((t) => [t * 100, `transform:translate(${bez(t)[0].toFixed(1)}px,${bez(t)[1].toFixed(1)}px)`]), [90, "opacity:1"], [100, `transform:translate(${P2[0]}px,${P2[1]}px);opacity:0`]]),
    kf("ae1-beat", [[0, "transform:scale(1)"], [12, "transform:scale(1.25)"], [24, "transform:scale(1)"], [100, "transform:scale(1)"]]),
  ];

  return (
    <Stage
      id="ae1"
      label="Animation: mission control asks an astronaut how they feel and waits for a spoken reply while their heart rate climbs unseen; then a continuous telemetry stream feeds both the visor display and mission control, and an alert appears on both at once."
      css={css}
      captions={[
        { text: "Before: vitals travel by check-in calls and analog readouts. Slow, and easy to miss.", from: 0, to: 46 },
        { text: "AEGIS: suit telemetry streams continuously to the visor HUD and to mission control.", from: 48, to: 73 },
        { text: "When something changes, the astronaut and the ground see it at the same moment.", from: 74, to: 96 },
      ]}
    >
      {/* Earth + mission control */}
      <circle cx="760" cy="540" r="320" fill="#14203a" stroke="#253863" />
      <text x="648" y="168" textAnchor="middle" className="fig-t-s">MISSION CONTROL</text>
      <rect x="600" y="178" width="96" height="62" rx="6" fill="#1b1b1b" stroke="#333" />
      <g style={animLinear("ae1-before")}>
        <text x="612" y="200" className="fig-t" fill="#666">HR    —</text>
        <text x="612" y="222" className="fig-t" fill="#666">SpO₂  —</text>
      </g>
      <g style={animLinear("ae1-live")}>
        <path d="M610 204 l8 0 l4 -8 l4 14 l4 -6 l6 0 l4 -4 l4 4 l8 0 l4 -9 l4 13 l4 -4 l12 0" fill="none" stroke={C.accent} strokeWidth="1.5" />
        <text x="612" y="228" className="fig-t" fill="#fff">116 bpm · 99%</text>
      </g>
      <rect x="596" y="174" width="104" height="70" rx="8" fill="none" stroke={AMBER} strokeWidth="2" style={animLinear("ae1-alert")} />

      {/* Link between them */}
      <path d={ARC} fill="none" stroke="#2c2c2c" strokeWidth="1.5" strokeDasharray="4 6" />

      {/* Astronaut */}
      <g>
        <rect x="160" y="196" width="18" height="58" rx="5" fill="#9a9a9a" />
        <rect x="172" y="192" width="58" height="72" rx="16" fill="#e6e6e6" />
        <rect x="186" y="262" width="12" height="40" rx="5" fill="#d6d6d6" />
        <rect x="204" y="262" width="12" height="40" rx="5" fill="#d6d6d6" />
        <circle cx="202" cy="166" r="28" fill="#e6e6e6" />
        <ellipse cx="210" cy="164" rx="18" ry="14" fill="#1d2840" />
        <g style={{ animation: "ae1-beat 0.9s ease-out infinite", transformBox: "fill-box", transformOrigin: "center" }}>
          <path d="M201 226 c-6 -6 -12 0 -6 6 l6 6 l6 -6 c6 -6 0 -12 -6 -6 Z" fill={C.bad} />
        </g>
        <g style={animLinear("ae1-live")}>
          <text x="210" y="168" textAnchor="middle" className="fig-t-s" fill={C.accent}>116</text>
        </g>
        <ellipse cx="210" cy="164" rx="20" ry="16" fill="none" stroke={AMBER} strokeWidth="2" style={animLinear("ae1-alert")} />
      </g>
      <g style={animLinear("ae1-hr")}>
        <text x="236" y="236" className="fig-t-s" fill={C.bad}>HR 124 ↑</text>
      </g>
      <text x="200" y="330" textAnchor="middle" className="fig-t-note" style={animLinear("ae1-unseen")}>
        rising, and nobody sees it yet
      </text>

      {/* Before: a voice check-in round trip */}
      <g style={anim("ae1-ask", "linear")}>
        <Bubble text="“How are you feeling?”" w={170} />
      </g>
      <text x="262" y="140" className="fig-t-h" style={animLinear("ae1-wait")}>…</text>
      <g style={anim("ae1-reply", "linear")}>
        <Bubble text="“Feeling fine.”" w={120} />
      </g>

      {/* After: a packed telemetry stream */}
      <g style={animLinear("ae1-after")}>
        {Array.from({ length: 12 }, (_, i) => (
          <circle
            key={i}
            r="3"
            fill={C.accent}
            style={{ animation: `ae1-flow 1.5s linear ${(-i * 0.125).toFixed(3)}s infinite` }}
          />
        ))}
      </g>
    </Stage>
  );
}

export const AEGIS_FIGURES = {
  "aegis-hazards": HazardsFigure,
  "aegis-vitals": VitalsFigure,
};
