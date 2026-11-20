import { C, Stage, anim, animLinear, kf, show } from "./kit";

// AEGIS: how vitals reach the ground (before vs. a live telemetry stream) and
// the decoupled body/eye look used in the visor simulation.

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

/* 2. Look without turning: gaze decoupled from the body's heading */

const TARGETS = {
  tool: { x: 330, y: 118, label: "tool" },
  light: { x: 470, y: 318, label: "warning light" },
  hatch: { x: 600, y: 110, label: "hatch" },
};
const ORIGIN = [160, 222];

function LookFigure() {
  const tx = (x) => `transform:translateX(${x}px)`;
  const rot = (d) => `transform:rotate(${d}deg)`;
  const css = [
    kf("ae2-pos", [
      [0, tx(0)], [5, tx(0)], [14, tx(100)], [30, tx(100)], [40, tx(220)], [43, tx(220)],
      [44, tx(0)], [48, tx(0)], [92, tx(460)], [96.5, tx(460)], [98, tx(0)], [100, tx(0)],
    ]),
    kf("ae2-body", [[0, rot(0)], [14, rot(0)], [18, rot(-56)], [26, rot(-56)], [30, rot(0)], [100, rot(0)]]),
    kf("ae2-gaze", [
      [0, rot(0)], [50, rot(0)], [54, rot(-49)], [60, rot(-74)], [63, rot(-74)], [65, rot(36)], [70, rot(54)],
      [73, rot(54)], [76, rot(-39)], [82, rot(-55)], [85, rot(-55)], [89, rot(0)], [100, rot(0)],
    ]),
    show("ae2-who", [[0, 42], [47, 94]]),
    show("ae2-tool", [[18, 26], [53, 62]]),
    show("ae2-light", [[65, 72]]),
    show("ae2-hatch", [[76, 84]]),
    show("ae2-stop", [[16, 28]]),
  ];

  return (
    <Stage
      id="ae2"
      label="Animation, top-down: an astronaut moving along a handrail. With typical controls they stop and turn their whole body to look at a tool; with AEGIS they keep moving while their gaze sweeps to a tool, a warning light and a hatch."
      css={css}
      captions={[
        { text: "Typical first-person controls: to look at something, you turn your whole body and stop moving.", from: 0, to: 42 },
        { text: "AEGIS decouples them: the body keeps moving along the handrail while the eyes look around freely.", from: 46, to: 94 },
      ]}
    >
      <defs>
        <linearGradient id="ae2-cone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.accent} stopOpacity=".45" />
          <stop offset="1" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <text x="40" y="44" className="fig-t-s">TOP-DOWN VIEW</text>

      {/* Handrail */}
      <line x1="100" y1="252" x2="700" y2="252" stroke="#4a4a4a" strokeWidth="4" strokeLinecap="round" />
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={116 + i * 80} y="252" width="6" height="12" fill="#3a3a3a" />
      ))}
      <text x="700" y="280" textAnchor="end" className="fig-t-s">handrail</text>

      {Object.entries(TARGETS).map(([k, t]) => (
        <g key={k}>
          <circle cx={t.x} cy={t.y} r="22" fill={AMBER} fillOpacity=".12" stroke={AMBER} style={animLinear(`ae2-${k}`)} />
          <circle cx={t.x} cy={t.y} r="7" fill="#555" />
          <text x={t.x} y={t.y + 38} textAnchor="middle" className="fig-t-s">{t.label}</text>
        </g>
      ))}

      <g transform={`translate(${ORIGIN[0]} ${ORIGIN[1]})`}>
        <g style={animLinear("ae2-who")}>
          <g style={anim("ae2-pos", "linear")}>
            <text x="0" y="-36" textAnchor="middle" className="fig-t-note" style={animLinear("ae2-stop")}>stopped</text>
            <g style={anim("ae2-body")}>
              <g style={anim("ae2-gaze")}>
                <path d="M10 0 L180 -64 A 192 192 0 0 1 180 64 Z" fill="url(#ae2-cone)" />
              </g>
              <rect x="-24" y="-13" width="10" height="26" rx="3" fill="#8a8a8a" />
              <ellipse cx="0" cy="0" rx="13" ry="19" fill="#e6e6e6" />
              <circle cx="4" cy="0" r="9" fill="#1d2840" stroke="#e6e6e6" strokeWidth="2" />
              <path d="M24 -6 L32 0 L24 6" fill="none" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" />
            </g>
          </g>
        </g>
      </g>

      <g transform="translate(560 42)">
        <path d="M0 -5 L8 0 L0 5" fill="none" stroke="#bdbdbd" strokeWidth="2" />
        <text x="16" y="4" className="fig-t-s">body heading</text>
        <path d="M100 0 L124 -8 L124 8 Z" fill={C.accent} fillOpacity=".5" />
        <text x="132" y="4" className="fig-t-s">gaze</text>
      </g>
    </Stage>
  );
}

export const AEGIS_FIGURES = {
  "aegis-vitals": VitalsFigure,
  "aegis-look": LookFigure,
};
