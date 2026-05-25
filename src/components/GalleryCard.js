import { Link } from "react-router-dom";
import { useRef, useEffect } from "react";

export default function GalleryCard({ slug, title, hero, revealVariant = "center", revealDelay = 0 }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${revealDelay}s`;
          el.classList.add("revealed");
          observer.unobserve(el);
          setTimeout(() => {
            if (el) el.style.transitionDelay = "0s";
          }, (revealDelay + 0.9) * 1000);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [revealDelay]);

  return (
    <Link
      to={`/work/${slug}`}
      className={`gallery-card reveal-${revealVariant}`}
      data-cursor-label={title}
      ref={cardRef}
    >
      <div className="gallery-media">
        {hero?.type === "video" ? (
          <video src={hero.src} muted autoPlay loop playsInline />
        ) : (
          <img src={hero?.src} alt={title} />
        )}
      </div>
    </Link>
  );
}
