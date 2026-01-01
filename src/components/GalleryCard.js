import { Link } from "react-router-dom";

export default function GalleryCard({ slug, title, description, hero }) {
  return (
    <Link to={`/work/${slug}`} className="gallery-card">
      <div className="gallery-media">
        {hero?.type === "video" ? (
          <video
            src={hero.src}
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img src={hero?.src} alt={title} />
        )}
      </div>

      <div className="gallery-info">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </Link>
  );
}
