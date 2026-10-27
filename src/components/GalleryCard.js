import { useRef } from "react";
import { Link } from "react-router-dom";
import { optimizeImage } from "../utils/cloudinary";
import VideoPlayer from "./VideoPlayer";

// Cards are a third of the page (~500px); 2x covers retina, and phones show one full-width column.
const CARD_WIDTH = 1200;
const PREVIEW_SECONDS = 8;

export default function GalleryCard({ slug, title, hero, featured = false, placeholder = false }) {
  const videoRef = useRef(null);
  const isVideo = hero?.type === "video";

  if (placeholder) {
    return (
      <div
        className={`gallery-card gallery-card--placeholder${featured ? " gallery-card--featured" : ""}`}
        aria-label={`${title} — coming soon`}
      >
        <div className="gallery-media gallery-media--placeholder">
          <span className="gallery-placeholder-label">Coming soon</span>
        </div>
        <div className="gallery-meta">
          <span className="gallery-title">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/work/${slug}`}
      className={`gallery-card${featured ? " gallery-card--featured" : ""}`}
      onMouseEnter={isVideo ? () => videoRef.current?.play() : undefined}
      onMouseLeave={isVideo ? () => videoRef.current?.pause() : undefined}
    >
      <div className="gallery-media">
        {isVideo ? (
          <VideoPlayer
            ref={videoRef}
            src={hero.src}
            width={CARD_WIDTH}
            duration={PREVIEW_SECONDS}
            mode="hover"
            title={title}
          />
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
