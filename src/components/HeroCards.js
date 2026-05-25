import { useState, useEffect, useRef, useCallback } from "react";

// ─── constants ────────────────────────────────────────────────────────────────

const TILE   = 56;
const P_SZ   = 12;
const CAR_H  = 24;
const LOG_H  = 16;
const PAD_H  = 18;

// Virtual window: only render this many rows ahead/behind the player
const WIN_AHEAD  = 16;
const WIN_BEHIND = 5;

// ─── content ──────────────────────────────────────────────────────────────────

const TEAMS_LINKS = [
  { label: "Penn Electric Racing", href: "https://www.pennelectricracing.com/" },
  { label: "Orble Tea",            href: "https://orble-tea.com/" },
  { label: "Penn UPGRADE",         href: "https://pennupgrade.com/" },
  { label: "PawFond",              href: "https://mypawfond.com/" },
];
const LINKS_LINKS = [
  { label: "Resume",    href: "https://docs.google.com/document/d/18WZA6hMhOfB1pk9hstjRHbtK2qQ2C14g/edit?usp=sharing&ouid=101671651649642190253&rtpof=true&sd=true" },
  { label: "Instagram", href: "https://instagram.com/al371160" },
  { label: "GitHub",    href: "https://github.com/al371160" },
  { label: "Itch",      href: "https://al371160.itch.io" },
];

// ─── map definition ───────────────────────────────────────────────────────────

const BASE_MAP = [
  { type: "bio-name" },
  { type: "bio-desc" },
  { type: "grass" },
  { type: "road",  speed: 52, dir:  1 },
  { type: "road",  speed: 40, dir: -1 },
  { type: "road",  speed: 70, dir:  1 },
  { type: "grass" },
  { type: "water", speed: 34, dir:  1 },
  { type: "water", speed: 26, dir: -1 },
  { type: "water", speed: 44, dir:  1 },
  { type: "grass" },
  { type: "info",  title: "TEAMS", links: TEAMS_LINKS },
  { type: "grass" },
  { type: "road",  speed: 60, dir: -1 },
  { type: "road",  speed: 82, dir:  1 },
  { type: "road",  speed: 44, dir: -1 },
  { type: "grass" },
  { type: "water", speed: 38, dir: -1 },
  { type: "water", speed: 29, dir:  1 },
  { type: "grass" },
  { type: "info",  title: "LINKS", links: LINKS_LINKS },
  { type: "grass" },
];

// Procedural biome generator — mimics Crossy Road's chunk system:
// groups of same-type lanes separated by safe grass rows
function genProceduralSection(startRow) {
  // Seeded pseudo-random (deterministic per startRow)
  let s = (Math.imul(startRow + 1, 2654435761) >>> 0);
  const rng = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s >>> 0) / 0xFFFFFFFF; };

  const result = [];
  const biomeRoll = rng();
  // 55% road section (2–4 lanes), 35% water (2–3 lanes), 10% extra grass
  if (biomeRoll < 0.55) {
    const count = 2 + (rng() * 3 | 0);
    for (let i = 0; i < count; i++)
      result.push({ type: "road", speed: 30 + (rng() * 65) | 0, dir: rng() < 0.5 ? 1 : -1 });
  } else if (biomeRoll < 0.90) {
    const count = 2 + (rng() * 2 | 0);
    for (let i = 0; i < count; i++)
      result.push({ type: "water", speed: 20 + (rng() * 35) | 0, dir: rng() < 0.5 ? 1 : -1 });
  } else {
    result.push({ type: "grass" });
  }
  result.push({ type: "grass" }); // buffer after every section
  return result;
}

// Cache procedural sections so the map stays deterministic across re-renders
const PROC_CACHE = new Map();

function getLane(row) {
  if (row < BASE_MAP.length) return BASE_MAP[row];

  // Walk through cached sections to find which section owns this row
  let cur = BASE_MAP.length;
  let sectionStart = BASE_MAP.length;

  while (true) {
    if (!PROC_CACHE.has(sectionStart)) {
      PROC_CACHE.set(sectionStart, genProceduralSection(sectionStart));
    }
    const section = PROC_CACHE.get(sectionStart);
    if (row < cur + section.length) return section[row - cur];
    cur += section.length;
    sectionStart = cur;
  }
}

// ─── vehicle types ────────────────────────────────────────────────────────────

const VEHICLES = [
  { vt: "car",   w: 44 }, { vt: "car",   w: 44 },
  { vt: "sedan", w: 64 }, { vt: "sedan", w: 64 },
  { vt: "truck", w: 92 }, { vt: "truck", w: 92 },
  { vt: "bus",   w: 124 },
];

function asciiLabel(carType, dir) {
  const r = dir > 0;
  switch (carType) {
    case "car":   return r ? "[»]"       : "[«]";
    case "sedan": return r ? "[──»]"     : "[«──]";
    case "truck": return r ? "[════»]"   : "[«════]";
    case "bus":   return r ? "[══════»]" : "[«══════]";
    case "log":   return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
    case "pad":   return "¤";
    default:      return r ? "[»]" : "[«]";
  }
}

// ─── lane builder ─────────────────────────────────────────────────────────────
// Uses Crossy Road–style grouped traffic: vehicles come in bunches with
// large gaps between groups, making safe windows predictable to learn.

function buildLane(row, worldW) {
  const lane = getLane(row);
  if (lane.type !== "road" && lane.type !== "water") return null;

  // Deterministic RNG per lane
  let s = (Math.imul(row, 1234567) + 987654321) >>> 0;
  const rng = () => { s = (Math.imul(s, 69621) + 1234567891) >>> 0; return (s >>> 0) / 0xFFFFFFFF; };

  const cars     = [];
  const maxCarW  = lane.type === "water" ? 140 : 124;
  let x          = -(worldW * 0.35);
  let id         = 0;

  while (x < worldW * 2.8) {
    if (lane.type === "water") {
      // Water: alternating log clusters and pads
      const isLog = rng() > 0.2;
      const w     = isLog ? 60 + (rng() * 78 | 0) : 26;
      cars.push({ id: id++, x, w, carType: isLog ? "log" : "pad" });
      // Logs cluster together; pads have bigger gaps before next object
      x += w + (isLog ? 35 + (rng() * 55 | 0) : 90 + (rng() * 70 | 0));

    } else {
      // Road: Crossy Road grouped traffic
      const groupSize = 1 + (rng() * 3 | 0);     // 1–3 vehicles per bunch
      for (let g = 0; g < groupSize; g++) {
        const vi = rng() * VEHICLES.length | 0;
        const v  = VEHICLES[vi];
        cars.push({ id: id++, x, w: v.w, carType: v.vt });
        x += v.w + 48 + (rng() * 36 | 0);         // tight intra-group gap
      }
      x += 195 + (rng() * 230 | 0);               // large inter-group safe window
    }
  }

  // Compute total cycle span for seamless wrapping
  const totalSpan = x - -(worldW * 0.35);
  return { cars, totalSpan, maxCarW };
}

// ─── component ────────────────────────────────────────────────────────────────

export default function HeroCards() {
  const containerRef  = useRef(null);
  const worldRef      = useRef(null);
  const playerRef     = useRef(null);
  const rafRef        = useRef(null);
  const deathTimerRef = useRef(null);

  const gRef = useRef({
    row: 0, px: 0,
    worldW: 0, viewH: 0,
    dead: false, hopping: false,
    cameraY: 0,
    lanes: {},     // { [row]: { cars, totalSpan, maxCarW } }
    carEls: {},    // { [row]: { [id]: HTMLElement } }
    waveEls: {},   // { [row]: HTMLElement }
    waveX: {},     // { [row]: number }
    maxRow: 0,
    lastTs: null,
  });

  const [worldW,        setWorldW]        = useState(0);
  const [score,         setScore]         = useState(0);
  const [dead,          setDead]          = useState(false);
  // Incremented on every hop → triggers re-render to update virtual window
  const [renderVersion, setRenderVersion] = useState(0);

  const camTarget = useCallback((row, vh) => vh * 0.42 - row * TILE, []);

  // ── respawn ──────────────────────────────────────────────────────────────────
  const respawn = useCallback(() => {
    const g = gRef.current;
    g.dead = false; g.row = 0; g.px = g.worldW / 2; g.maxRow = 0;
    g.cameraY = camTarget(0, g.viewH);
    if (worldRef.current)
      worldRef.current.style.transform = `translateY(${g.cameraY}px)`;
    setDead(false); setScore(0); setRenderVersion(v => v + 1);
  }, [camTarget]);

  const kill = useCallback(() => {
    const g = gRef.current;
    if (g.dead) return;
    g.dead = true;
    setDead(true);
    clearTimeout(deathTimerRef.current);
    deathTimerRef.current = setTimeout(respawn, 750);
  }, [respawn]);

  // ── ensure lane data exists for rows in view ──────────────────────────────
  const ensureLanes = useCallback((aroundRow) => {
    const g = gRef.current;
    if (!g.worldW) return;
    for (let r = Math.max(0, aroundRow - WIN_BEHIND); r < aroundRow + WIN_AHEAD + 5; r++) {
      if (!g.lanes[r]) {
        g.lanes[r] = buildLane(r, g.worldW);
      }
    }
  }, []);

  // ── RAF loop ──────────────────────────────────────────────────────────────────
  const tick = useCallback((ts) => {
    const g = gRef.current;
    if (!g.lastTs) g.lastTs = ts;
    const dt = Math.min(ts - g.lastTs, 50);
    g.lastTs = ts;

    const viewStart = g.row - WIN_BEHIND - 2;
    const viewEnd   = g.row + WIN_AHEAD + 2;

    // ── Move obstacles ────────────────────────────────────────────────────────
    for (let r = viewStart; r <= viewEnd; r++) {
      if (r < 0) continue;
      const lane = getLane(r);
      if (lane.type !== "road" && lane.type !== "water") continue;
      const ldata = g.lanes[r];
      if (!ldata) continue;

      const { cars, totalSpan, maxCarW } = ldata;
      const dx = (lane.speed * lane.dir * dt) / 1000;

      for (const car of cars) {
        car.x += dx;
        if (lane.dir > 0 && car.x > g.worldW + maxCarW)   car.x -= totalSpan;
        if (lane.dir < 0 && car.x + car.w < -maxCarW - 60) car.x += totalSpan;
        const el = g.carEls[r]?.[car.id];
        if (el) el.style.transform = `translateX(${car.x}px)`;
      }

      // Wave scroll
      if (lane.type === "water") {
        g.waveX[r] = (g.waveX[r] || 0) + dx;
        const wEl = g.waveEls[r];
        if (wEl) wEl.style.transform = `translateX(${g.waveX[r] % 100}px)`;
      }
    }

    if (!g.dead) {
      const lane = getLane(g.row);

      // ── Log / lily pad riding ─────────────────────────────────────────────
      if (lane.type === "water") {
        const dx    = (lane.speed * lane.dir * dt) / 1000;
        const ldata = g.lanes[g.row];
        let riding  = false;

        if (ldata) {
          for (const obj of ldata.cars) {
            const m = 4;
            if (g.px + P_SZ / 2 - m > obj.x && g.px - P_SZ / 2 + m < obj.x + obj.w) {
              riding = true;
              g.px  += dx * (obj.carType === "pad" ? 0.08 : 1);
              break;
            }
          }
        }
        if (!riding && !g.hopping) kill();
        if (g.px < 2 || g.px > g.worldW - 2) kill();
      }

      // ── Road collision ────────────────────────────────────────────────────
      if (lane.type === "road" && !g.hopping) {
        const ldata = g.lanes[g.row];
        if (ldata) {
          const m  = 3;
          const pL = g.px - P_SZ / 2 + m, pR = g.px + P_SZ / 2 - m;
          const pT = g.row * TILE + (TILE - P_SZ) / 2 + m;
          const pB = pT + P_SZ - m * 2;
          for (const car of ldata.cars) {
            const cT = g.row * TILE + (TILE - CAR_H) / 2;
            if (pL < car.x + car.w && pR > car.x && pT < cT + CAR_H && pB > cT) {
              kill(); break;
            }
          }
        }
      }
    }

    // ── Camera ────────────────────────────────────────────────────────────────
    const ty = camTarget(g.row, g.viewH);
    g.cameraY += (ty - g.cameraY) * 0.10;
    if (worldRef.current)
      worldRef.current.style.transform = `translateY(${g.cameraY}px)`;

    // ── Player DOM ────────────────────────────────────────────────────────────
    if (playerRef.current) {
      playerRef.current.style.left = `${g.px - P_SZ / 2}px`;
      playerRef.current.style.top  = `${g.row * TILE + (TILE - P_SZ) / 2}px`;
      playerRef.current.style.backgroundColor = g.dead ? "#ff5050" : "#ffffff";
      playerRef.current.style.boxShadow       = g.dead
        ? "0 0 12px rgba(255,80,80,0.6)"
        : "0 0 8px rgba(255,255,255,0.36)";
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [camTarget, kill]);

  // ── Keyboard ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const g = gRef.current;
      if (g.dead || g.hopping) return;
      let dr = 0, dc = 0;
      if      (e.key === "ArrowUp"    || e.key === "w" || e.key === "W") dr = -1;
      else if (e.key === "ArrowDown"  || e.key === "s" || e.key === "S") dr =  1;
      else if (e.key === "ArrowLeft"  || e.key === "a" || e.key === "A") dc = -1;
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dc =  1;
      else return;
      e.preventDefault();

      const newRow = Math.max(0, g.row + dr);
      g.px  = Math.max(P_SZ, Math.min(g.worldW - P_SZ, g.px + dc * TILE));
      g.row = newRow;

      if (newRow > g.maxRow) { g.maxRow = newRow; setScore(newRow * 10); }

      g.hopping = true;
      if (playerRef.current) {
        playerRef.current.style.transform = "scale(1.35) translateY(-3px)";
        setTimeout(() => { if (playerRef.current) playerRef.current.style.transform = ""; }, 110);
      }
      setTimeout(() => { g.hopping = false; }, 108);

      // Ensure lanes are built ahead, then re-render the virtual window
      ensureLanes(newRow);
      setRenderVersion(v => v + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ensureLanes]);

  // ── ResizeObserver ────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = e.contentRect.width;
      const h = e.contentRect.height;
      const g = gRef.current;
      g.worldW = w; g.viewH = h;
      if (g.px === 0) g.px = w / 2;
      // Build lanes for initial visible window
      for (let r = 0; r < WIN_AHEAD + 5; r++) {
        if (!g.lanes[r]) g.lanes[r] = buildLane(r, w);
      }
      g.cameraY = camTarget(g.row, h);
      if (worldRef.current)
        worldRef.current.style.transform = `translateY(${g.cameraY}px)`;
      setWorldW(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [camTarget]);

  // ── RAF lifecycle ─────────────────────────────────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafRef.current); clearTimeout(deathTimerRef.current); };
  }, [tick]);

  // ── render ────────────────────────────────────────────────────────────────────

  const g = gRef.current;
  // Virtual window: only render rows near the player
  const curRow     = g.row;
  const rowStart   = Math.max(0, curRow - WIN_BEHIND);
  const rowEnd     = curRow + WIN_AHEAD;

  return (
    <div ref={containerRef} style={S.root}>

      {score > 0 && <div style={S.score}>score: {score}</div>}
      {dead && <div style={S.deathBanner}>✕</div>}
      <div style={S.hint}>WASD / ↑↓←→</div>

      <div ref={worldRef} style={S.world}>
        {worldW > 0 && Array.from({ length: rowEnd - rowStart + 1 }, (_, i) => {
          const r    = rowStart + i;
          const lane = getLane(r);
          const isRoad  = lane.type === "road";
          const isWater = lane.type === "water";
          const ldata   = g.lanes[r];
          const cars    = ldata?.cars || [];

          return (
            <div
              key={r}
              style={{
                ...S.row, top: r * TILE,
                ...(isRoad  ? S.roadRow  : {}),
                ...(isWater ? S.waterRow : {}),
              }}
            >
              {/* ASCII water wave strip */}
              {isWater && (
                <div style={S.waveBg}>
                  <span ref={el => { if (el) g.waveEls[r] = el; }} style={S.waveStr}>
                    {WAVE_TEXT}
                  </span>
                </div>
              )}

              {/* Bio rows */}
              {lane.type === "bio-name" && (
                <div style={S.bioNameRow}>
                  <span style={S.bigName}>Alexander Liu</span>
                  <span style={S.subName}>DMD · Penn Engineering</span>
                </div>
              )}
              {lane.type === "bio-desc" && (
                <div style={S.bioDescRow}>
                  Student at Penn studying Digital Media Design. Exploring visual design, interactive web, and experimental galleries.
                </div>
              )}

              {/* Info rows */}
              {lane.type === "info" && (
                <div style={S.infoRow}>
                  <span style={S.infoTag}>{lane.title}</span>
                  {lane.links?.map(l => (
                    <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                      style={S.infoLink}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0.58")}
                    >{l.label}</a>
                  ))}
                </div>
              )}

              {/* Road center dashes */}
              {isRoad && <div style={S.roadMid} />}

              {/* Obstacles: vehicles, logs, lily pads */}
              {(isRoad || isWater) && cars.map(car => {
                const isLog = car.carType === "log";
                const isPad = car.carType === "pad";
                const h   = isLog ? LOG_H : isPad ? PAD_H : CAR_H;
                const top = TILE / 2 - h / 2;

                return (
                  <div
                    key={car.id}
                    ref={el => {
                      if (el) {
                        if (!g.carEls[r]) g.carEls[r] = {};
                        g.carEls[r][car.id] = el;
                      }
                    }}
                    style={{
                      ...S.obstacle,
                      width: car.w, height: h, top,
                      transform: `translateX(${car.x}px)`,
                      background: isLog
                        ? "rgba(148, 98, 28, 0.72)"
                        : isPad
                        ? "rgba(35, 118, 60, 0.74)"
                        : lane.dir > 0
                        ? "rgba(165, 48, 48, 0.64)"
                        : "rgba(44,  82, 170, 0.64)",
                      border: `1px solid ${isLog
                        ? "rgba(195, 140, 60, 0.28)"
                        : isPad
                        ? "rgba(65, 165, 90, 0.28)"
                        : lane.dir > 0
                        ? "rgba(210, 70, 70, 0.22)"
                        : "rgba(70, 116, 215, 0.22)"}`,
                      color: isLog
                        ? "rgba(215, 168, 88, 0.88)"
                        : isPad
                        ? "rgba(95, 215, 128, 0.90)"
                        : lane.dir > 0
                        ? "rgba(255, 155, 155, 0.88)"
                        : "rgba(135, 178, 255, 0.88)",
                      borderRadius: isPad ? "50%" : 3,
                    }}
                  >
                    <span style={S.asciiLabel}>{asciiLabel(car.carType, lane.dir)}</span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Player */}
        <div ref={playerRef} style={S.player} />
      </div>
    </div>
  );
}

// ─── wave text ────────────────────────────────────────────────────────────────

const WAVE_TEXT = "~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·~·";

// ─── styles ───────────────────────────────────────────────────────────────────

const S = {
  root:  { position: "absolute", inset: 0, overflow: "hidden" },
  world: { position: "absolute", top: 0, left: 0, width: "100%", willChange: "transform" },
  row: {
    position: "absolute", left: 0, width: "100%", height: TILE, boxSizing: "border-box",
  },
  roadRow: {
    borderTop:    "1px solid rgba(255,255,255,0.04)",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  waterRow: {
    background:   "rgba(6, 28, 58, 0.62)",
    borderTop:    "1px solid rgba(70, 140, 220, 0.14)",
    borderBottom: "1px solid rgba(70, 140, 220, 0.14)",
  },
  waveBg: {
    position: "absolute", inset: 0, overflow: "hidden",
    display: "flex", alignItems: "center",
    pointerEvents: "none", userSelect: "none",
  },
  waveStr: {
    fontFamily: "monospace", fontSize: 11, letterSpacing: "0.04em",
    color: "rgba(88, 170, 230, 0.22)", whiteSpace: "nowrap", display: "inline-block",
  },
  roadMid: {
    position: "absolute", top: "50%", left: 0, right: 0, height: 0,
    borderTop: "1px dashed rgba(255,255,255,0.05)",
    transform: "translateY(-50%)", pointerEvents: "none",
  },
  obstacle: {
    position: "absolute", left: 0, willChange: "transform",
    boxSizing: "border-box", overflow: "hidden",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  asciiLabel: {
    fontFamily: "monospace", fontSize: 9, letterSpacing: "0.03em",
    userSelect: "none", pointerEvents: "none", whiteSpace: "nowrap",
  },
  bioNameRow: {
    position: "absolute", inset: 0, display: "flex", alignItems: "center",
    gap: 14, paddingLeft: 18,
  },
  bigName: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 26, fontWeight: 300, lineHeight: 1, color: "#ffffff",
  },
  subName: {
    fontFamily: "monospace", fontSize: 9, opacity: 0.38,
    textTransform: "uppercase", letterSpacing: "0.10em",
  },
  bioDescRow: {
    position: "absolute", inset: 0, display: "flex", alignItems: "center",
    paddingLeft: 18, paddingRight: 18,
    fontFamily: "monospace", fontSize: 10, opacity: 0.40, lineHeight: 1.5,
  },
  infoRow: {
    position: "absolute", inset: 0, display: "flex", alignItems: "center",
    gap: 22, paddingLeft: 18,
  },
  infoTag: {
    fontFamily: "monospace", fontSize: 9, opacity: 0.28,
    letterSpacing: "0.13em", textTransform: "uppercase", flexShrink: 0,
  },
  infoLink: {
    fontFamily: "monospace", fontSize: 11, color: "#ffffff", opacity: 0.58,
    textDecoration: "none", transition: "opacity 0.15s ease",
  },
  player: {
    position: "absolute", left: 0, top: 0,
    width: P_SZ, height: P_SZ, borderRadius: 2, zIndex: 5,
    backgroundColor: "#ffffff", boxShadow: "0 0 8px rgba(255,255,255,0.36)",
  },
  score: {
    position: "absolute", top: 16, right: 20, zIndex: 10,
    fontFamily: "monospace", fontSize: 11, opacity: 0.35, letterSpacing: "0.08em",
    pointerEvents: "none", color: "#ffffff",
  },
  deathBanner: {
    position: "absolute", inset: 0, zIndex: 9, pointerEvents: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "monospace", fontSize: 18, color: "#ff5050", opacity: 0.65,
  },
  hint: {
    position: "absolute", bottom: 14, left: 16, zIndex: 10,
    fontFamily: "monospace", fontSize: 10, opacity: 0.22,
    letterSpacing: "0.05em", pointerEvents: "none",
  },
};
