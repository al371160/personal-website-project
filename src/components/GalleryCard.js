import { Link } from "react-router-dom";
import { optimizeImage } from "../utils/cloudinary";

// Cards are a third of the page (~500px); 2x covers retina, and phones show one full-width column.
const CARD_WIDTH = 1200;

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
          <img src={optimizeImage(hero?.src, CARD_WIDTH)} alt={title} />
        )}
      </div>
      <div className="gallery-meta">
        <span className="gallery-title">{title}</span>
      </div>
    </Link>
  );
}
