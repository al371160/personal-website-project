import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Lightbox, { MediaEl, MultiIcon, normalizeFiles } from "../components/Lightbox";

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