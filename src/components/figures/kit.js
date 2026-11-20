// Shared helpers for the animated SVG figures on project pages.
// Every figure runs on one shared 10s loop; timings below are percentages of it.
// Keyframes are generated per figure so each element's timeline lives next to
// the element it moves.

export const DUR = 10;
export const EASE = "cubic-bezier(.65,0,.35,1)";
export const C = {
  win: "#1a1a1a",
  panel: "#1f1f1f",
  line: "#2c2c2c",
  ink: "#3a3a3a",
  muted: "#7a7a7a",
  accent: "#5b8cff",
  bad: "#ef6a57",
  good: "#4fbf7f",
};

export const anim = (name, timing = EASE) => ({ animation: `${name} ${DUR}s ${timing} infinite` });
export const animLinear = (name) => anim(name, "linear");

export function kf(name, stops) {
  const sorted = stops
    .map(([p, css]) => [Math.max(0, Math.min(100, p)), css])
    .sort((x, y) => x[0] - y[0]);
  return `@keyframes ${name}{${sorted.map(([p, css]) => `${+p.toFixed(2)}%{${css}}`).join("")}}`;
}

// Opacity on during each [start, end] interval.
export function show(name, intervals, { ramp = 0.8, lo = 0, hi = 1 } = {}) {
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
export function rise(name, start, end = 96) {
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
export function cursorPath(name, points, clicks = []) {
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

export const CYCLE = kf("fig-cycle", [
  [0, "opacity:0"],
  [2, "opacity:1"],
  [95.5, "opacity:1"],
  [98, "opacity:0"],
  [100, "opacity:0"],
]);


// Chrome-less canvas for situation/process figures. `captions` crossfade along
// the bottom edge: [{ text, from, to }] in loop percentages.
export function Stage({ id, label, css, captions = [], height = 400, children }) {
  const captionCss = captions.map((c, i) => show(`${id}-cap${i}`, [[c.from, c.to]]));
  return (
    <svg className="anim-fig-svg" viewBox={`0 0 800 ${height}`} role="img" aria-label={label}>
      <style>{CYCLE + captionCss.join("") + css.join("")}</style>
      <rect width="800" height={height} fill="#121212" />
      <g style={animLinear("fig-cycle")}>
        {children}
        {captions.map((c, i) => (
          <text
            key={i}
            x="400"
            y={height - 24}
            textAnchor="middle"
            className="fig-t-cap"
            style={animLinear(`${id}-cap${i}`)}
          >
            {c.text}
          </text>
        ))}
      </g>
    </svg>
  );
}
