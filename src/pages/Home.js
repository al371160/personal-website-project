import GalleryCard from "../components/GalleryCard";
import KoiPond from "../components/KoiPond";
import StickyBoard from "../components/StickyBoard";
import { projects } from "../data/projects";
import { useEffect, useRef } from "react";

const REVEAL_VARIANTS = ["left", "right", "left", "right", "left", "right"];
const CARD_RATIOS = ["16/9", "4/3", "3/2", "16/9", "4/3", "1/1"];

export default function Home({ onReady, onProgress }) {
  const pageRef   = useRef(null);
  const leftRef   = useRef(null);
  const rightRef  = useRef(null);

  // Page-load readiness (unchanged logic)
  useEffect(() => {
    let cancelled = false;
    const container = pageRef.current;
    if (!container) { onProgress?.(100); onReady?.(); return; }

    const imgs   = [...container.querySelectorAll("img")];
    const videos = [...container.querySelectorAll("video")];
    const total  = imgs.length + videos.length;
    if (total === 0) { onProgress?.(100); onReady?.(); return; }

    let completed = 0;
    const done = () => {
      if (cancelled) return;
      completed++;
      onProgress?.(Math.round((completed / total) * 100));
      if (completed >= total) onReady?.();
    };

    imgs.forEach(img => {
      if (img.complete) { done(); return; }
      img.addEventListener("load",  done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
    videos.forEach(v => {
      if (v.readyState >= 2) { done(); return; }
      v.addEventListener("loadeddata", done, { once: true });
      v.addEventListener("error",      done, { once: true });
    });

    const timeout = setTimeout(() => {
      if (!cancelled) { onProgress?.(100); onReady?.(); }
    }, 15000);

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [onReady, onProgress]);

  // Panel scroll-reveal (same IntersectionObserver pattern as GalleryCard)
  useEffect(() => {
    const entries = [
      { ref: leftRef,  delay: 0 },
      { ref: rightRef, delay: 0.13 },
    ];
    const observers = entries.map(({ ref, delay }) => {
      const el = ref.current;
      if (!el) return null;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}s`;
          el.classList.add("revealed");
          obs.unobserve(el);
          setTimeout(() => { if (el) el.style.transitionDelay = "0s"; }, (delay + 0.9) * 1000);
        }
      }, { threshold: 0.05, rootMargin: "0px 0px -20px 0px" });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  return (
    <main className="page" ref={pageRef}>
      <section className="hero-section">
        <div className="hero-panels">
          <div className="hero-panel hero-panel--left reveal-left" ref={leftRef}>
            <KoiPond />
          </div>
          <div className="hero-panel hero-panel--right reveal-right" ref={rightRef}>
            <StickyBoard />
          </div>
        </div>
      </section>

      <section className="gallery-section" id="gallery-section">
        <div className="gallery-section-header">
          <span className="gallery-section-label">Selected Work</span>
          <span className="gallery-section-count">— {projects.length}</span>
        </div>

        <div className="gallery">
          {projects.map((project, i) => (
            <GalleryCard
              key={project.slug}
              slug={project.slug}
              title={project.title}
              description={project.description}
              hero={project.thumbnail}
              revealVariant={REVEAL_VARIANTS[i % 2 === 0 ? 0 : 1]}
              revealDelay={0}
              aspectRatio={CARD_RATIOS[i % CARD_RATIOS.length]}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
