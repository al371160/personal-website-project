import { useCallback, useEffect, useRef, useState } from "react";
import PlaygroundCard from "./PlaygroundCard";

// One finite cluster. Photos keep their real pixel size relative to each
// other; WebGL cards take a long edge equal to the median photo. `buildLayout`
// shelf-packs that set once (left to right, wrapping so the cluster is about
// the shape of the viewport) with a thin gutter, then scales the whole cluster
// so it fits the viewport at zoom 1. Only cards overlapping the viewport
// (+ padding) are mounted, so offscreen WebGL contexts stay unloaded.
//
// The view is centered & zoomable: `view = { x, y, s }` is the world
// coordinate pinned to the viewport center plus a uniform scale. The world is
// rendered as `translate(C - s*view) scale(s)` (with `transform-origin: 0 0`),
// so zoom-in/out eases smoothly while the world point under the center stays
// put. Scroll / trackpad-pinch zooms about the viewport center; drag pans
// (outside of interactive elements).
const PAD = 1400;
const DEFAULT_RATIO = 4 / 3;
const DEFAULT_LONG = 1600;
const MIN_S = 0.4;
const MAX_S_FLOOR = 4;
const MAX_S_CAP = 64;
// Detail zoom keeps the top edge pinned ~TOP_PAD below the viewport top.
const DETAIL_HEIGHT_FRAC = 0.75;
const DETAIL_TOP_PAD = 30;
// Gutter as a fraction of the median long edge — tight, not a tiled gap.
const GAP_FRAC = 0.015;
// Fit the cluster inside the viewport with a little padding at s = 1.
const FIT_PAD = 0.92;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function tileSize(tile, medianLong) {
  if (tile.pixelW > 0 && tile.pixelH > 0) {
    return { w: tile.pixelW, h: tile.pixelH };
  }
  const ratio = tile.ratio > 0 ? tile.ratio : DEFAULT_RATIO;
  if (ratio >= 1) return { w: medianLong, h: medianLong / ratio };
  return { w: medianLong * ratio, h: medianLong };
}

// Shelf-pack `tiles` in collection order. Sizes are proportional to pixel
// dimensions (one shared scale). The result is in viewport units: the cluster
// fits inside the viewport at zoom 1, and `maxS` is high enough that the
// shortest card can still fill the detail view.
export function buildLayout(tiles, viewportW, viewportH) {
  if (!viewportW || !viewportH || tiles.length === 0) return null;

  const photoEdges = [];
  for (const tile of tiles) {
    if (tile.pixelW > 0 && tile.pixelH > 0) {
      photoEdges.push(Math.max(tile.pixelW, tile.pixelH));
    }
  }
  const medianLong = photoEdges.length ? median(photoEdges) : DEFAULT_LONG;
  const sizes = tiles.map((tile) => tileSize(tile, medianLong));
  const gap = median(sizes.map((s) => Math.max(s.w, s.h))) * GAP_FRAC;

  let widest = 0;
  let totalArea = 0;
  for (const s of sizes) {
    widest = Math.max(widest, s.w);
    totalArea += s.w * s.h;
  }
  const aspect = viewportW / viewportH;
  const rowWidth = Math.max(widest, Math.sqrt(totalArea * aspect));

  const positions = [];
  let x = 0;
  let y = 0;
  let rowH = 0;
  let maxX = 0;
  for (let i = 0; i < tiles.length; i++) {
    const { w, h } = sizes[i];
    if (x > 0 && x + w > rowWidth) {
      y += rowH + gap;
      x = 0;
      rowH = 0;
    }
    positions.push({ idx: i, x, y, w, h });
    x += w + gap;
    rowH = Math.max(rowH, h);
    maxX = Math.max(maxX, x - gap);
  }

  const clusterW = Math.max(maxX, 1);
  const clusterH = Math.max(y + rowH, 1);
  const fit = Math.min((viewportW * FIT_PAD) / clusterW, (viewportH * FIT_PAD) / clusterH);

  let maxS = MAX_S_FLOOR;
  const scaled = positions.map((p) => {
    const h = p.h * fit;
    if (h > 0) maxS = Math.max(maxS, (viewportH * DETAIL_HEIGHT_FRAC) / h);
    return { idx: p.idx, x: p.x * fit, y: p.y * fit, w: p.w * fit, h };
  });

  return {
    positions: scaled,
    width: clusterW * fit,
    height: clusterH * fit,
    maxS: Math.min(maxS, MAX_S_CAP),
  };
}

export default function MosaicScroller({ tiles, onReady }) {
  const [view, setView] = useState({ x: 0, y: 0, s: 1 });
  const [metrics, setMetrics] = useState(null); // { center, w, h }
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
  const layoutSigRef = useRef("");
  const layoutHold = useRef(null);
  const maxSRef = useRef(MAX_S_FLOOR);
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

  // Viewport size. The center is local to the canvas so the cluster sits in
  // the middle of the playground, not offset by the top bar.
  useEffect(() => {
    const measure = () => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setMetrics({
        center: { x: rect.width / 2, y: rect.height / 2 },
        w: rect.width,
        h: rect.height,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Pack once per collection. Rebuilding on resize would move every card under
  // a camera the user may already have panned. A new collection (retry) recenters.
  const layoutSig = tiles.map((t) => `${t.id}:${t.pixelW || 0}x${t.pixelH || 0}`).join("|");
  if (layoutSigRef.current !== layoutSig) {
    layoutSigRef.current = layoutSig;
    initRef.current = false;
  }
  if (metrics && L > 0 && layoutHold.current?.sig !== layoutSig) {
    const next = buildLayout(tiles, metrics.w, metrics.h);
    if (next) layoutHold.current = { sig: layoutSig, layout: next };
  }
  const layout = layoutHold.current?.sig === layoutSig ? layoutHold.current.layout : null;
  maxSRef.current = layout?.maxS ?? MAX_S_FLOOR;

  // First frame pins the cluster center to the viewport at zoom 1. Later pans
  // and zooms are left alone. The page stays behind the loader until this fit
  // exists, so the cluster doesn't appear in the corner and then jump.
  const fitted = layout && !initRef.current
    ? { x: layout.width / 2, y: layout.height / 2, s: 1 }
    : null;
  if (fitted) viewRef.current = fitted;
  const frame = fitted ?? view;

  useEffect(() => {
    if (!layout || initRef.current) return;
    initRef.current = true;
    const v = { x: layout.width / 2, y: layout.height / 2, s: 1 };
    viewRef.current = v;
    setView(v);
    onReady?.();
  }, [layout, onReady]);

  // Set the natural aspect ratio of one displayed media file. Idempotent, so a
  // repeat report of the same file does not re-render.
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
      const targetS = Math.min(
        maxSRef.current,
        Math.max(MIN_S, (metrics.h * DETAIL_HEIGHT_FRAC) / h)
      );
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
      const h = focused.w / Math.max(0.05, ratio);
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
    const h = focused.w / Math.max(0.05, ratio);
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
      const ns = Math.min(maxSRef.current, Math.max(MIN_S, cur.s * Math.exp(-e.deltaY * 0.0016)));
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
    const s = frame.s;
    const hw = (metrics.w / 2 + PAD) / s;
    const hh = (metrics.h / 2 + PAD) / s;
    const minX = frame.x - hw;
    const maxX = frame.x + hw;
    const minY = frame.y - hh;
    const maxY = frame.y + hh;

    for (const p of layout.positions) {
      if (p.x + p.w < minX || p.x > maxX || p.y + p.h < minY || p.y > maxY) continue;
      const tile = tiles[p.idx];
      cards.push({ key: tile.id, tile, x: p.x, y: p.y, w: p.w, h: p.h });
    }
  }

  const C = metrics?.center ?? { x: 0, y: 0 };
  const s = frame.s;
  const transform = C
    ? `translate(${C.x - s * frame.x}px, ${C.y - s * frame.y}px) scale(${s})`
    : "translate(0px, 0px) scale(1)";

  // Anchor the detail panel to the focused card's top-right corner (screen
  // space), sitting to the right of the image rather than the site's corner,
  // dropped ~80px so it reads below the card's top edge.
  let panelStyle = null;
  if (focused && metrics) {
    panelStyle = {
      left: metrics.w / 2 + s * (focused.x + focused.w - frame.x) + 14,
      top: metrics.h / 2 + s * (focused.y - frame.y) + 80,
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