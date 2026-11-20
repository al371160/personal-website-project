import { useEffect, useRef, useState } from "react";
import { PENN_CLUBS_FIGURES } from "./figures/pennClubs";
import { PACT_FIGURES } from "./figures/pact";
import { AEGIS_FIGURES } from "./figures/aegis";

const FIGURES = { ...PENN_CLUBS_FIGURES, ...PACT_FIGURES, ...AEGIS_FIGURES };

// Content block `{ type: "animation", name, caption }`: a looping SVG figure.
export default function AnimatedFigure({ name, caption }) {
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
    <figure ref={ref} className="detail-block detail-block--media anim-fig" data-playing={playing}>
      <Figure />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
