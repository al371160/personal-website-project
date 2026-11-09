import { useCallback, useEffect, useRef, useState } from "react";

const SPRITE =
  "https://res.cloudinary.com/fet3ks1c/image/upload/v1793844397/Untitled_Artwork_81.png";
const X_URL = "https://x.com/a1ex1iu_cgart";
const LABEL = "Click me to go to my X!";

// Pixel bubble, 1 unit = 4px. Dark silhouette with a white face one unit inside.
// The tail is a short centered spike, like a pixel dialogue box.
const BUBBLE_BORDER =
  "M 2 0 H 74 V 2 H 76 V 6 H 74 V 8 H 44 V 9 H 42 V 10 H 40 V 11 H 36 V 10 H 34 V 9 H 32 V 8 H 2 V 6 H 0 V 2 H 2 V 0 Z";
const BUBBLE_FILL =
  "M 3 1 H 73 V 3 H 75 V 5 H 73 V 7 H 43 V 8 H 41 V 9 H 39 V 10 H 37 V 9 H 35 V 8 H 33 V 7 H 3 V 5 H 1 V 3 H 3 V 1 Z";

function readPerches(page) {
  const pageRect = page.getBoundingClientRect();
  return [...page.querySelectorAll("[data-bird-perch]")]
    .map((card) => {
      const media = card.querySelector(".gallery-media") || card;
      const rect = media.getBoundingClientRect();
      if (rect.width < 2) return null;
      return {
        x: rect.left - pageRect.left + rect.width / 2,
        y: rect.top - pageRect.top,
        settled: rect.height >= 2,
      };
    })
    .filter(Boolean);
}

function pickNext(count, current) {
  if (count < 2) return current;
  let next = Math.floor(Math.random() * (count - 1));
  if (next >= current) next += 1;
  return next;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

export default function HomeBird({ pageRef }) {
  const nodeRef = useRef(null);
  const perchesRef = useRef([]);
  const indexRef = useRef(0);
  const animRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [flying, setFlying] = useState(false);
  const [pointerHover, setPointerHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [landed, setLanded] = useState(0);

  const place = useCallback((point) => {
    const node = nodeRef.current;
    if (!node || !point) return;
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;
  }, []);

  const flyToNext = useCallback(() => {
    const perches = perchesRef.current;
    if (perches.length < 2 || animRef.current) return;

    const fromIndex = indexRef.current;
    const toIndex = pickNext(perches.length, fromIndex);
    const start = perches[fromIndex];
    const end = perches[toIndex];
    if (!start || !end) return;

    animRef.current = -1;
    setFlying(true);
    setPointerHover(false);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      indexRef.current = toIndex;
      place(perchesRef.current[toIndex] || end);
      animRef.current = 0;
      setFlying(false);
      setLanded((n) => n + 1);
      return;
    }

    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    const duration = Math.min(1200, Math.max(700, dist * 0.55));
    const lift = Math.min(80, Math.max(24, dist * 0.22));
    const t0 = performance.now();

    const tick = (now) => {
      const landing = perchesRef.current[toIndex] || end;
      const t = Math.min(1, (now - t0) / duration);
      const e = easeInOut(t);
      const x = start.x + (landing.x - start.x) * e;
      const arc = Math.sin(Math.PI * e) * lift;
      const bob = Math.sin(e * Math.PI * 5) * 3;
      const y = start.y + (landing.y - start.y) * e - arc + bob;
      place({ x, y });
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
        return;
      }
      indexRef.current = toIndex;
      animRef.current = 0;
      place(perchesRef.current[toIndex] || landing);
      setFlying(false);
      setLanded((n) => n + 1);
    };

    animRef.current = requestAnimationFrame(tick);
  }, [place]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    const measure = () => {
      const next = readPerches(page);
      perchesRef.current = next;
      if (!next.length) return;
      if (indexRef.current >= next.length) indexRef.current = 0;
      const point = next[indexRef.current];
      if (!animRef.current && point) place(point);
      if (point?.settled) setReady(true);
    };

    measure();
    const gallery = page.querySelector(".gallery");
    const observer = new ResizeObserver(measure);
    if (gallery) observer.observe(gallery);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pageRef, place]);

  useEffect(() => {
    return () => {
      if (animRef.current > 0) cancelAnimationFrame(animRef.current);
    };
  }, []);

  useEffect(() => {
    if (!ready || pointerHover || focused || flying) return undefined;
    const delay = 6000 + Math.random() * 4000;
    const id = window.setTimeout(flyToNext, delay);
    return () => window.clearTimeout(id);
  }, [ready, pointerHover, focused, flying, landed, flyToNext]);

  useEffect(() => {
    if (!pointerHover || flying) return undefined;
    const id = window.setTimeout(flyToNext, 3000);
    return () => window.clearTimeout(id);
  }, [pointerHover, flying, flyToNext]);

  const showBubble = pointerHover && !flying;
  const className = [
    "home-bird",
    ready ? "is-ready" : "",
    pointerHover && !flying ? "is-hovered" : "",
    flying ? "is-flying" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      ref={nodeRef}
      className={className}
      href={X_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={LABEL}
      onPointerEnter={() => {
        if (!animRef.current) setPointerHover(true);
      }}
      onPointerLeave={() => setPointerHover(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <img className="home-bird-sprite" src={SPRITE} alt="" data-bird-sprite="" draggable="false" />
      {showBubble && (
        <span className="home-bird-bubble" aria-hidden="true">
          <svg className="home-bird-bubble-shape" viewBox="0 0 76 12">
            <path d={BUBBLE_BORDER} fill="#243044" />
            <path d={BUBBLE_FILL} fill="#ffffff" />
          </svg>
          <span className="home-bird-bubble-text">{LABEL}</span>
        </span>
      )}
    </a>
  );
}
