import { useCallback, useEffect, useRef, useState } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 1.0015;
const FRICTION = 0.93; // velocity decay per frame
const MIN_VELOCITY = 0.05; // stop inertia below this speed
const ZOOM_SMOOTH = 0.15; // ease factor per frame toward the target

export default function CanvasGallery({ children, zoomMin = MIN_ZOOM, zoomMax = MAX_ZOOM }) {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);

  const clampScale = useCallback(
    (s) => Math.min(zoomMax, Math.max(zoomMin, s)),
    [zoomMin, zoomMax]
  );

  const simRef = useRef({
    x: 0,
    y: 0,
    scale: 1,
    vx: 0,
    vy: 0,
    targetScale: null,
    cx: 0,
    cy: 0,
  });

  const applyTransform = useCallback(() => {
    const s = simRef.current;
    setTransform({ x: s.x, y: s.y, scale: s.scale });
  }, []);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const s = simRef.current;
      const target = clampScale(s.scale * Math.exp(-e.deltaY * ZOOM_STEP * 0.02));
      s.targetScale = target;
      s.cx = e.clientX - rect.left;
      s.cy = e.clientY - rect.top;
    },
    [clampScale]
  );

  const handlePointerDown = useCallback((e) => {
    if (e.target.closest?.(".canvas-card")) return;
    const s = simRef.current;
    s.active = true;
    s.vx = 0;
    s.vy = 0;
    s.startX = e.clientX;
    s.startY = e.clientY;
    s.originX = s.x;
    s.originY = s.y;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    setDragging(true);
    containerRef.current?.setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    const s = simRef.current;
    if (!s.active) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;
    s.vx = e.clientX - s.lastX;
    s.vy = e.clientY - s.lastY;
    s.x = s.originX + dx;
    s.y = s.originY + dy;
    s.lastX = e.clientX;
    s.lastY = e.clientY;
    applyTransform();
  }, [applyTransform]);

  const endDrag = useCallback(() => {
    simRef.current.active = false;
    setDragging(false);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Simulation loop: inertial pan + eased zoom
  useEffect(() => {
    let rafId;
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      const s = simRef.current;
      let changed = false;

      const speed = Math.hypot(s.vx, s.vy);
      if (speed > MIN_VELOCITY) {
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= FRICTION;
        s.vy *= FRICTION;
        changed = true;
      } else {
        s.vx = 0;
        s.vy = 0;
      }

      if (s.targetScale !== null && Math.abs(s.targetScale - s.scale) > 0.0005) {
        const prev = s.scale;
        s.scale += (s.targetScale - s.scale) * ZOOM_SMOOTH;
        const wx = (s.cx - s.x) / prev;
        const wy = (s.cy - s.y) / prev;
        s.x = s.cx - wx * s.scale;
        s.y = s.cy - wy * s.scale;
        changed = true;
      } else if (s.targetScale !== null) {
        s.targetScale = null;
      }

      if (changed) applyTransform();
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [applyTransform]);

  return (
    <div
      ref={containerRef}
      className="canvas-gallery"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{ cursor: dragging ? "grabbing" : "grab" }}
    >
      <div
        className="canvas-gallery-world"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
        }}
      >
        {children}
      </div>
    </div>
  );
}