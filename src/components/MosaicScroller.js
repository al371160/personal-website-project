import { useCallback, useEffect, useRef, useState } from "react";
import PlaygroundCard from "./PlaygroundCard";
import { MOSAIC_PATTERN } from "../data/playground";

// The mosaic is an infinite 2D lattice. One "cycle" holds one full copy of the
// collection, laid out in a 12-column grid computed entirely in JS (no CSS
// grid), so the same documents repeat in every direction. Only cards
// overlapping the viewport (+ padding) are mounted, and pan is unbounded (no
// fold), so a card's cycle key never changes until it truly leaves the mounted
// range — WebGL cards are torn down only after they exit the view. Card width
// comes from the pattern span (c * colW); card height preserves each tile's own
// aspect ratio (natural image ratio, or the component ratio for the 3D VFX
// cards).
//
// The view is centered & zoomable: `view = { x, y, s }` is the world
// coordinate pinned to the viewport center plus a uniform scale. The world is
// rendered as `translate(C - s*view) scale(s)` (with `transform-origin: 0 0`),
// so zoom-in/out eases smoothly while the world point under the center stays
// put. Scroll / trackpad-pinch zooms about the viewport center; drag pans
// (outside of interactive elements).
const GRID_COLS = 12;
const PAD = 1400;
const DEFAULT_RATIO = 4 / 3;
const MIN_H = 80;
const MIN_S = 0.4;
const MAX_S = 4;
// Detail zoom keeps the top edge pinned ~TOP_PAD below the viewport top.
const DETAIL_HEIGHT_FRAC = 0.75;
const DETAIL_TOP_PAD = 30;

// Greedy 12-column pack of the collection (per-one-cycle layout). Row-blocks
// break when a tile would exceed 12 columns; within a block, cards accumulate
// with one uniform `gap` between them (and one `gap` between stacked blocks).
export function buildLayout(tiles, colW, gap, ratioOf, pattern = MOSAIC_PATTERN) {
  const positions = [];
  let unitCol = 0;
  let blockMaxH = 0;
  let x = 0;
  let y = 0;
  let maxX = 0;

  for (let i = 0; i < tiles.length; i++) {
    const s = pattern[i % pattern.length];
    if (unitCol + s.c > GRID_COLS) {
      unitCol = 0;
      y += blockMaxH + gap;
      blockMaxH = 0;
      x = 0;
    }
    const w = s.c * colW;
    const h = Math.max(MIN_H, w / Math.max(0.05, ratioOf(tiles[i])));
    positions.push({ idx: i, x, y, w, h });
    unitCol += s.c;
    x += w + gap;
    blockMaxH = Math.max(blockMaxH, h);
    maxX = Math.max(maxX, x - gap);
  }

  const cycleW = maxX + gap;
  const cycleH = y + blockMaxH + gap;
  return { positions, cycleW, cycleH };
}

export default function MosaicScroller({ tiles }) {
  const [view, setView] = useState({ x: 0, y: 0, s: 1 });
  const [metrics, setMetrics] = useState(null); // { colW, gap, center, w, h }
  const [ratios, setRatios] = useState({}); // `${tile.id}:${index}` -> w/h
  const [focused, setFocused] = useState(null); // { key, tile, x, y, w, h, index } detail view

  const viewportRef = useRef(null);
  const viewRef = useRef(view);
  const focusRef = useRef(null);
  const prevViewRef = useRef(null);
  const pointer = useRef(null); // { x, y, vx, vy, s, card } once a press starts
  const dragging = useRef(false);
  const gestureRef = useRef(false); // true when the current press has moved >5px
  const panRaf = useRef(0);
  const animRaf = useRef(0);
  const initRef = useRef(false);
  const hintTimer = useRef(0);
  const [hintFaded, setHintFaded] = useState(false);

  // The drag-to-explore hint fades out while the user is moving through the
  // mosaic and fades back in after a quiet stretch (10s).
  const pokeHint = useCallback(() => {
    setHintFaded(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintFaded(false), 10000);
  }, []);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  const L = tiles.length;

  // Derive sizes (colW / gap) from CSS variables, plus the viewport center.
  useEffect(() => {
    const measure = () => {
      const el = viewportRef.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const colW = parseFloat(cs.getPropertyValue("--mosaic-col")) || 120;
      const gRatio = parseFloat(cs.getPropertyValue("--mosaic-gap-ratio")) || 8;
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setMetrics({ colW, gap: colW * gRatio, center, w: rect.width, h: rect.height });
      if (!initRef.current) {
        // Pin the world origin to the viewport's top-left (like the old pan).
        initRef.current = true;
        const v = { x: center.x, y: center.y, s: 1 };
        viewRef.current = v;
        setView(v);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const ratioOf = useCallback(
    // Layout boxes follow each tile's first image; per-index ratios are used
    // to refit the focused box when navigating multi-image files.
    (tile) => tile.ratio ?? ratios[`${tile.id}:0`] ?? DEFAULT_RATIO,
    [ratios]
  );

  const layout =
    metrics && L > 0 ? buildLayout(tiles, metrics.colW, metrics.gap, ratioOf) : null;

  // Set the natural aspect ratio of one displayed media file. Idempotent:
  // repeated copies of the same tile report the same value, so no re-render.
  const onRatio = useCallback((id, idx, ratio) => {
    const key = `${id}:${idx}`;
    setRatios((prev) => (prev[key] === ratio ? prev : { ...prev, [key]: ratio }));
  }, []);

  // Eased zoom/pan: exponential-approach the target over rAF frames.
  const animateTo = useCallback((target) => {
    cancelAnimationFrame(animRaf.current);
    const step = () => {
      const cur = viewRef.current;
      const k = 0.13;
      const v = {
        x: cur.x + (target.x - cur.x) * k,
        y: cur.y + (target.y - cur.y) * k,
        s: cur.s + (target.s - cur.s) * k,
      };
      viewRef.current = v;
      setView(v);
      if (
        Math.abs(target.s - v.s) > 0.001 ||
        Math.hypot(target.x - v.x, target.y - v.y) > 0.5
      ) {
        animRaf.current = requestAnimationFrame(step);
      } else {
        animRaf.current = 0;
        viewRef.current = { ...target };
        setView({ ...target });
      }
    };
    animRaf.current = requestAnimationFrame(step);
  }, []);

  const stopAnim = useCallback(() => {
    cancelAnimationFrame(animRaf.current);
    animRaf.current = 0;
  }, []);

  // Flush the current viewRef to React state (drag/wheel), rAF-throttled so
  // panning stays in sync with the transform without choking on events.
  const flushView = useCallback(() => {
    panRaf.current = 0;
    setView({ ...viewRef.current });
  }, []);

  const queueView = useCallback(() => {
    if (panRaf.current) return;
    panRaf.current = requestAnimationFrame(flushView);
  }, [flushView]);

  const zoomOut = useCallback(() => {
    focusRef.current = null;
    setFocused(null);
    const prev = prevViewRef.current;
    const cur = viewRef.current;
    prevViewRef.current = null;
    pokeHint();
    animateTo(prev ? { ...prev } : { x: cur.x, y: cur.y, s: 1 });
  }, [animateTo, pokeHint]);

  // Fit a card box of size (w, h) into the detail view: zoom so its height
  // fills ~75% of the viewport, pinned top-aligned.
  const fitDetail = useCallback(
    (w, h, x, y) => {
      if (!metrics) return;
      const targetS = Math.min(MAX_S, Math.max(MIN_S, (metrics.h * DETAIL_HEIGHT_FRAC) / h));
      const topY = y + (metrics.h / 2 - DETAIL_TOP_PAD) / targetS;
      animateTo({ x: x + w / 2, y: topY, s: targetS });
    },
    [metrics, animateTo]
  );

  const handleDetail = useCallback(
    (card) => {
      if (focusRef.current === card.key) {
        zoomOut();
        return;
      }
      // Remember where we were so exiting a detail view returns to that zoom.
      prevViewRef.current = { ...viewRef.current };
      focusRef.current = card.key;
      pokeHint();
      setFocused({ key: card.key, tile: card.tile, x: card.x, y: card.y, w: card.w, h: card.h, index: 0 });
      fitDetail(card.w, card.h, card.x, card.y);
    },
    [fitDetail, zoomOut, pokeHint]
  );

  // Multi-image navigation inside the focused card's detail zoom. If the newly
  // shown file is taller (or wider) than the box the card was sized for, refit
  // the box to that file's ratio and zoom out / re-pin so it still fits.
  const moveDetail = useCallback(
    (dir) => {
      if (!focused || !metrics) return;
      const files = focused.tile.files ?? [];
      if (files.length < 2) return;
      const index = (focused.index + dir + files.length) % files.length;
      const ratio = ratios[`${focused.tile.id}:${index}`] ?? focused.w / focused.h;
      const h = Math.max(MIN_H, focused.w / Math.max(0.05, ratio));
      setFocused({ ...focused, index, h });
      pokeHint();
      fitDetail(focused.w, h, focused.x, focused.y);
    },
    [focused, metrics, ratios, fitDetail, pokeHint]
  );

  // Reframe once the newly shown file's natural ratio actually lands (the
  // index-0 ratio fallback above may have been a guess).
  useEffect(() => {
    if (!focused || !metrics || focused.index === 0) return;
    const ratio = ratios[`${focused.tile.id}:${focused.index}`];
    if (!ratio) return;
    const h = Math.max(MIN_H, focused.w / Math.max(0.05, ratio));
    if (h === focused.h) return;
    setFocused((prev) => (prev && prev.index === focused.index ? { ...prev, h } : prev));
    fitDetail(focused.w, h, focused.x, focused.y);
  }, [focused, metrics, ratios, fitDetail]);

  // --- Pointer (drag to pan; taps still pass through to cards) ---
  const onPointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest(".mosaic-detail-panel, .mosaic-arrow")) return;
      const card = e.target.closest(".mosaic-card");
      gestureRef.current = false;
      if (focusRef.current) {
        // Detail mode: no panning — just record the press so a click on empty
        // space still zooms back out.
        pointer.current = { x: e.clientX, y: e.clientY, card, locked: true };
        return;
      }
      if (e.target.closest(".mosaic-card--webgl")) {
        // WebGL cards own their drag (rotate / stir); track the gesture only
        // so a drag doesn't "click" the card into detail mode.
        pointer.current = { x: e.clientX, y: e.clientY, card, locked: true };
        return;
      }
      stopAnim();
      const cur = viewRef.current;
      pointer.current = {
        x: e.clientX,
        y: e.clientY,
        vx: cur.x,
        vy: cur.y,
        s: cur.s,
        card,
      };
    },
    [stopAnim]
  );

  // Move/up are tracked at the window level so a drag keeps working even after
  // the pointer leaves the viewport, and small moves stay a "click" for cards.
  useEffect(() => {
    const onMove = (e) => {
      const start = pointer.current;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const moveStarted = Math.hypot(dx, dy) >= 5;
      if (start.locked) {
        // WebGL / detail presses never pan; movement just suppresses the click.
        if (moveStarted) gestureRef.current = true;
        return;
      }
      if (!dragging.current && !moveStarted) return;
      if (!dragging.current) {
        dragging.current = true;
        start.vx = viewRef.current.x;
        start.vy = viewRef.current.y;
        start.s = viewRef.current.s;
        pokeHint();
      }
      gestureRef.current = true;
      viewRef.current = {
        x: start.vx - dx / start.s,
        y: start.vy - dy / start.s,
        s: start.s,
      };
      queueView();
    };
    const onUp = () => {
      const start = pointer.current;
      if (start && !dragging.current && !start.card && focusRef.current) zoomOut();
      if (dragging.current) queueView();
      pointer.current = null;
      dragging.current = false;
      // Don't reset gestureRef here: the browser fires `click` after
      // `pointerup`, so it must stay set through the click's activate().
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [queueView, zoomOut, pokeHint]);

  // --- Wheel: scroll/pinch zooms about the viewport center (no pan) ---
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (focusRef.current) {
        // Detail mode: zoom is locked (exit via ×, Escape, or empty click).
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const cur = viewRef.current;
      stopAnim();
      pokeHint();
      const ns = Math.min(MAX_S, Math.max(MIN_S, cur.s * Math.exp(-e.deltaY * 0.0016)));
      animateTo({ x: cur.x, y: cur.y, s: ns });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [animateTo, stopAnim, pokeHint]);

  // Escape exits the focused zoom.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && focusRef.current) zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomOut]);

  // Compute visible cards in world space (scale-aware so culling stays tight
  // when zoomed in).
  const cards = [];
  if (layout && metrics) {
    const s = view.s;
    const hw = (metrics.w / 2 + PAD) / s;
    const hh = (metrics.h / 2 + PAD) / s;
    const minX = view.x - hw;
    const maxX = view.x + hw;
    const minY = view.y - hh;
    const maxY = view.y + hh;

    const startCx = Math.floor(minX / layout.cycleW);
    const endCx = Math.ceil(maxX / layout.cycleW);
    const startCy = Math.floor(minY / layout.cycleH);
    const endCy = Math.ceil(maxY / layout.cycleH);

    for (let cy = startCy; cy <= endCy; cy++) {
      for (let cx = startCx; cx <= endCx; cx++) {
        for (const p of layout.positions) {
          const x = cx * layout.cycleW + p.x;
          const y = cy * layout.cycleH + p.y;
          const w = p.w;
          const h = p.h;
          if (x + w < minX || x > maxX || y + h < minY || y > maxY) continue;
          const key = `${cx}-${cy}-${p.idx}`;
          cards.push({ key, tile: tiles[p.idx], x, y, w, h });
        }
      }
    }
  }

  const C = metrics?.center ?? { x: 0, y: 0 };
  const s = view.s;
  const transform = C
    ? `translate(${C.x - s * view.x}px, ${C.y - s * view.y}px) scale(${s})`
    : "translate(0px, 0px) scale(1)";

  // Anchor the detail panel to the focused card's top-right corner (screen
  // space), sitting to the right of the image rather than the site's corner,
  // dropped ~80px so it reads below the card's top edge.
  let panelStyle = null;
  if (focused && metrics) {
    panelStyle = {
      left: metrics.w / 2 + s * (focused.x + focused.w - view.x) + 14,
      top: metrics.h / 2 + s * (focused.y - view.y) + 80,
    };
  }

  return (
    <div
      ref={viewportRef}
      className="mosaic-viewport"
      onPointerDown={onPointerDown}
    >
      <div className="mosaic-world" style={{ transform }}>
        {cards.map((card) => (
          <PlaygroundCard
            key={card.key}
            tile={card.tile}
            x={card.x}
            y={card.y}
            w={card.w}
            h={focused && focusRef.current === card.key ? focused.h : card.h}
            focused={focusRef.current === card.key}
            detailIndex={focused && focusRef.current === card.key ? focused.index : 0}
            gestureRef={gestureRef}
            onRatio={onRatio}
            onDetail={() => handleDetail(card)}
            onNav={moveDetail}
          />
        ))}
      </div>

      {focused && (
        <aside className="mosaic-detail-panel" style={panelStyle} onPointerDown={(e) => e.stopPropagation()}>
          <button
            className="mosaic-detail-close"
            aria-label="Close detail"
            title="Close detail"
            onClick={zoomOut}
          >
            ×
          </button>
          <span className="mosaic-detail-title">{focused.tile.title}</span>
          {focused.tile.date && (
            <span className="mosaic-detail-date">{focused.tile.date}</span>
          )}
          <p className="mosaic-detail-desc">
            {focused.tile.description || focused.tile.title}
          </p>
        </aside>
      )}

      <span
        className={`mosaic-hint${hintFaded ? " mosaic-hint--faded" : ""}`}
        aria-hidden="true"
      >
        drag around and click on works to move and expand. Scroll to zoom.
      </span>
    </div>
  );
}