import { Link } from "react-router-dom";

export default function GalleryCard({ slug, title, hero, featured = false }) {
  return (
    <Link
      to={`/work/${slug}`}
      className={`gallery-card${featured ? " gallery-card--featured" : ""}`}
    >
      <div className="gallery-media">
        {hero?.type === "video" ? (
          <video src={hero.src} muted autoPlay loop playsInline />
        ) : (
          <img src={hero?.src} alt={title} />
        )}
      </div>
      <div className="gallery-meta">
        <span className="gallery-title">{title}</span>
      </div>
    </Link>
  );
}
