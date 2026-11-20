import { useEffect, useRef, useState } from "react";

// Animated before → after diagrams for the Penn Clubs case study.
// Every figure runs on one shared 10s loop; timings below are percentages of it.
// Keyframes are generated per figure so each element's timeline lives next to
// the element it moves.

const DUR = 10;
const EASE = "cubic-bezier(.65,0,.35,1)";
const C = {
  win: "#1a1a1a",
  panel: "#1f1f1f",
  line: "#2c2c2c",
  ink: "#3a3a3a",
  muted: "#7a7a7a",
  accent: "#5b8cff",
  bad: "#ef6a57",
  good: "#4fbf7f",
};

const anim = (name, timing = EASE) => ({ animation: `${name} ${DUR}s ${timing} infinite` });
const animLinear = (name) => anim(name, "linear");

function kf(name, stops) {
  const sorted = stops
    .map(([p, css]) => [Math.max(0, Math.min(100, p)), css])
    .sort((x, y) => x[0] - y[0]);
  return `@keyframes ${name}{${sorted.map(([p, css]) => `${+p.toFixed(2)}%{${css}}`).join("")}}`;
}

// Opacity on during each [start, end] interval.
function show(name, intervals, { ramp = 0.8, lo = 0, hi = 1 } = {}) {
  const stops = [[0, `opacity:${lo}`], [100, `opacity:${lo}`]];
  for (const [s, e] of intervals) {
    stops.push(
      [s, `opacity:${lo}`],
      [s + ramp, `opacity:${hi}`],
      [e, `opacity:${hi}`],
      [e + ramp, `opacity:${lo}`]
    );
  }
  return kf(name, stops);
}

// Fade + slide up at `start`, hold until `end`.
function rise(name, start, end = 96) {
  const hidden = "opacity:0;transform:translateY(10px)";
  const shown = "opacity:1;transform:translateY(0px)";
  return kf(name, [
    [0, hidden],
    [start, hidden],
    [start + 3, shown],
    [end, shown],
    [end + 1.5, "opacity:0;transform:translateY(0px)"],
    [100, hidden],
  ]);
}

// Move between [pct, x, y] waypoints; `clicks` are pcts where the cursor presses.
function cursorPath(name, points, clicks = []) {
  const at = (p) => {
    let prev = points[0];
    for (const pt of points) {
      if (pt[0] <= p) prev = pt;
    }
    return prev;
  };
  const stops = points.map(([p, x, y]) => [p, `transform:translate(${x}px,${y}px) scale(1)`]);
  for (const c of clicks) {
    const [, x, y] = at(c);
    stops.push(
      [c - 0.6, `transform:translate(${x}px,${y}px) scale(1)`],
      [c, `transform:translate(${x}px,${y}px) scale(.78)`],
      [c + 0.6, `transform:translate(${x}px,${y}px) scale(1)`]
    );
  }
  return kf(name, stops);
}

const CYCLE = kf("pc-cycle", [
  [0, "opacity:0"],
  [2, "opacity:1"],
  [95.5, "opacity:1"],
  [98, "opacity:0"],
  [100, "opacity:0"],
]);

function Cursor({ name }) {
  return (
    <g style={anim(name)}>
      <path
        d="M0 0 L0 17 L4.6 12.6 L7.6 19.6 L10.4 18.4 L7.4 11.6 L13.4 11.6 Z"
        fill="#ffffff"
        stroke="#0e0e0e"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Check({ x, y, size = 14 }) {
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx="3" fill={C.accent} />
      <path
        d={`M${x + 3.5} ${y + size / 2} l${size * 0.2} ${size * 0.22} l${size * 0.38} -${size * 0.42}`}
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Frame({ id, url, label, switchAt, css, children }) {
  const badges = [
    show(`${id}-bb`, [[0, switchAt - 1]]),
    show(`${id}-ba`, [[switchAt, 96]]),
  ];
  return (
    <svg className="pc-fig-svg" viewBox="0 0 800 460" role="img" aria-label={label}>
      <style>{CYCLE + badges.join("") + css.join("")}</style>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect x="25" y="61" width="750" height="374" />
        </clipPath>
      </defs>
      <rect width="800" height="460" fill="#121212" />
      <rect x="24" y="24" width="752" height="412" rx="10" fill={C.win} stroke={C.line} />
      <line x1="24" y1="60.5" x2="776" y2="60.5" stroke={C.line} />
      {[44, 58, 72].map((cx) => (
        <circle key={cx} cx={cx} cy="42" r="4.5" fill="#333" />
      ))}
      <text x="94" y="46" className="pc-t-s">{url}</text>
      <g style={animLinear("pc-cycle")}>
        <g style={animLinear(`${id}-bb`)}>
          <rect x="672" y="32" width="90" height="20" rx="10" fill="none" stroke={C.bad} />
          <text x="717" y="46" textAnchor="middle" className="pc-t-badge" fill={C.bad}>BEFORE</text>
        </g>
        <g style={animLinear(`${id}-ba`)}>
          <rect x="672" y="32" width="90" height="20" rx="10" fill={C.accent} fillOpacity=".16" stroke={C.accent} />
          <text x="717" y="46" textAnchor="middle" className="pc-t-badge" fill={C.accent}>AFTER</text>
        </g>
        <g clipPath={`url(#${id}-clip)`}>{children}</g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Large, confusing layout → sidebar navigation + full-width content */
/* ------------------------------------------------------------------ */

const TABS = [
  { label: "Edit Club Page", slot: 0 },
  { label: "Admin Notes", slot: 9, more: true },
  { label: "Membership", slot: 1 },
  { label: "Events", slot: 2 },
  { label: "Recruitment", slot: 3, dup: true },
  { label: "Applications Page", slot: 4, indent: 16, dup: true },
  { label: "Resources", slot: 6 },
  { label: "Questions", slot: 5, indent: 16 },
  { label: "Settings", slot: 8 },
  { label: "Analytics", slot: 7 },
  { label: "Club Management", slot: 9, more: true },
];
const CHAR_W = 6.62;
const SWITCH_1 = 47;

function LayoutFigure() {
  const css = [];
  let x = 48;
  const tabs = TABS.map((t, i) => {
    const w = Math.round(t.label.length * CHAR_W + 20);
    const bx = x;
    x += w + 6;
    const dx = 40 + (t.indent || 0) - bx;
    const dy = t.slot * 30 + 4;
    const s = 44 + i * 0.7;
    const moved = `transform:translate(${dx}px,${dy}px)`;
    css.push(
      kf(`pc1-tab${i}`, [
        [0, "transform:translate(0px,0px)"],
        [s, "transform:translate(0px,0px)"],
        [s + 10, moved],
        [96.5, moved],
        [98, "transform:translate(0px,0px)"],
        [100, "transform:translate(0px,0px)"],
      ]),
      show(`pc1-box${i}`, [[0, s + 4]]),
      t.more ? show(`pc1-more${i}`, [[0, s + 8]]) : ""
    );
    return { ...t, bx, w, i };
  });

  css.push(
    kf("pc1-row", [
      [0, "transform:translateX(0px)"],
      [8, "transform:translateX(0px)"],
      [18, "transform:translateX(-380px)"],
      [24, "transform:translateX(-380px)"],
      [32, "transform:translateX(0px)"],
      [100, "transform:translateX(0px)"],
    ]),
    kf("pc1-dup", [
      [0, `stroke:${C.line}`],
      [31, `stroke:${C.line}`],
      [33, `stroke:${C.bad}`],
      [43, `stroke:${C.bad}`],
      [46, `stroke:${C.line}`],
      [100, `stroke:${C.line}`],
    ]),
    show("pc1-dupnote", [[32.5, 44]]),
    show("pc1-overflow", [[8, 31]]),
    show("pc1-space", [[10, 44]]),
    show("pc1-before", [[0, SWITCH_1 - 1]]),
    show("pc1-side", [[SWITCH_1, 96]]),
    show("pc1-active", [[57, 96]]),
    show("pc1-morelabel", [[58, 96]]),
    kf("pc1-title", [
      [0, "transform:translateX(0px)"],
      [44, "transform:translateX(0px)"],
      [54, "transform:translateX(172px)"],
      [96.5, "transform:translateX(172px)"],
      [98, "transform:translateX(0px)"],
      [100, "transform:translateX(0px)"],
    ]),
    rise("pc1-cardA", 55),
    rise("pc1-cardB", 57),
    rise("pc1-cardC", 59)
  );

  const recruit = tabs.find((t) => t.label === "Recruitment");
  const apps = tabs.find((t) => t.label === "Applications Page");

  return (
    <Frame
      id="pc1"
      url="pennclubs.com/club/ppjo/edit"
      label="Animation: the admin dashboard's overflowing row of eleven tabs folds into a grouped sidebar, and the narrow content column expands into full-width cards."
      switchAt={SWITCH_1}
      css={css}
    >
      {/* AFTER: sidebar background (drawn first so tabs land on top of it) */}
      <g style={animLinear("pc1-side")}>
        <rect x="25" y="61" width="180" height="374" fill="#161616" />
        <line x1="205.5" y1="61" x2="205.5" y2="435" stroke={C.line} />
        <text x="40" y="90" className="pc-t-s">CLUB ADMIN</text>
      </g>
      <g style={animLinear("pc1-active")}>
        <rect x="32" y="108" width="166" height="24" rx="4" fill={C.accent} fillOpacity=".16" />
        <rect x="32" y="112" width="2.5" height="16" rx="1" fill={C.accent} />
      </g>
      <text x="40" y="132" dy={9 * 30 - 8} className="pc-t" fill={C.muted} style={animLinear("pc1-morelabel")}>
        More ▾
      </text>

      {/* Title slides into the content column */}
      <text x="48" y="92" className="pc-t-h" style={anim("pc1-title")}>
        Penn Pre-Professional Juggling Org
      </text>

      {/* BEFORE: narrow content column surrounded by dead space */}
      <g style={animLinear("pc1-before")}>
        <text x="296" y="170" className="pc-t-h">Invite Members</text>
        {[[182, 208], [194, 196], [206, 150], [224, 208], [236, 200], [248, 208], [260, 120]].map(([y, w]) => (
          <rect key={y} x="296" y={y} width={w} height="5" rx="2" fill={C.ink} />
        ))}
        <rect x="296" y="274" width="208" height="56" rx="3" fill="none" stroke={C.line} />
        <text x="296" y="352" className="pc-t-s">Permissions</text>
        <rect x="296" y="358" width="208" height="22" rx="3" fill="none" stroke={C.line} />
        <text x="296" y="400" className="pc-t-s">Title</text>
        <rect x="296" y="406" width="208" height="22" rx="3" fill="none" stroke={C.line} />
      </g>
      <g style={animLinear("pc1-space")}>
        {[40, 520].map((rx) => (
          <g key={rx}>
            <rect x={rx} y="150" width="240" height="276" rx="6" fill={C.bad} fillOpacity=".05" stroke={C.bad} strokeOpacity=".55" strokeDasharray="5 5" />
            <text x={rx + 120} y="292" textAnchor="middle" className="pc-t-note">unused space</text>
          </g>
        ))}
      </g>

      {/* AFTER: full-width cards */}
      <g style={anim("pc1-cardA")}>
        <rect x="220" y="108" width="340" height="312" rx="6" fill={C.panel} stroke={C.line} />
        <text x="236" y="132" className="pc-t-h">General</text>
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <rect x="236" y={148 + k * 52} width={60 + ((k * 23) % 40)} height="5" rx="2" fill={C.ink} />
            <rect x="236" y={160 + k * 52} width="308" height="26" rx="4" fill="#191919" stroke={C.line} />
          </g>
        ))}
      </g>
      <g style={anim("pc1-cardB")}>
        <rect x="576" y="108" width="180" height="150" rx="6" fill={C.panel} stroke={C.line} />
        <text x="592" y="132" className="pc-t-h">Club Logo</text>
        <rect x="592" y="144" width="148" height="98" rx="4" fill="none" stroke={C.ink} strokeDasharray="4 4" />
        <path d="M616 222 l24 -26 l16 16 l10 -10 l20 20 Z" fill={C.ink} />
        <circle cx="704" cy="172" r="7" fill={C.ink} />
      </g>
      <g style={anim("pc1-cardC")}>
        <rect x="576" y="272" width="180" height="148" rx="6" fill={C.panel} stroke={C.line} />
        <text x="592" y="296" className="pc-t-h">Contact</text>
        {[0, 1, 2].map((k) => (
          <g key={k}>
            <rect x="592" y={308 + k * 36} width={40 + k * 12} height="5" rx="2" fill={C.ink} />
            <rect x="592" y={318 + k * 36} width="148" height="18" rx="3" fill="#191919" stroke={C.line} />
          </g>
        ))}
      </g>

      {/* The tab row: scrolls to reveal overflow, then each tab flies into the sidebar */}
      <g style={anim("pc1-row")}>
        {tabs.map((t) => (
          <g key={t.label} style={anim(`pc1-tab${t.i}`)}>
            <g style={t.more ? animLinear(`pc1-more${t.i}`) : undefined}>
              <rect
                x={t.bx}
                y="104"
                width={t.w}
                height="24"
                rx="4"
                fill="#222"
                stroke={C.line}
                style={{
                  animation: [
                    `pc1-box${t.i} ${DUR}s linear infinite`,
                    t.dup ? `pc1-dup ${DUR}s linear infinite` : null,
                  ]
                    .filter(Boolean)
                    .join(","),
                }}
              />
              <text x={t.bx + 10} y="120" className="pc-t" fill={t.slot === 0 ? "#fff" : undefined}>
                {t.label}
              </text>
            </g>
          </g>
        ))}
        <g style={animLinear("pc1-dupnote")}>
          <path
            d={`M${recruit.bx + 8} 134 v8 H${apps.bx + apps.w - 8} v-8`}
            fill="none"
            stroke={C.bad}
            strokeWidth="1.2"
          />
          <text x={(recruit.bx + apps.bx + apps.w) / 2} y="162" textAnchor="middle" className="pc-t-note">
            two tabs, one job
          </text>
        </g>
      </g>
      <g style={animLinear("pc1-overflow")}>
        <text x="760" y="92" textAnchor="end" className="pc-t-note">
          11 tabs, overflowing →
        </text>
      </g>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Lack of advanced messaging → filter, batch select, templated compose */
/* ------------------------------------------------------------------ */

const MEMBERS = ["A", "P", "A", "A", "R", "P", "A", "P", "R"];
const STATUS = {
  A: { label: "Accepted", color: C.good },
  P: { label: "Pending", color: C.muted },
  R: { label: "Rejected", color: C.bad },
};
const ROW_CHECKS = {
  0: [[11.5, 35.5], [45.5, 96]],
  2: [[20.5, 35.5], [45.8, 96]],
  3: [[29.5, 35.5], [46.1, 96]],
  6: [[46.4, 96]],
};
const SWITCH_2 = 38;

function MessagingFigure() {
  const css = [
    cursorPath(
      "pc2-cursor",
      [
        [0, 600, 330],
        [9, 63, 167],
        [18, 63, 227],
        [27, 63, 257],
        [36, 265, 114],
        [43, 63, 140],
        [50, 688, 114],
        [66, 566, 364],
        [80, 704, 364],
        [92, 600, 330],
        [100, 600, 330],
      ],
      [11, 20, 29, 38, 45, 52, 69, 83]
    ),
    show("pc2-c1", [[11.5, 20]]),
    show("pc2-c2", [[20.5, 29]]),
    show("pc2-c3", [[29.5, 36]]),
    show("pc2-c4", [[46.5, 96]]),
    show("pc2-note", [[13, 37]]),
    show("pc2-filter", [[38.5, 96]]),
    show("pc2-all", [[45.3, 96]]),
    show("pc2-btnoff", [[0, 46.5]]),
    show("pc2-btnon", [[46.5, 96]]),
    kf("pc2-dim", [
      [0, "opacity:1"],
      [39, "opacity:1"],
      [40.5, "opacity:.22"],
      [95, "opacity:.22"],
      [97, "opacity:1"],
      [100, "opacity:1"],
    ]),
    kf("pc2-panel", [
      [0, "transform:translateX(330px)"],
      [53, "transform:translateX(330px)"],
      [59, "transform:translateX(0px)"],
      [96, "transform:translateX(0px)"],
      [98, "transform:translateX(330px)"],
      [100, "transform:translateX(330px)"],
    ]),
    kf("pc2-toggle", [
      [0, "transform:translateX(0px)"],
      [69.4, "transform:translateX(0px)"],
      [70.6, "transform:translateX(66px)"],
      [96, "transform:translateX(66px)"],
      [98, "transform:translateX(0px)"],
      [100, "transform:translateX(0px)"],
    ]),
    show("pc2-token", [[0, 70]]),
    show("pc2-real", [[70.5, 96]]),
    show("pc2-send", [[0, 83.5]]),
    show("pc2-sent", [[83.5, 96]]),
    ...Object.entries(ROW_CHECKS).map(([i, iv]) => show(`pc2-chk${i}`, iv, { ramp: 0.3 })),
  ];

  return (
    <Frame
      id="pc2"
      url="pennclubs.com/club/ppjo/members"
      label="Animation: an admin checks members one at a time with no filters; then a status filter plus select-all picks every accepted member at once, and a compose panel opens with a congrats template, live preview, and send."
      switchAt={SWITCH_2}
      css={css}
    >
      <text x="48" y="90" className="pc-t-h">Members</text>
      {["c1", "c2", "c3"].map((c, k) => (
        <text key={c} x="126" y="90" className="pc-t" fill={C.muted} style={animLinear(`pc2-${c}`)}>
          {k + 1} of 40 selected
        </text>
      ))}
      <text x="126" y="90" className="pc-t" fill={C.accent} style={animLinear("pc2-c4")}>
        4 selected
      </text>
      <text x="760" y="90" textAnchor="end" className="pc-t-note" style={animLinear("pc2-note")}>
        no filters · select one at a time
      </text>

      {/* Toolbar */}
      <rect x="48" y="102" width="172" height="24" rx="4" fill="#191919" stroke={C.line} />
      <text x="58" y="118" className="pc-t-s">Search members…</text>
      <rect x="230" y="102" width="70" height="24" rx="4" fill="none" stroke={C.line} />
      <text x="242" y="118" className="pc-t">Filter ▾</text>
      <g style={animLinear("pc2-filter")}>
        <rect x="308" y="102" width="146" height="24" rx="12" fill={C.accent} fillOpacity=".16" stroke={C.accent} />
        <text x="320" y="118" className="pc-t" fill={C.accent}>Status: Accepted ×</text>
      </g>
      <g style={animLinear("pc2-btnoff")}>
        <rect x="624" y="102" width="128" height="24" rx="4" fill="#202020" stroke={C.line} />
        <text x="688" y="118" textAnchor="middle" className="pc-t" fill="#555">Message</text>
      </g>
      <g style={animLinear("pc2-btnon")}>
        <rect x="624" y="102" width="128" height="24" rx="4" fill={C.accent} />
        <text x="688" y="118" textAnchor="middle" className="pc-t" fill="#fff">✉ Message 4</text>
      </g>

      {/* Table */}
      <rect x="56" y="133" width="14" height="14" rx="3" fill="none" stroke="#4a4a4a" />
      <g style={animLinear("pc2-all")}>
        <Check x={56} y={133} />
      </g>
      {[["Name", 84], ["Email", 210], ["Status", 360], ["Year", 456]].map(([t, hx]) => (
        <text key={t} x={hx} y="144" className="pc-t-s">{t}</text>
      ))}
      <line x1="48" y1="151.5" x2="752" y2="151.5" stroke={C.line} />
      {MEMBERS.map((s, i) => {
        const r = 152 + i * 30;
        const st = STATUS[s];
        return (
          <g key={i}>
            <g style={s === "A" ? undefined : animLinear("pc2-dim")}>
              <rect x="56" y={r + 8} width="14" height="14" rx="3" fill="none" stroke="#4a4a4a" />
              <rect x="84" y={r + 12} width={80 + ((i * 17) % 34)} height="6" rx="3" fill="#555" />
              <rect x="210" y={r + 12} width={110 + ((i * 23) % 36)} height="6" rx="3" fill={C.ink} />
              <rect x="356" y={r + 7} width="76" height="16" rx="8" fill={st.color} fillOpacity=".14" />
              <text x="394" y={r + 19} textAnchor="middle" className="pc-t-s" fill={st.color}>
                {st.label}
              </text>
              <text x="456" y={r + 19} className="pc-t-s">{2026 + (i % 4)}</text>
            </g>
            {ROW_CHECKS[i] && (
              <g style={animLinear(`pc2-chk${i}`)}>
                <Check x={56} y={r + 8} />
              </g>
            )}
            <line x1="48" y1={r + 30.5} x2="752" y2={r + 30.5} stroke="#222" />
          </g>
        );
      })}

      {/* Compose panel */}
      <g style={anim("pc2-panel")}>
        <rect x="452" y="61" width="324" height="374" fill="#202020" />
        <line x1="452.5" y1="61" x2="452.5" y2="435" stroke="#333" />
        <text x="472" y="90" className="pc-t-h">New message</text>
        <rect x="472" y="100" width="182" height="20" rx="10" fill={C.accent} fillOpacity=".16" />
        <text x="484" y="114" className="pc-t-s" fill={C.accent}>To: 4 members · Accepted</text>

        <text x="472" y="146" className="pc-t" fill="#fff">Congrats</text>
        <text x="556" y="146" className="pc-t" fill={C.muted}>Rejection</text>
        <text x="646" y="146" className="pc-t" fill={C.muted}>Custom</text>
        <rect x="472" y="152" width="56" height="2" fill={C.accent} />
        <line x1="472" y1="154.5" x2="756" y2="154.5" stroke="#2e2e2e" />

        <text x="472" y="174" className="pc-t-s">Subject</text>
        <rect x="472" y="180" width="284" height="24" rx="4" fill="#1a1a1a" stroke={C.line} />
        <text x="482" y="196" className="pc-t">Welcome to PPJO!</text>

        <rect x="472" y="212" width="284" height="128" rx="4" fill="#1a1a1a" stroke={C.line} />
        <text x="482" y="232" className="pc-t">Hi</text>
        <g style={animLinear("pc2-token")}>
          <rect x="502" y="220" width="94" height="17" rx="4" fill={C.accent} fillOpacity=".2" />
          <text x="508" y="232" className="pc-t-s" fill={C.accent}>{"{first_name}"}</text>
          <rect x="482" y="302" width="88" height="17" rx="4" fill={C.accent} fillOpacity=".2" />
          <text x="488" y="314" className="pc-t-s" fill={C.accent}>{"{committee}"}</text>
        </g>
        <g style={animLinear("pc2-real")}>
          <text x="504" y="232" className="pc-t" fill="#fff">Benjamin,</text>
          <text x="482" y="314" className="pc-t" fill="#fff">Events committee</text>
        </g>
        {[[246, 250], [260, 230], [274, 256], [288, 170]].map(([y, w]) => (
          <rect key={y} x="482" y={y} width={w} height="5" rx="2" fill={C.ink} />
        ))}
        <rect x="482" y="326" width="140" height="5" rx="2" fill={C.ink} />

        <rect x="472" y="352" width="132" height="24" rx="12" fill="none" stroke={C.line} />
        <rect x="474" y="354" width="62" height="20" rx="10" fill={C.accent} fillOpacity=".25" style={anim("pc2-toggle")} />
        <text x="505" y="368" textAnchor="middle" className="pc-t">Edit</text>
        <text x="571" y="368" textAnchor="middle" className="pc-t">Preview</text>

        <g style={animLinear("pc2-send")}>
          <rect x="664" y="350" width="92" height="28" rx="4" fill={C.accent} />
          <text x="710" y="368" textAnchor="middle" className="pc-t" fill="#fff">Send</text>
        </g>
        <g style={animLinear("pc2-sent")}>
          <rect x="664" y="350" width="92" height="28" rx="4" fill={C.good} />
          <text x="710" y="368" textAnchor="middle" className="pc-t" fill="#0e0e0e">Sent ✓</text>
        </g>
        <text x="472" y="404" className="pc-t-s" style={animLinear("pc2-real")}>
          Previewing as Benjamin Franklin
        </text>
      </g>

      <Cursor name="pc2-cursor" />
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Confusing application creation → stepped, collapsible flow       */
/* ------------------------------------------------------------------ */

const SWITCH_3 = 47;

function buildLongForm() {
  const els = [];
  let y = 142;
  let k = 0;
  const heading = (t) => {
    els.push(<text key={k++} x="48" y={y + 12} className="pc-t-h">{t}</text>);
    y += 24;
  };
  const lines = (n) => {
    for (let i = 0; i < n; i++) {
      els.push(<rect key={k++} x="48" y={y} width={640 - ((i * 97) % 220)} height="5" rx="2" fill={C.ink} />);
      y += 12;
    }
    y += 8;
  };
  const input = (label, w = 420) => {
    els.push(<text key={k++} x="48" y={y + 8} className="pc-t-s">{label}</text>);
    els.push(<rect key={k++} x="48" y={y + 14} width={w} height="22" rx="3" fill="none" stroke={C.line} />);
    y += 46;
  };
  const buttons = (list) => {
    let bx = 48;
    for (const [t, c] of list) {
      const w = t.length * 6 + 18;
      els.push(<rect key={k++} x={bx} y={y} width={w} height="20" rx="3" fill={c} fillOpacity=".75" />);
      els.push(<text key={k++} x={bx + 9} y={y + 14} className="pc-t-s" fill="#fff">{t}</text>);
      bx += w + 8;
    }
    y += 32;
  };
  const table = (n) => {
    for (let i = 0; i < n; i++) {
      els.push(<rect key={k++} x="48" y={y + 4} width="10" height="10" rx="2" fill="none" stroke={C.bad} strokeOpacity=".6" />);
      els.push(<rect key={k++} x="72" y={y + 6} width={70 + (i * 13) % 30} height="5" rx="2" fill={C.ink} />);
      els.push(<rect key={k++} x="190" y={y + 6} width="150" height="5" rx="2" fill={C.ink} />);
      els.push(<text key={k++} x="380" y={y + 12} className="pc-t-s">Pending</text>);
      y += 20;
    }
    y += 12;
  };

  heading("Applications");
  lines(2);
  input("Select an application");
  heading("Responses");
  buttons([["Update Status", "#3f9f5f"], ["Send Updates", "#4a6fd0"], ["Select All Pending", "#3f9f5f"]]);
  table(6);
  heading("Extensions");
  input("Username");
  input("End Time");
  buttons([["Create", "#3aa58f"]]);
  heading("Questions");
  input("Question 1", 560);
  input("Question 2", 560);
  input("Question 3", 560);
  heading("Committees");
  input("Committee name");
  heading("Emails");
  lines(4);
  return { els, height: y - 142 };
}

function ApplicationsFigure() {
  const form = buildLongForm();
  const scroll = Math.max(0, form.height - 250);
  const css = [
    show("pc3-before", [[0, SWITCH_3 - 1]]),
    show("pc3-after", [[SWITCH_3, 96]]),
    show("pc3-q", [[4, 44]]),
    show("pc3-note", [[12, 44]]),
    kf("pc3-scroll", [
      [0, "transform:translateY(0px)"],
      [6, "transform:translateY(0px)"],
      [38, `transform:translateY(-${scroll}px)`],
      [100, `transform:translateY(-${scroll}px)`],
    ]),
    kf("pc3-thumb", [
      [0, "transform:translateY(0px)"],
      [6, "transform:translateY(0px)"],
      [38, "transform:translateY(250px)"],
      [100, "transform:translateY(250px)"],
    ]),
    kf("pc3-progress", [
      [0, "transform:scaleY(0)"],
      [50, "transform:scaleY(0)"],
      [63, "transform:scaleY(.333)"],
      [77, "transform:scaleY(.667)"],
      [89, "transform:scaleY(1)"],
      [96, "transform:scaleY(1)"],
      [98, "transform:scaleY(0)"],
      [100, "transform:scaleY(0)"],
    ]),
    ...[50, 63, 77, 89].map((s, i) => show(`pc3-step${i}`, [[s, 96]])),
    ...[62, 76, 88].map((s, i) => show(`pc3-done${i}`, [[s, 96]])),
    kf("pc3-h2", [
      [0, "transform:translateY(0px)"],
      [62, "transform:translateY(0px)"],
      [64.5, "transform:translateY(-124px)"],
      [96.5, "transform:translateY(-124px)"],
      [98, "transform:translateY(0px)"],
      [100, "transform:translateY(0px)"],
    ]),
    kf("pc3-h3", [
      [0, "transform:translateY(0px)"],
      [76, "transform:translateY(0px)"],
      [78.5, "transform:translateY(-124px)"],
      [96.5, "transform:translateY(-124px)"],
      [98, "transform:translateY(0px)"],
      [100, "transform:translateY(0px)"],
    ]),
    show("pc3-body1", [[49, 62]]),
    show("pc3-body2", [[64, 76]]),
    show("pc3-body3", [[78, 96]]),
    kf("pc3-type", [
      [0, "transform:scaleX(1)"],
      [51, "transform:scaleX(1)"],
      [56, "transform:scaleX(0)"],
      [100, "transform:scaleX(0)"],
    ]),
    rise("pc3-chip0", 56.5, 62),
    rise("pc3-chip1", 57.5, 62),
    rise("pc3-chip2", 58.5, 62),
    rise("pc3-q0", 65, 76),
    rise("pc3-q1", 67, 76),
    rise("pc3-q2", 69, 76),
    rise("pc3-e0", 79),
    rise("pc3-e1", 80.5),
    show("pc3-pub", [[SWITCH_3, 89.5]]),
    show("pc3-pubd", [[89.5, 96]]),
  ];

  const header = (y, n, title, doneIdx, animName) => (
    <g style={animName ? anim(animName) : undefined}>
      <rect x="216" y={y} width="540" height="36" rx="5" fill="#222" stroke={C.line} />
      <text x="232" y={y + 23} className="pc-t" fill="#fff">
        {n} · {title}
      </text>
      {doneIdx != null && (
        <text x="740" y={y + 23} textAnchor="end" className="pc-t" fill={C.good} style={animLinear(`pc3-done${doneIdx}`)}>
          ✓ done
        </text>
      )}
    </g>
  );

  return (
    <Frame
      id="pc3"
      url="pennclubs.com/club/ppjo/recruitment"
      label="Animation: a single long page mixing responses, extensions, questions and emails scrolls on and on; then application creation becomes four collapsible steps — details, questions, emails, publish — with a progress tracker."
      switchAt={SWITCH_3}
      css={css}
    >
      {/* BEFORE */}
      <g style={animLinear("pc3-before")}>
        <text x="48" y="88" className="pc-t-h">Penn Pre-Professional Juggling Org</text>
        {[["Membership", 48], ["Events", 136], ["Recruitment", 196], ["Applications Page", 292], ["Resources", 424], ["Questions", 504]].map(
          ([t, tx]) => {
            const dup = t === "Recruitment" || t === "Applications Page";
            return (
              <g key={t}>
                <rect x={tx} y="100" width={t.length * CHAR_W + 16} height="22" rx="4" fill="#222" stroke={dup ? C.bad : C.line} />
                <text x={tx + 8} y="115" className="pc-t">{t}</text>
              </g>
            );
          }
        )}
        <g style={animLinear("pc3-q")}>
          <circle cx="288" cy="96" r="8" fill={C.bad} />
          <text x="288" y="100" textAnchor="middle" className="pc-t" fill="#0e0e0e">?</text>
        </g>
        <line x1="25" y1="130.5" x2="775" y2="130.5" stroke={C.line} />
        <svg x="0" y="131" width="800" height="304" viewBox="0 131 800 304" overflow="hidden">
          <g style={anim("pc3-scroll", "linear")}>{form.els}</g>
        </svg>
        <rect x="764" y="136" width="4" height="294" rx="2" fill="#222" />
        <rect x="764" y="136" width="4" height="44" rx="2" fill="#555" style={anim("pc3-thumb", "linear")} />
        <g style={animLinear("pc3-note")}>
          <rect x="520" y="372" width="232" height="46" rx="6" fill="#1a1a1a" stroke={C.bad} />
          <text x="636" y="391" textAnchor="middle" className="pc-t-note">one page, 30+ fields,</text>
          <text x="636" y="407" textAnchor="middle" className="pc-t-note">no clear first step</text>
        </g>
      </g>

      {/* AFTER */}
      <g style={animLinear("pc3-after")}>
        <rect x="25" y="61" width="180" height="374" fill="#161616" />
        <line x1="205.5" y1="61" x2="205.5" y2="435" stroke={C.line} />
        <text x="40" y="90" className="pc-t-s">NEW APPLICATION</text>
        <line x1="56" y1="120" x2="56" y2="270" stroke="#333" strokeWidth="2" />
        <line
          x1="56"
          y1="120"
          x2="56"
          y2="270"
          stroke={C.accent}
          strokeWidth="2"
          style={{ ...anim("pc3-progress"), transformBox: "fill-box", transformOrigin: "top" }}
        />
        {["Details", "Questions", "Emails", "Publish"].map((t, i) => (
          <g key={t}>
            <circle cx="56" cy={120 + i * 50} r="10" fill="#161616" stroke="#444" strokeWidth="1.5" />
            <g style={animLinear(`pc3-step${i}`)}>
              <circle cx="56" cy={120 + i * 50} r="10" fill={C.accent} />
            </g>
            <text x="56" y={124 + i * 50} textAnchor="middle" className="pc-t-s" fill="#fff">{i + 1}</text>
            <text x="76" y={124 + i * 50} className="pc-t">{t}</text>
          </g>
        ))}

        <text x="216" y="92" className="pc-t-h">Fall 2026 General Member</text>
        <text x="756" y="92" textAnchor="end" className="pc-t-s">draft · autosaved</text>

        {/* Step bodies (drawn under the headers that slide over them) */}
        <g style={animLinear("pc3-body1")}>
          <rect x="216" y="150" width="540" height="118" rx="5" fill="#1c1c1c" />
          <text x="232" y="170" className="pc-t-s">Application name</text>
          <rect x="232" y="176" width="320" height="24" rx="4" fill="#191919" stroke={C.line} />
          <text x="242" y="192" className="pc-t" fill="#fff">Fall 2026 General Member</text>
          <rect
            x="240"
            y="178"
            width="308"
            height="20"
            fill="#191919"
            style={{ ...anim("pc3-type", "steps(24,end)"), transformBox: "fill-box", transformOrigin: "right" }}
          />
          <text x="572" y="170" className="pc-t-s">Deadline</text>
          <rect x="572" y="176" width="168" height="24" rx="4" fill="#191919" stroke={C.line} />
          <text x="582" y="192" className="pc-t">Dec 1 · 11:59pm</text>
          <text x="232" y="222" className="pc-t-s">Committees</text>
          {["Events", "Finance", "Design"].map((t, i) => (
            <g key={t} style={anim(`pc3-chip${i}`)}>
              <rect x={232 + i * 82} y="230" width="74" height="22" rx="11" fill={C.accent} fillOpacity=".16" stroke={C.accent} />
              <text x={269 + i * 82} y="245" textAnchor="middle" className="pc-t" fill={C.accent}>{t}</text>
            </g>
          ))}
        </g>
        <g style={animLinear("pc3-body2")}>
          <rect x="216" y="192" width="540" height="118" rx="5" fill="#1c1c1c" />
          {[
            ["Why do you want to join?", "Long answer"],
            ["Juggling experience", "Multiple choice"],
            ["Upload your résumé", "File"],
          ].map(([q, kind], i) => (
            <g key={q} style={anim(`pc3-q${i}`)}>
              <rect x="232" y={202 + i * 34} width="508" height="28" rx="4" fill="#191919" stroke={C.line} />
              <text x="244" y={220 + i * 34} className="pc-t-s" fill="#666">⋮⋮</text>
              <text x="262" y={220 + i * 34} className="pc-t" fill="#fff">{q}</text>
              <text x="728" y={220 + i * 34} textAnchor="end" className="pc-t-s">{kind}</text>
            </g>
          ))}
        </g>
        <g style={animLinear("pc3-body3")}>
          <rect x="216" y="234" width="540" height="118" rx="5" fill="#1c1c1c" />
          {[["Acceptance email", C.good], ["Rejection email", C.bad]].map(([t, c], i) => (
            <g key={t} style={anim(`pc3-e${i}`)}>
              <rect x={232 + i * 262} y="246" width="246" height="94" rx="4" fill="#191919" stroke={C.line} />
              <rect x={232 + i * 262} y="246" width="3" height="94" rx="1" fill={c} />
              <text x={246 + i * 262} y="266" className="pc-t" fill="#fff">{t}</text>
              {[0, 1, 2].map((l) => (
                <rect key={l} x={246 + i * 262} y={278 + l * 11} width={200 - l * 40} height="5" rx="2" fill={C.ink} />
              ))}
              <text x={246 + i * 262} y="330" className="pc-t-s" fill={C.accent}>Preview ↗</text>
              <text x={466 + i * 262} y="330" textAnchor="end" className="pc-t-s">default ✓</text>
            </g>
          ))}
        </g>

        {header(110, 1, "Details", 0)}
        {header(276, 2, "Questions", 1, "pc3-h2")}
        {header(318, 3, "Emails", 2, "pc3-h3")}
        {header(360, 4, "Review & publish", null)}

        <g style={animLinear("pc3-pub")}>
          <rect x="644" y="402" width="112" height="26" rx="4" fill={C.accent} />
          <text x="700" y="419" textAnchor="middle" className="pc-t" fill="#fff">Publish</text>
        </g>
        <g style={animLinear("pc3-pubd")}>
          <rect x="644" y="402" width="112" height="26" rx="4" fill={C.good} />
          <text x="700" y="419" textAnchor="middle" className="pc-t" fill="#0e0e0e">Published ✓</text>
        </g>
      </g>
    </Frame>
  );
}

const FIGURES = {
  layout: LayoutFigure,
  messaging: MessagingFigure,
  applications: ApplicationsFigure,
};

export default function PennClubsFigure({ name, caption }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(true);

  // Pause off-screen loops so a long page doesn't keep animating hidden SVGs.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const io = new IntersectionObserver(([entry]) => setPlaying(entry.isIntersecting), {
      threshold: 0.1,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Figure = FIGURES[name];
  if (!Figure) return null;

  return (
    <figure ref={ref} className="detail-block detail-block--media pc-fig" data-playing={playing}>
      <Figure />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
