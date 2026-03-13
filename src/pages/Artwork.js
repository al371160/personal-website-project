import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const VIDEO_EXTS = /\.(mp4|mov|webm|ogg|m4v|avi)(\?|$)/i;

function normalizeFiles(item) {
  if (item.files) return item.files;
  // legacy shape from old server format
  const urls = item.images ?? (item.imageUrl ? [item.imageUrl] : []);
  return urls.map((url) => ({ url, type: VIDEO_EXTS.test(url) ? "video" : "image" }));
}

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

        // Preload image thumbnails (skip videos — can't preload same way)
        const imageUrls = data
          .map((item) => normalizeFiles(item)[0])
          .filter((f) => f && f.type === "image")
          .map((f) => f.url);

        if (imageUrls.length === 0) { onReady?.(); return; }

        let remaining = imageUrls.length;
        const done = () => { if (--remaining <= 0) onReady?.(); };
        imageUrls.forEach((url) => {
          const img = new window.Image();
          img.onload = img.onerror = done;
          img.src = url;
        });
      })
      .catch(() => { setStatus("error"); onReady?.(); });
  }, [onReady]);

  const openLightbox = (item) => setLightbox({ item });
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
  const files = normalizeFiles(item);
  const hasMultiple = files.length > 1;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <figure className="art-card" onClick={onOpen} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}>
      {files[0] && (
        <div className="art-card-media">
          <MediaEl file={files[0]} alt={title} />
          {hasMultiple && (
            <div className="art-card-multi-badge" title={`${files.length} files`}>
              <MultiIcon />
              <span>{files.length}</span>
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
  const files = normalizeFiles(item);
  const [idx, setIdx] = useState(0);

  const prev = useCallback(() => setIdx((i) => (i - 1 + files.length) % files.length), [files.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % files.length), [files.length]);

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

        {/* Left — media + carousel */}
        <div className="lightbox-left">
          {files.length > 1 && (
            <button className="lightbox-arrow lightbox-arrow-left" onClick={prev} aria-label="Previous">‹</button>
          )}
          <MediaEl key={idx} file={files[idx]} alt={`${title} ${idx + 1}`} lightbox />
          {files.length > 1 && (
            <button className="lightbox-arrow lightbox-arrow-right" onClick={next} aria-label="Next">›</button>
          )}
          {files.length > 1 && (
            <div className="lightbox-dots">
              {files.map((_, i) => (
                <button key={i} className={`lightbox-dot${i === idx ? " active" : ""}`}
                  onClick={() => setIdx(i)} aria-label={`File ${i + 1}`} />
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

function MediaEl({ file, alt, lightbox = false }) {
  if (file.type === "video") {
    return (
      <video
        src={file.url}
        className={lightbox ? "lightbox-img" : undefined}
        muted
        autoPlay
        loop
        playsInline
        controls={lightbox}
      />
    );
  }
  return (
    <img
      src={file.url}
      alt={alt}
      className={lightbox ? "lightbox-img" : undefined}
      loading="lazy"
    />
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
