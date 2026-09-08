import { useEffect, useState, useCallback } from "react";

const VIDEO_EXTS = /\.(mp4|mov|webm|ogg|m4v|avi)(\?|$)/i;

export function normalizeFiles(item) {
  if (item.files) return item.files;
  // legacy shape from old server format
  const urls = item.images ?? (item.imageUrl ? [item.imageUrl] : []);
  return urls.map((url) => ({ url, type: VIDEO_EXTS.test(url) ? "video" : "image" }));
}

export function MediaEl({ file, alt, lightbox = false, onLoad, mediaRef }) {
  if (file.type === "video") {
    return (
      <video
        ref={mediaRef}
        src={file.url}
        className={lightbox ? "lightbox-img" : undefined}
        muted
        autoPlay
        loop
        playsInline
        controls={lightbox}
        onLoadedData={onLoad}
      />
    );
  }
  return (
    <img
      ref={mediaRef}
      src={file.url}
      alt={alt}
      className={lightbox ? "lightbox-img" : undefined}
      loading="lazy"
      onLoad={onLoad}
    />
  );
}

export function MultiIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="1" width="9" height="9" rx="1.5" stroke="white" strokeWidth="1.2"/>
      <rect x="1" y="3" width="9" height="9" rx="1.5" fill="#161616" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}

export default function Lightbox({ item, onClose }) {
  const { title, date, description, kind } = item;
  const isWebgl = kind === "webgl";
  const Component = item.component;
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
          {isWebgl ? (
            Component ? (
              <div className="lightbox-stage">
                <Component />
              </div>
            ) : null
          ) : (
            <>
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
            </>
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