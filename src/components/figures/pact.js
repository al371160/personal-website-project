import { Stage, anim, animLinear, kf, show } from "./kit";

// Pact: the user situation (friends drift apart, shared moments get buried)
// and the map process (OSM data → tilt-shift → photos planted as flowers).

const BLUE = "#7d9bff";
const PINK = "#f2a7bb";
const reset = (stops, rest) => [...stops, [96.5, stops[stops.length - 1][1]], [98, rest], [100, rest]];

function Person({ x, y, color, label }) {
  return (
    <g>
      <circle cx={x} cy={y - 16} r="9" fill={color} />
      <path d={`M${x - 16} ${y + 14} Q${x - 16} ${y - 2} ${x} ${y - 2} Q${x + 16} ${y - 2} ${x + 16} ${y + 14} Z`} fill={color} />
      <text x={x} y={y + 32} textAnchor="middle" className="fig-t-s">{label}</text>
    </g>
  );
}

function Polaroid({ color }) {
  return (
    <g>
      <rect x="-15" y="-17" width="30" height="34" rx="1.5" fill="#ebe6de" />
      <rect x="-12" y="-14" width="24" height="22" fill={color} />
    </g>
  );
}

/* 1. The situation: closeness fades, moments end up in a camera roll */

const PHOTOS = [
  { from: [372, 118, -10], to: [384, 270, -18], color: "#c98b6b" },
  { from: [402, 104, 5], to: [402, 264, 8], color: "#7d9bff" },
  { from: [430, 120, 12], to: [418, 272, 22], color: "#e7b65c" },
  { from: [390, 146, -4], to: [396, 278, -6], color: "#8fbf8f" },
];

function DriftFigure() {
  const at = ([x, y, r], o = 1) => `transform:translate(${x}px,${y}px) rotate(${r}deg);opacity:${o}`;
  const css = [
    kf("pa1-a", reset([[0, "transform:translateX(0px)"], [24, "transform:translateX(0px)"], [62, "transform:translateX(-190px)"]], "transform:translateX(0px)")),
    kf("pa1-b", reset([[0, "transform:translateX(0px)"], [24, "transform:translateX(0px)"], [62, "transform:translateX(190px)"]], "transform:translateX(0px)")),
    kf("pa1-line", reset([[0, "transform:scaleX(1);opacity:1"], [24, "transform:scaleX(1);opacity:1"], [62, "transform:scaleX(4.96);opacity:.18"]], "transform:scaleX(1);opacity:1")),
    kf("pa1-marker", reset([[0, "transform:translateX(0px)"], [24, "transform:translateX(0px)"], [62, "transform:translateX(500px)"]], "transform:translateX(0px)")),
    show("pa1-roll", [[58, 96]]),
    ...PHOTOS.map((p, i) => {
      const s = 30 + i * 6;
      return kf(`pa1-photo${i}`, reset([[0, at(p.from)], [s, at(p.from)], [s + 10, at(p.to, 0.4)]], at(p.from)));
    }),
  ];

  return (
    <Stage
      id="pa1"
      label="Animation: two friends start close together with shared photos between them; over a year they drift apart and the photos fall into a camera roll pile."
      css={css}
      captions={[
        { text: "Friends start out close, with plenty of shared moments.", from: 0, to: 25 },
        { text: "Over time, schedules and distance pull them apart…", from: 27, to: 60 },
        { text: "…and the moments end up buried in a camera roll, tied to nowhere.", from: 62, to: 96 },
      ]}
    >
      {/* Timeline */}
      <line x1="150" y1="50.5" x2="650" y2="50.5" stroke="#2c2c2c" strokeWidth="2" />
      {[["today", 150], ["a month", 400], ["a year", 650]].map(([t, x]) => (
        <g key={t}>
          <circle cx={x} cy="50.5" r="3" fill="#3a3a3a" />
          <text x={x} y="74" textAnchor="middle" className="fig-t-s">{t}</text>
        </g>
      ))}
      <circle cx="150" cy="50.5" r="6" fill="#ffffff" style={anim("pa1-marker")} />

      {/* Connection between the two */}
      <line
        x1="352"
        y1="196"
        x2="448"
        y2="196"
        stroke="#bdbdbd"
        strokeWidth="2"
        strokeDasharray="6 5"
        style={{ ...anim("pa1-line"), transformBox: "fill-box", transformOrigin: "center" }}
      />
      <g style={anim("pa1-a")}>
        <Person x={330} y={200} color={BLUE} label="you" />
      </g>
      <g style={anim("pa1-b")}>
        <Person x={470} y={200} color={PINK} label="friend" />
      </g>

      {/* Camera roll */}
      <g style={animLinear("pa1-roll")}>
        {Array.from({ length: 18 }, (_, i) => (
          <rect key={i} x={340 + (i % 9) * 14} y={288 + Math.floor(i / 9) * 14} width="11" height="11" rx="1.5" fill="#262626" />
        ))}
        <text x="400" y="334" textAnchor="middle" className="fig-t-s">camera roll · 2,341 photos</text>
      </g>
      {PHOTOS.map((p, i) => (
        <g key={i} style={anim(`pa1-photo${i}`)}>
          <Polaroid color={p.color} />
        </g>
      ))}
    </Stage>
  );
}

/* 2. The map: OSM → tilt-shift → flowers where photos were taken */

const MAP_C = [400, 190];
const CELL = 40;
const TILT = { scaleY: 0.55, deg: -35 };

// Where a point on the flat map lands after the tilt (rotate, then squash).
function project([x, y]) {
  const a = (TILT.deg * Math.PI) / 180;
  const rx = x * Math.cos(a) - y * Math.sin(a);
  const ry = x * Math.sin(a) + y * Math.cos(a);
  return [MAP_C[0] + rx, MAP_C[1] + ry * TILT.scaleY];
}

function MapTiles() {
  const [cx, cy] = MAP_C;
  const blocks = [];
  for (let i = -3; i <= 3; i++) {
    for (let j = -3; j <= 3; j++) {
      const park = (i * 7 + j * 3 + 21) % 11 === 0;
      const shade = (i + j + 6) % 3 === 0 ? "#3a332d" : "#2f2a26";
      blocks.push(
        <rect
          key={`${i},${j}`}
          x={cx + i * CELL - CELL / 2 + 5}
          y={cy + j * CELL - CELL / 2 + 5}
          width={CELL - 10}
          height={CELL - 10}
          rx="2"
          fill={park ? "#2c3a2f" : shade}
        />
      );
    }
  }
  const half = CELL * 3.5;
  return (
    <g>
      <rect x={cx - half} y={cy - half} width={half * 2} height={half * 2} fill="#1f1c26" />
      {blocks}
      <line x1={cx - half} y1={cy} x2={cx + half} y2={cy} stroke="#6b5f8a" strokeWidth="5" />
      <line x1={cx - CELL} y1={cy - half} x2={cx - CELL} y2={cy + half} stroke="#6b5f8a" strokeWidth="5" />
      <line x1={cx - half} y1={cy + half} x2={cx + half * 0.4} y2={cy - half} stroke="#5a5076" strokeWidth="3" />
    </g>
  );
}

const PLACES = [[-80, -60], [40, -20], [100, 70], [-30, 60]].map(project);

function Flower() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="7" ry="2.5" fill="#000" opacity=".45" />
      <line x1="0" y1="0" x2="0" y2="-22" stroke="#7fa877" strokeWidth="2" />
      {[0, 72, 144, 216, 288].map((d) => (
        <circle
          key={d}
          cx={Math.cos(((d - 90) * Math.PI) / 180) * 6}
          cy={-28 + Math.sin(((d - 90) * Math.PI) / 180) * 6}
          r="5.5"
          fill={PINK}
        />
      ))}
      <circle cx="0" cy="-28" r="3.5" fill="#fbe3a1" />
    </g>
  );
}

function BloomFigure() {
  const flat = "transform:scaleY(1) rotate(0deg)";
  const tilted = `transform:scaleY(${TILT.scaleY}) rotate(${TILT.deg}deg)`;
  const css = [
    kf("pa2-tilt", reset([[0, flat], [30, flat], [42, tilted]], flat)),
    show("pa2-blur", [[40, 96]], { ramp: 5 }),
    ...PLACES.flatMap((_, i) => {
      const s = 56 + i * 6;
      return [
        kf(`pa2-drop${i}`, [
          [0, "opacity:0;transform:translateY(-140px)"],
          [s, "opacity:0;transform:translateY(-140px)"],
          [s + 0.5, "opacity:1;transform:translateY(-140px)"],
          [s + 3, "opacity:1;transform:translateY(0px)"],
          [s + 4, "opacity:0;transform:translateY(0px)"],
          [100, "opacity:0;transform:translateY(0px)"],
        ]),
        kf(`pa2-bloom${i}`, reset([[0, "transform:scale(0)"], [s + 3, "transform:scale(0)"], [s + 6, "transform:scale(1.15)"], [s + 7, "transform:scale(1)"]], "transform:scale(0)")),
      ];
    }),
  ];
  const tiltStyle = { ...anim("pa2-tilt"), transformBox: "fill-box", transformOrigin: "center" };

  return (
    <Stage
      id="pa2"
      label="Animation: a flat street map from OpenStreetMap tilts into a miniature-looking city with blurred edges, then shared photos drop onto places and bloom into flowers."
      css={css}
      captions={[
        { text: "1 · Start from OpenStreetMap data: streets and building footprints.", from: 0, to: 29 },
        { text: "2 · Tilt the city and blur its edges with a tilt-shift shader, so it reads like a miniature.", from: 31, to: 53 },
        { text: "3 · Each shared photo is planted as a flower where it was taken.", from: 55, to: 80 },
        { text: "4 · Over time, the map fills in with the places a friendship lives.", from: 82, to: 96 },
      ]}
    >
      <defs>
        <filter id="pa2-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <linearGradient id="pa2-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".3" stopColor="#fff" />
          <stop offset=".44" stopColor="#000" />
          <stop offset=".58" stopColor="#000" />
          <stop offset=".72" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <mask id="pa2-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="400">
          <rect x="0" y="40" width="800" height="300" fill="url(#pa2-band)" />
        </mask>
      </defs>

      <g style={tiltStyle}>
        <MapTiles />
      </g>
      {/* Tilt-shift: a blurred copy of the map shows only in the top and bottom bands */}
      <g mask="url(#pa2-mask)" style={animLinear("pa2-blur")}>
        <g filter="url(#pa2-soft)">
          <g style={tiltStyle}>
            <MapTiles />
          </g>
        </g>
      </g>

      {PLACES.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <g style={anim(`pa2-drop${i}`)}>
            <g transform="translate(0 -18) scale(.6)">
              <Polaroid color={["#c98b6b", BLUE, "#e7b65c", "#8fbf8f"][i]} />
            </g>
          </g>
          <g style={{ ...anim(`pa2-bloom${i}`), transformBox: "fill-box", transformOrigin: "50% 100%" }}>
            <Flower />
          </g>
        </g>
      ))}
    </Stage>
  );
}

export const PACT_FIGURES = {
  "pact-drift": DriftFigure,
  "pact-map": BloomFigure,
};
