import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export default function Artwork({ onReady }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetch("/api/artwork")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data) => {
        setItems(data);
        setStatus("ok");

        // Preload all card thumbnails before signalling ready
        const urls = data
          .map((item) => (item.images ?? (item.imageUrl ? [item.imageUrl] : []))[0])
          .filter(Boolean);

        if (urls.length === 0) { onReady?.(); return; }

        let remaining = urls.length;
        const done = () => { if (--remaining <= 0) onReady?.(); };
        urls.forEach((url) => {
          const img = new window.Image();
          img.onload = img.onerror = done;
          img.src = url;
        });
      })
      .catch(() => { setStatus("error"); onReady?.(); });
  }, [onReady]);

  const openLightbox = (item) => setLightbox({ item, index: 0 });
  const closeLightbox = () => setLightbox(null);

  return (
    <main className="page">
      <div className="subpage-header">
        <h3>GALLERY</h3>
        <h1>Artwork</h1>
      </div>

      {status === "loading" && <p className="subpage-empty">loading...</p>}
      {status === "error"   && <p className="subpage-empty">couldn't load artwork — check server connection.</p>}
      {status === "ok" && items.length === 0 && <p className="subpage-empty">no pieces yet — check back soon.</p>}

      {status === "ok" && items.length > 0 && (
        <section className="art-gallery">
          {items.map((item) => (
            <ArtCard key={item.id} item={item} onOpen={() => openLightbox(item)} />
          ))}
        </section>
      )}

      {lightbox && createPortal(
        <Lightbox item={lightbox.item} onClose={closeLightbox} />,
        document.body
      )}
    </main>
  );
}

function ArtCard({ item, onOpen }) {
  const { title, date, description } = item;
  const images = item.images ?? (item.imageUrl ? [item.imageUrl] : []);
  const hasMultiple = images.length > 1;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <figure className="art-card" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      {images[0] && (
        <div className="art-card-media">
          <img src={images[0]} alt={title} loading="lazy" />
          {hasMultiple && (
            <div className="art-card-multi-badge" title={`${images.length} images`}>
              <MultiIcon />
              <span>{images.length}</span>
            </div>
          )}
        </div>
      )}
      <figcaption className="art-card-info">
        <span className="art-card-title">{title}</span>
        {formattedDate && <span className="art-card-date">{formattedDate}</span>}
        {description && <p className="art-card-desc">{description}</p>}
      </figcaption>
    </figure>
  );
}

function Lightbox({ item, onClose }) {
  const { title, date, description } = item;
  const images = item.images ?? (item.imageUrl ? [item.imageUrl] : []);
  const [idx, setIdx] = useState(0);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-panel" onClick={(e) => e.stopPropagation()}>

        <button className="lightbox-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Left — image + carousel */}
        <div className="lightbox-left">
          {images.length > 1 && (
            <button className="lightbox-arrow lightbox-arrow-left" onClick={prev} aria-label="Previous">‹</button>
          )}
          <img key={idx} className="lightbox-img" src={images[idx]} alt={`${title} ${idx + 1}`} />
          {images.length > 1 && (
            <button className="lightbox-arrow lightbox-arrow-right" onClick={next} aria-label="Next">›</button>
          )}
          {images.length > 1 && (
            <div className="lightbox-dots">
              {images.map((_, i) => (
                <button key={i} className={`lightbox-dot${i === idx ? " active" : ""}`}
                  onClick={() => setIdx(i)} aria-label={`Image ${i + 1}`} />
              ))}
            </div>
          )}
        </div>

        {/* Right — info */}
        <div className="lightbox-right">
          <span className="lightbox-title">{title}</span>
          {formattedDate && <span className="lightbox-date">{formattedDate}</span>}
          {description && <p className="lightbox-desc">{description}</p>}
        </div>

      </div>
    </div>
  );
}

function MultiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="1" width="9" height="9" rx="1.5" stroke="white" strokeWidth="1.2"/>
      <rect x="1" y="3" width="9" height="9" rx="1.5" fill="#161616" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}
